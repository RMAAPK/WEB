import { recordRejectedCall } from '../db.js';
import { config } from '../config.js';

export function setupCallCutter(sock, schema) {
    if (!config.enableCallCutter) {
        console.log(`[CALL-CUTTER:${schema}] Call cutter disabled by config.`);
        return;
    }

    sock.ev.on('call', async (calls) => {
        for (const call of calls) {
            console.log(`[CALL-CUTTER:${schema}] 📞 Detected call event: ID=${call.id}, from=${call.from}, status=${call.status}, isVideo=${call.isVideo}`);

            // Only act on incoming ring ('offer')
            if (call.status === 'offer') {
                try {
                    // 1. Immediately reject call
                    console.log(`[CALL-CUTTER:${schema}] ✂️ Rejecting incoming call ${call.id} ...`);
                    await sock.rejectCall(call.id, call.from);

                    // 2. Send automated cold message
                    let replySent = false;
                    try {
                        await sock.sendMessage(call.from, { text: config.callRejectMessage });
                        replySent = true;
                        console.log(`[CALL-CUTTER:${schema}] 💬 Sent auto-reply: "${config.callRejectMessage}" to ${call.from}`);
                    } catch (replyErr) {
                        console.error(`[CALL-CUTTER:${schema}] Failed to send auto-reply message:`, replyErr.message);
                    }

                    // 3. Record in database
                    await recordRejectedCall(schema, {
                        callId: call.id,
                        callerJid: call.from,
                        isVideo: call.isVideo || false,
                        isGroup: call.isGroup || false,
                        status: 'rejected',
                        autoReplied: replySent,
                        autoReplyText: config.callRejectMessage,
                        timestamp: call.date ? Math.floor(new Date(call.date).getTime() / 1000) : Math.floor(Date.now() / 1000),
                        rawMetadata: call
                    });

                } catch (err) {
                    console.error(`[CALL-CUTTER:${schema}] Error rejecting call ${call.id}:`, err.message);
                }
            }
        }
    });

    console.log(`[CALL-CUTTER:${schema}] Active and listening for incoming calls.`);
}

