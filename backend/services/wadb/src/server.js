import express from 'express';
import { config } from './config.js';
import { pool } from './db.js';

export function createServer(sentinels) {
    const app = express();
    const startTime = Date.now();

    app.use(express.json());

    // Healthcheck & Self-Ping endpoint
    app.get(['/ping', '/health'], (req, res) => {
        res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Detailed Sentinel Dashboard
    app.get('/', async (req, res) => {
        let dbStatus = 'disconnected';
        let stats = { personal: {}, business: {} };

        try {
            const client = await pool.connect();
            dbStatus = 'connected';

            // Query basic counts
            const personalMsgs = await client.query('SELECT COUNT(*) FROM personal.messages');
            const personalCalls = await client.query('SELECT COUNT(*) FROM personal.rejected_calls');
            const businessMsgs = await client.query('SELECT COUNT(*) FROM business.messages');
            const businessCalls = await client.query('SELECT COUNT(*) FROM business.rejected_calls');

            client.release();

            stats.personal = {
                messagesLogged: parseInt(personalMsgs.rows[0]?.count || '0', 10),
                callsRejected: parseInt(personalCalls.rows[0]?.count || '0', 10)
            };
            stats.business = {
                messagesLogged: parseInt(businessMsgs.rows[0]?.count || '0', 10),
                callsRejected: parseInt(businessCalls.rows[0]?.count || '0', 10)
            };
        } catch (dbErr) {
            dbStatus = `error: ${dbErr.message}`;
        }

        const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

        res.json({
            name: 'WA-DB Sentinel Service',
            uptime: `${Math.floor(uptimeSeconds / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m ${uptimeSeconds % 60}s`,
            uptimeSeconds,
            database: dbStatus,
            accounts: {
                personal: {
                    status: sentinels.personal?.status || 'unknown',
                    jid: sentinels.personal?.user?.id || null,
                    name: sentinels.personal?.user?.name || null,
                    stats: stats.personal
                },
                business: {
                    status: sentinels.business?.status || 'unknown',
                    jid: sentinels.business?.user?.id || null,
                    name: sentinels.business?.user?.name || null,
                    stats: stats.business
                }
            },
            memory: process.memoryUsage()
        });
    });

    // Start listening
    const server = app.listen(config.port, () => {
        console.log(`[HTTP] 🌐 Sentinel Server listening on port ${config.port}`);
    });

    // 14-Minute Self-Ping Keep-Alive
    if (config.renderExternalUrl && config.autoPingIntervalMinutes > 0) {
        const pingIntervalMs = config.autoPingIntervalMinutes * 60 * 1000;
        const pingUrl = `${config.renderExternalUrl.replace(/\/$/, '')}/ping`;

        console.log(`[KEEP-ALIVE] ⏱️ Self-ping scheduled every ${config.autoPingIntervalMinutes} mins to ${pingUrl}`);

        setInterval(async () => {
            try {
                console.log(`[KEEP-ALIVE] 📡 Pinging ${pingUrl} to prevent Render 15-min idle sleep...`);
                const response = await fetch(pingUrl);
                console.log(`[KEEP-ALIVE] Response: HTTP ${response.status}`);
            } catch (pingErr) {
                console.warn(`[KEEP-ALIVE] Ping failed:`, pingErr.message);
            }
        }, pingIntervalMs);
    }

    return server;
}

