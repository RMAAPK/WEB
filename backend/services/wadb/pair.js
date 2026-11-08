import makeWASocket, { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import pino from 'pino';
import readline from 'readline';
import fs from 'fs';
import path from 'path';

const accountType = process.argv[2] || 'personal'; // 'personal' or 'business'
const authFolder = `/tmp/wa_auth_${accountType}`;

console.log(`================================================================`);
console.log(` WA-DB: Phone Number Pairing Initiator [${accountType.toUpperCase()}]`);
console.log(` Target Storage Path: ${authFolder}`);
console.log(`================================================================`);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function startSock() {
    const { state, saveCreds } = await useMultiFileAuthState(authFolder);
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`[+] Using WhatsApp Web version: v${version.join('.')} (Latest: ${isLatest})`);

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: ['Ubuntu', 'Chrome', '120.0.0.0']
    });

    sock.ev.on('creds.update', saveCreds);

    if (!sock.authState.creds.registered) {
        console.log(`\n[*] Device is not yet linked.`);
        const phoneNumber = await question('Enter your WhatsApp Phone Number (with Country Code, e.g. 923440708494): ');
        const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');

        if (!cleanNumber) {
            console.error('[-] Invalid phone number provided. Exiting.');
            process.exit(1);
        }

        console.log(`[+] Requesting 8-digit Pairing Code for: +${cleanNumber} ...`);
        try {
            // Request pairing code from WhatsApp servers
            setTimeout(async () => {
                const code = await sock.requestPairingCode(cleanNumber);
                console.log(`\n========================================================`);
                console.log(` 🔥 YOUR WHATSAPP PAIRING CODE IS:  \x1b[1m\x1b[32m${code}\x1b[0m`);
                console.log(`========================================================`);
                console.log(`Instructions:`);
                console.log(`1. Open WhatsApp on your phone.`);
                console.log(`2. Tap Settings > Linked Devices > Link a Device.`);
                console.log(`3. Tap "Link with phone number instead".`);
                console.log(`4. Enter the 8-digit code above.`);
                console.log(`--------------------------------------------------------\n`);
            }, 3000);
        } catch (err) {
            console.error('[-] Failed to get pairing code:', err);
        }
    }

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            const statusCode = (lastDisconnect?.error)?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            console.log(`[!] Connection closed (status: ${statusCode}). Reconnecting: ${shouldReconnect}`);
            if (shouldReconnect) {
                startSock();
            } else {
                console.log(`[-] Device logged out. Please re-run to pair.`);
                rl.close();
            }
        } else if (connection === 'open') {
            console.log(`\n========================================================`);
            console.log(` ✅ SUCCESS: [${accountType.toUpperCase()}] WHATSAPP AUTHENTICATED!`);
            console.log(` Session tokens securely written to: ${authFolder}`);
            console.log(`========================================================\n`);

            // Read creds.json to show summary
            const credsPath = path.join(authFolder, 'creds.json');
            if (fs.existsSync(credsPath)) {
                const credsData = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
                console.log(`[+] Registered Name : ${credsData.me?.name || 'N/A'}`);
                console.log(`[+] Registered JID  : ${credsData.me?.id || 'N/A'}`);
            }

            console.log(`\n[+] You can now extract the auth tokens for your Render ENV or Supabase.`);
            rl.close();
            process.exit(0);
        }
    });
}

startSock();
