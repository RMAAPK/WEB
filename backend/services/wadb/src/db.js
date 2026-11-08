import pg from 'pg';
import { config } from './config.js';

const { Pool } = pg;

const cleanDbUrl = config.databaseUrl.replace(/[\?&]sslmode=[^&]+/, '');

export const pool = new Pool({
    connectionString: cleanDbUrl,
    ssl: { rejectUnauthorized: false },
    max: 15,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
});

pool.on('error', (err) => {
    console.error('[DB] Unexpected error on idle client:', err.message);
});

export async function testConnection() {
    try {
        const client = await pool.connect();
        const res = await client.query('SELECT NOW() as now, current_database() as db');
        client.release();
        console.log(`[DB] Connected to PostgreSQL (${res.rows[0].db}) at ${res.rows[0].now}`);
        return true;
    } catch (err) {
        console.error('[DB] Connection test failed:', err.message);
        return false;
    }
}

/**
 * Upsert or insert a chat into {schema}.chats
 */
export async function upsertChat(schema, chat) {
    if (!chat.id) return;
    const query = `
        INSERT INTO ${schema}.chats (chat_jid, name, is_group, unread_count, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (chat_jid) DO UPDATE SET
            name = COALESCE(EXCLUDED.name, ${schema}.chats.name),
            unread_count = EXCLUDED.unread_count,
            updated_at = NOW();
    `;
    try {
        await pool.query(query, [
            chat.id,
            chat.name || null,
            chat.id.endsWith('@g.us'),
            chat.unreadCount || 0
        ]);
    } catch (err) {
        console.error(`[DB:${schema}] Failed to upsert chat ${chat.id}:`, err.message);
    }
}

/**
 * Upsert contact into {schema}.contacts
 */
export async function upsertContact(schema, contact) {
    if (!contact.id) return;
    const query = `
        INSERT INTO ${schema}.contacts (jid, phone_number, push_name, verified_name, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (jid) DO UPDATE SET
            push_name = COALESCE(EXCLUDED.push_name, ${schema}.contacts.push_name),
            verified_name = COALESCE(EXCLUDED.verified_name, ${schema}.contacts.verified_name),
            updated_at = NOW();
    `;
    try {
        const phoneNumber = contact.id.split('@')[0];
        await pool.query(query, [
            contact.id,
            phoneNumber,
            contact.notify || contact.name || null,
            contact.verifiedName || null
        ]);
    } catch (err) {
        console.error(`[DB:${schema}] Failed to upsert contact ${contact.id}:`, err.message);
    }
}

/**
 * Insert incoming/outgoing message into {schema}.messages
 */
export async function insertMessage(schema, msg) {
    if (!msg.messageId || !msg.chatJid) return;

    // Ensure chat exists before referencing chat_jid
    await pool.query(`
        INSERT INTO ${schema}.chats (chat_jid, is_group, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (chat_jid) DO NOTHING;
    `, [msg.chatJid, msg.chatJid.endsWith('@g.us')]);

    const query = `
        INSERT INTO ${schema}.messages (
            message_id, chat_jid, sender_jid, is_from_me,
            timestamp, message_type, body, raw_payload,
            is_deleted, is_view_once, is_ephemeral
        ) VALUES (
            $1, $2, $3, $4,
            $5, $6, $7, $8,
            false, $9, $10
        )
        ON CONFLICT (message_id) DO UPDATE SET
            body = COALESCE(EXCLUDED.body, ${schema}.messages.body);
    `;
    try {
        await pool.query(query, [
            msg.messageId,
            msg.chatJid,
            msg.senderJid,
            msg.fromMe,
            msg.createdAt ? new Date(msg.createdAt * 1000) : new Date(),
            msg.messageType,
            msg.textContent || null,
            JSON.stringify(msg.rawPayload || {}),
            msg.isViewOnce || false,
            msg.isEphemeral || false
        ]);
    } catch (err) {
        console.error(`[DB:${schema}] Failed to insert message ${msg.messageId}:`, err.message);
    }
}

/**
 * Batch insert historical messages with transaction for high performance
 */
export async function batchInsertMessages(schema, messagesList) {
    if (!messagesList || messagesList.length === 0) return 0;
    const client = await pool.connect();
    let count = 0;
    try {
        await client.query('BEGIN');
        for (const msg of messagesList) {
            if (!msg.messageId || !msg.chatJid) continue;

            await client.query(`
                INSERT INTO ${schema}.chats (chat_jid, is_group, updated_at)
                VALUES ($1, $2, NOW())
                ON CONFLICT (chat_jid) DO NOTHING;
            `, [msg.chatJid, msg.chatJid.endsWith('@g.us')]);

            const query = `
                INSERT INTO ${schema}.messages (
                    message_id, chat_jid, sender_jid, is_from_me,
                    timestamp, message_type, body, raw_payload,
                    is_deleted, is_view_once, is_ephemeral
                ) VALUES (
                    $1, $2, $3, $4,
                    $5, $6, $7, $8,
                    false, $9, $10
                )
                ON CONFLICT (message_id) DO NOTHING;
            `;
            await client.query(query, [
                msg.messageId,
                msg.chatJid,
                msg.senderJid,
                msg.fromMe,
                msg.createdAt ? new Date(msg.createdAt * 1000) : new Date(),
                msg.messageType,
                msg.textContent || null,
                JSON.stringify(msg.rawPayload || {}),
                msg.isViewOnce || false,
                msg.isEphemeral || false
            ]);
            count++;
        }
        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[DB:${schema}] Batch insert error:`, err.message);
    } finally {
        client.release();
    }
    return count;
}

/**
 * Mark message as deleted (REVOKE protocol message)
 */
export async function markMessageDeleted(schema, messageId) {
    const query = `
        UPDATE ${schema}.messages
        SET is_deleted = true, deleted_at = NOW()
        WHERE message_id = $1;
    `;
    try {
        const res = await pool.query(query, [messageId]);
        if (res.rowCount > 0) {
            console.log(`[ANTI-DELETE:${schema}] 🛡️ Preserved deleted message ${messageId} in database!`);
        } else {
            console.log(`[ANTI-DELETE:${schema}] Revoke received for message ${messageId} (not in cache)`);
        }
    } catch (err) {
        console.error(`[DB:${schema}] Failed to mark message deleted ${messageId}:`, err.message);
    }
}

/**
 * Insert or record media in {schema}.media
 */
export async function insertMedia(schema, media) {
    const query = `
        INSERT INTO ${schema}.media (
            message_id, media_type, mimetype, file_size_bytes,
            file_hash_sha256, s3_bucket, s3_key, public_url, is_view_once
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id;
    `;
    try {
        const res = await pool.query(query, [
            media.messageId,
            media.mediaType || 'unknown',
            media.mimeType,
            media.fileSize || 0,
            media.fileSha256 || null,
            media.s3Bucket || config.supabaseBucket,
            media.s3Key,
            media.s3Url || null,
            media.isViewOnce || false
        ]);
        return res.rows[0]?.id;
    } catch (err) {
        console.error(`[DB:${schema}] Failed to insert media for message ${media.messageId}:`, err.message);
        return null;
    }
}

/**
 * Record rejected call in {schema}.rejected_calls
 */
export async function recordRejectedCall(schema, callData) {
    const query = `
        INSERT INTO ${schema}.rejected_calls (
            call_id, caller_jid, caller_phone, is_video, is_group,
            call_status, auto_replied, auto_reply_text, auto_reply_sent_at,
            created_at, raw_metadata
        ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9,
            $10, $11
        );
    `;
    try {
        const callerPhone = (callData.callerJid || '').split('@')[0];
        await pool.query(query, [
            callData.callId,
            callData.callerJid,
            callerPhone,
            callData.isVideo || false,
            callData.isGroup || false,
            callData.status || 'rejected',
            callData.autoReplied || false,
            callData.autoReplyText || config.callRejectMessage,
            callData.autoReplied ? new Date() : null,
            callData.timestamp ? new Date(callData.timestamp * 1000) : new Date(),
            JSON.stringify(callData.rawMetadata || {})
        ]);
        console.log(`[CALL-CUTTER:${schema}] 📞 Logged rejected call ${callData.callId} from ${callData.callerJid}`);
    } catch (err) {
        console.error(`[DB:${schema}] Failed to record rejected call:`, err.message);
    }
}
