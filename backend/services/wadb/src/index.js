import { testConnection } from './db.js';
import { WhatsAppSentinel } from './sentinel.js';
import { createServer } from './server.js';
import { config } from './config.js';

console.log(`================================================================`);
console.log(` 🛡️  WA-DB: Dual WhatsApp Archiving & Sentinel Daemon`);
console.log(` Environment : ${config.nodeEnv}`);
console.log(` Port        : ${config.port}`);
console.log(`================================================================\n`);

async function main() {
    // 1. Check PostgreSQL Database Connection
    const dbOk = await testConnection();
    if (!dbOk) {
        console.error('[FATAL] Database connection could not be established. Check DATABASE_URL.');
    }

    // 2. Initialize Sentinels
    const sentinels = {
        personal: new WhatsAppSentinel('personal'),
        business: new WhatsAppSentinel('business')
    };

    // 3. Launch HTTP Monitoring Server
    createServer(sentinels);

    // 4. Start Both WhatsApp Sockets Concurrently
    console.log('[BOOT] Initializing Personal & Business WhatsApp Sentinels in parallel...\n');
    await Promise.allSettled([
        sentinels.personal.start(),
        sentinels.business.start()
    ]);

    // Handle Graceful Termination
    const shutdown = async (signal) => {
        console.log(`\n[SHUTDOWN] Received ${signal}. Gracefully stopping sentinels...`);
        try {
            if (sentinels.personal.sock) sentinels.personal.sock.end();
            if (sentinels.business.sock) sentinels.business.sock.end();
        } catch (e) {
            // ignore
        }
        process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
    console.error('[FATAL] Unexpected error in main daemon:', err);
    process.exit(1);
});

