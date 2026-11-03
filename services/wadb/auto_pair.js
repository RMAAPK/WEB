import pkg from '@whiskeysockets/baileys';
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers } = pkg;
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const accountType = process.argv[2] || 'personal';
const phoneNumbers = {
    personal: '923309246239',
    business: '923440708494'
};

const targetNumber = phoneNumbers[accountType];
const authFolder = `/tmp/wa_auth_${accountType}`;

console.log(`================================================================`);
console.log(` WA-DB: Automated Pairing Code Requester`);
console.log(` Account Type : ${accountType.toUpperCase()}`);
console.log(` Phone Number : +${targetNumber}`);
console.log(` Target Dir   : ${authFolder}`);
console.log(`================================================================`);

async function startSock() {
    const { state, saveCreds } = await useMultiFileAuthState(authFolder);
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`[+] WhatsApp Web Protocol: v${version.join('.')} (Latest: ${isLatest})`);

    const sock = (makeWASocket || pkg)({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: Browsers.ubuntu('Chrome'),
        syncFullHistory: false
    });

    sock.ev.on('creds.update', saveCreds);

    if (!sock.authState.creds.registered) {
        console.log(`[*] Requesting pairing code from WhatsApp servers...`);
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(targetNumber);
                const formatted = code?.match(/.{1,4}/g)?.join('-') || code;
                console.log(`\n========================================================`);
                console.log(` 🔥 YOUR ${accountType.toUpperCase()} PAIRING CODE IS:  \x1b[1m\x1b[32m${formatted}\x1b[0m (Raw: ${code})`);
                console.log(`========================================================`);

                // Auto inject via ADB if device attached
                try {
                    console.log(`[*] Auto-typing code ${code} into phone via ADB...`);
                    execSync(`adb shell input text "${code}"`);
                    console.log(`[+] Injected successfully into phone screen!`);
                } catch (adbErr) {
                    console.warn(`[!] ADB inject warning: ${adbErr.message}`);
                }

                console.log(`[*] Waiting for you to confirm on your phone...`);
            } catch (err) {
                console.error('[-] Error requesting pairing code:', err.message);
            }
        }, 3000);
    }

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

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
            console.log(` ✅ SUCCESS: [${accountType.toUpperCase()}] WHATSAPP AUTHENTICATED!`);
            console.log(` Tokens saved at: ${authFolder}`);
            console.log(`========================================================\n`);

            const credsPath = path.join(authFolder, 'creds.json');
            if (fs.existsSync(credsPath)) {
                const credsData = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
                console.log(`[+] Registered Account Name : ${credsData.me?.name || 'N/A'}`);
                console.log(`[+] Registered WhatsApp JID  : ${credsData.me?.id || 'N/A'}`);
            }

            console.log(`\n[+] Credentials captured! Ready to encode.`);
            process.exit(0);
        }
    });
}

startSock();

