import pkg from '@whiskeysockets/baileys';
const { downloadMediaMessage, getContentType } = pkg;
import { insertMessage, batchInsertMessages, markMessageDeleted, insertMedia, upsertChat, upsertContact } from '../db.js';
import { uploadMedia } from '../storage.js';
import { config } from '../config.js';
import crypto from 'crypto';

export function setupMessageHandler(sock, schema) {
    // 1. Process incoming and outgoing messages
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        for (const msg of messages) {
            if (!msg.message) continue;

            const messageId = msg.key.id;
            const chatJid = msg.key.remoteJid;
            const senderJid = msg.key.participant || chatJid;
            const fromMe = Boolean(msg.key.fromMe);
            const contentType = getContentType(msg.message);

            // Ignore status broadcasts if preferred or log them
            if (chatJid === 'status@broadcast') continue;

            // Check for Protocol Message (Delete / Revoke / Ephemeral)
            if (contentType === 'protocolMessage') {
                const protocolMsg = msg.message.protocolMessage;
                // type 0 is REVOKE (Delete for everyone)
                if (protocolMsg?.type === 0 || protocolMsg?.type === 'REVOKE') {
                    const targetId = protocolMsg.key?.id;
                    if (targetId) {
                        console.log(`[ANTI-DELETE:${schema}] 🚨 Revoke request caught for message ${targetId}!`);
                        await markMessageDeleted(schema, targetId);
                    }
                }
                continue;
            }

            // Detect View-Once
            let isViewOnce = false;
            let actualMsg = msg.message;
            let effectiveType = contentType;

            if (contentType === 'viewOnceMessage' || contentType === 'viewOnceMessageV2' || contentType === 'viewOnceMessageV2Extension') {
                isViewOnce = true;
                actualMsg = msg.message[contentType]?.message;
                effectiveType = getContentType(actualMsg);
                console.log(`[VIEW-ONCE:${schema}] 👁️ Detected View-Once message (${effectiveType}) from ${senderJid}`);
            }

            // Extract Text Content
            let textContent = '';
            if (effectiveType === 'conversation') {
                textContent = actualMsg.conversation;
            } else if (effectiveType === 'extendedTextMessage') {
                textContent = actualMsg.extendedTextMessage?.text;
            } else if (actualMsg[effectiveType]?.caption) {
                textContent = actualMsg[effectiveType].caption;
            }

            // Handle Media & View-Once Buffer Extraction
            let mediaId = null;
            const mediaTypes = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'];
            if (isViewOnce || mediaTypes.includes(effectiveType)) {
                try {
                    const mediaObj = actualMsg[effectiveType];
                    const mimeType = mediaObj?.mimetype || 'application/octet-stream';

                    if (isViewOnce && config.enableViewOnceExtraction) {
                        console.log(`[VIEW-ONCE:${schema}] 📥 Downloading media buffer for ${messageId} ...`);
                        const buffer = await downloadMediaMessage(
                            msg,
                            'buffer',
                            {},
                            {
                                logger: sock.logger,
                                reuploadRequest: sock.updateMediaMessage
                            }
                        );

                        if (buffer && buffer.length > 0) {
                            const ext = mimeType.split('/')[1]?.split(';')[0] || 'bin';
                            const fileName = `${Date.now()}_${messageId}.${ext}`;
                            const fileSha256 = crypto.createHash('sha256').update(buffer).digest('hex');

                            // Upload to Supabase Storage
                            const uploadResult = await uploadMedia(schema, buffer, fileName, mimeType, true);

                            // Save Media record in DB
                            mediaId = await insertMedia(schema, {
                                messageId,
                                mediaType: effectiveType,
                                fileName,
                                fileSize: buffer.length,
                                mimeType,
                                fileSha256,
                                s3Bucket: uploadResult.s3Bucket,
                                s3Key: uploadResult.s3Key,
                                s3Url: uploadResult.s3Url,
                                isViewOnce: true
                            });

                            console.log(`[VIEW-ONCE:${schema}] ✅ Securely archived View-Once media to: ${uploadResult.s3Url || uploadResult.s3Key}`);
                        }
                    }
                } catch (mediaErr) {
                    console.error(`[MEDIA:${schema}] Failed to extract media for ${messageId}:`, mediaErr.message);
                }
            }

            // Insert into messages table
            await insertMessage(schema, {
                messageId,
                chatJid,
                senderJid,
                fromMe,
                messageType: effectiveType,
                textContent,
                mediaId,
                isViewOnce,
                isEphemeral: Boolean(msg.message?.ephemeralMessage),
                ephemeralDuration: msg.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.expiration || null,
                createdAt: msg.messageTimestamp,
                rawPayload: msg
            });

            console.log(`[MSG:${schema}] 📝 Saved message [${effectiveType}] ${messageId} from ${senderJid}`);
        }
    });

    // 2. Track Chats and Contacts updates
    sock.ev.on('chats.upsert', (chats) => {
        for (const chat of chats) {
            upsertChat(schema, chat);
        }
    });

    sock.ev.on('contacts.upsert', (contacts) => {
        for (const contact of contacts) {
            upsertContact(schema, contact);
        }
    });

    // 3. Process Full Chat History Sync from WhatsApp
    sock.ev.on('messaging-history.set', async ({ chats, contacts, messages, isLatest, syncType }) => {
        console.log(`[HISTORY:${schema}] 📜 Received WhatsApp History Sync: ${messages?.length || 0} messages, ${chats?.length || 0} chats, ${contacts?.length || 0} contacts (syncType: ${syncType})`);

        if (contacts?.length) {
            for (const contact of contacts) {
                await upsertContact(schema, contact);
            }
        }

        if (chats?.length) {
            for (const chat of chats) {
                await upsertChat(schema, chat);
            }
        }

        if (messages?.length) {
            const batch = [];
            for (const msg of messages) {
                if (!msg.message) continue;
                const messageId = msg.key.id;
                const chatJid = msg.key.remoteJid;
                const senderJid = msg.key.participant || chatJid;
                const fromMe = Boolean(msg.key.fromMe);
                const contentType = getContentType(msg.message);

                if (chatJid === 'status@broadcast') continue;

                let textContent = '';
                if (contentType === 'conversation') {
                    textContent = msg.message.conversation;
                } else if (contentType === 'extendedTextMessage') {
                    textContent = msg.message.extendedTextMessage?.text;
                } else if (msg.message[contentType]?.caption) {
                    textContent = msg.message[contentType].caption;
                }

                batch.push({
                    messageId,
                    chatJid,
                    senderJid,
                    fromMe,
                    messageType: contentType || 'unknown',
                    textContent,
                    isViewOnce: Boolean(msg.message?.viewOnceMessage || msg.message?.viewOnceMessageV2),
                    isEphemeral: Boolean(msg.message?.ephemeralMessage),
                    createdAt: msg.messageTimestamp,
                    rawPayload: msg
                });
            }

            const inserted = await batchInsertMessages(schema, batch);
            console.log(`[HISTORY:${schema}] 💾 Successfully saved ${inserted} historical messages into ${schema}.messages!`);
        }
    });

    console.log(`[MSG:${schema}] Message handler active and recording.`);
}

