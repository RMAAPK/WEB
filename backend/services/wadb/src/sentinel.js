import pkg from '@whiskeysockets/baileys';
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers } = pkg;
import pino from 'pino';
import { ensureAuthDir } from './config.js';
import { setupMessageHandler } from './handlers/message.js';
import { setupCallCutter } from './handlers/callCutter.js';
import { pool } from './db.js';

export class WhatsAppSentinel {
    constructor(accountType) {
        this.accountType = accountType; // 'personal' or 'business'
        this.sock = null;
        this.status = 'initializing';
        this.user = null;
        this.reconnectAttempts = 0;
        this.authFolder = null;
    }

    async start() {
        console.log(`[SENTINEL:${this.accountType}] Starting socket lifecycle...`);
        this.authFolder = await ensureAuthDir(this.accountType);
        const { state, saveCreds } = await useMultiFileAuthState(this.authFolder);
        const { version, isLatest } = await fetchLatestBaileysVersion();

        this.sock = (makeWASocket || pkg)({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            auth: state,
            browser: Browsers.ubuntu('Chrome'),
            syncFullHistory: true,
            shouldSyncHistoryMessage: () => true
        });

        // 1. Sync credentials to disk and database
        this.sock.ev.on('creds.update', async () => {
            await saveCreds();
            try {
                const credsJson = JSON.stringify(this.sock.authState.creds);
                await pool.query(`
                    INSERT INTO ${this.accountType}.auth_sessions (key_type, key_id, key_data, updated_at)
                    VALUES ('creds', 'main', $1::jsonb, NOW())
                    ON CONFLICT (key_type, key_id) DO UPDATE SET
                        key_data = EXCLUDED.key_data,
                        updated_at = NOW();
                `, [credsJson]);
            } catch (dbErr) {
                // non-blocking
            }
        });

        // 2. Setup core event interceptors
        setupMessageHandler(this.sock, this.accountType);
        setupCallCutter(this.sock, this.accountType);

        // 3. Monitor connection health & reconnect
        this.sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === 'close') {
                this.status = 'disconnected';
                const statusCode = (lastDisconnect?.error)?.output?.statusCode;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                console.log(`[SENTINEL:${this.accountType}] ⚠️ Connection closed (code: ${statusCode}). Reconnecting: ${shouldReconnect}`);

                if (shouldReconnect) {
                    this.reconnectAttempts++;
                    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 15000);
                    console.log(`[SENTINEL:${this.accountType}] Reconnecting in ${delay / 1000}s ...`);
                    setTimeout(() => this.start(), delay);
                } else {
                    console.error(`[SENTINEL:${this.accountType}] ❌ Device logged out. Manual re-pairing required.`);
                    this.status = 'logged_out';
                }
            } else if (connection === 'open') {
                this.status = 'connected';
                this.reconnectAttempts = 0;
                this.user = this.sock.user;
                console.log(`\n============================================================`);
                console.log(` 🟢 [SENTINEL:${this.accountType.toUpperCase()}] ACTIVE & MONITORING`);
                console.log(` JID  : ${this.user?.id}`);
                console.log(` Name : ${this.user?.name || 'Verified'}`);
                console.log(`============================================================\n`);
            }
        });

        return this.sock;
    }
}

