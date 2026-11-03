import pkg from '@whiskeysockets/baileys';
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers } = pkg;
import pino from 'pino';
import qrcodeTerminal from 'qrcode-terminal';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

const accountType = process.argv[2] || 'personal';
const authFolder = `/tmp/wa_auth_${accountType}`;
const qrImgPath = `/tmp/wa_qr_${accountType}.png`;
const artifactQrPath = `/home/thealidev/.gemini/antigravity/brain/3ed80e66-ab2b-45e8-9514-1333003cf5b6/qr_${accountType}.png`;

console.log(`================================================================`);
console.log(` WA-DB: Instant QR Pairer`);
console.log(` Account Type : ${accountType.toUpperCase()}`);
console.log(` Target Dir   : ${authFolder}`);
console.log(`================================================================`);

async function startSock() {
    const { state, saveCreds } = await useMultiFileAuthState(authFolder);
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`[+] WhatsApp Protocol: v${version.join('.')} (Latest: ${isLatest})`);

    const sock = (makeWASocket || pkg)({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: Browsers.ubuntu('Chrome'),
        syncFullHistory: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log(`\n================================================================`);
            console.log(` 📷 SCAN THIS QR CODE WITH YOUR PHONE CAMERA IN WHATSAPP:`);
            console.log(`================================================================\n`);
            qrcodeTerminal.generate(qr, { small: true });

            try {
                await QRCode.toFile(qrImgPath, qr, { width: 400 });
                await QRCode.toFile(artifactQrPath, qr, { width: 400 });
                console.log(`\n[+] QR Code image saved to: ${qrImgPath} and ${artifactQrPath}`);
                if (process.env.DISPLAY) {
                    exec(`xdg-open "${qrImgPath}" 2>/dev/null || true`);
                }
            } catch (qrErr) {
                console.error('[-] Failed to write QR image:', qrErr.message);
            }
        }

        if (connection === 'close') {
            const statusCode = (lastDisconnect?.error)?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            console.log(`[!] Connection closed (code: ${statusCode}). Reconnecting: ${shouldReconnect}`);
            if (shouldReconnect) {
                startSock();
            } else {
                console.log(`[-] Device logged out.`);
                process.exit(1);
            }
        } else if (connection === 'open') {
            console.log(`\n========================================================`);
            console.log(` 🎉 SUCCESS: [${accountType.toUpperCase()}] WHATSAPP AUTHENTICATED!`);
            console.log(` Credentials secured in: ${authFolder}`);
            console.log(`========================================================\n`);

            console.log(`[+] User JID  : ${sock.user?.id || 'Connected'}`);
            console.log(`[+] User Name : ${sock.user?.name || 'Verified'}`);

            // Allow disk flush
            setTimeout(() => {
                try {
                    const credsPath = path.join(authFolder, 'creds.json');
                    if (fs.existsSync(credsPath)) {
                        const content = fs.readFileSync(credsPath, 'utf8');
                        if (content.trim()) {
                            const credsData = JSON.parse(content);
                            console.log(`[+] Confirmed Creds JID: ${credsData.me?.id}`);
                        }
                    }
                } catch (e) {
                    console.warn(`[!] Creds read notice: ${e.message}`);
                }
                console.log(`\n[+] Done! Session ready.`);
                process.exit(0);
            }, 3000);
        }
    });
}

startSock();
