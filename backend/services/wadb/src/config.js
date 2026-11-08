import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Unified RMAA Server Database (Supabase Session Pooler)
const DEFAULT_RMAA_DB = "postgresql://postgres.qcgumwmldtlcykmcxqjz:ZgBEOFGDZM1oYGtZ@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require";

export const config = {
    port: parseInt(process.env.WA_PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'production',
    databaseUrl: process.env.DATABASE_URL || DEFAULT_RMAA_DB,
    supabaseUrl: process.env.SUPABASE_URL || 'https://osmcdstlwakpwuiksurr.supabase.co',
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '',
    supabaseBucket: process.env.SUPABASE_STORAGE_BUCKET || 'wa-vault',
    callRejectMessage: process.env.CALL_REJECT_MESSAGE || 'Plz Refrain To Msges Only',
    enableCallCutter: process.env.ENABLE_CALL_CUTTER !== 'false',
    enableViewOnceExtraction: process.env.ENABLE_VIEW_ONCE_EXTRACTION !== 'false',
    enableAntiDelete: process.env.ENABLE_ANTI_DELETE !== 'false',
    autoPingIntervalMinutes: parseInt(process.env.AUTO_PING_INTERVAL_MINUTES || '14', 10),
    renderExternalUrl: process.env.RENDER_EXTERNAL_URL || 'https://rmaa-server.onrender.com'
};

/**
 * Restores WhatsApp auth session files directly from RMAA PostgreSQL {accountType}.auth_sessions
 */
export async function ensureAuthDir(accountType) {
    const authDir = `/tmp/wa_auth_${accountType}`;
    fs.mkdirSync(authDir, { recursive: true });

    const credsFile = path.join(authDir, 'creds.json');
    if (fs.existsSync(credsFile) && fs.statSync(credsFile).size > 100) {
        console.log(`[AUTH] Account '${accountType}' already has active credentials in ${authDir}`);
        return authDir;
    }

    try {
        const { pool } = await import('./db.js');
        const res = await pool.query(`SELECT key_type, key_id, key_data FROM ${accountType}.auth_sessions`);
        if (res.rows.length > 0) {
            console.log(`[AUTH] Restoring ${res.rows.length} session files for '${accountType}' from RMAA PostgreSQL...`);
            for (const row of res.rows) {
                let fileName = '';
                if (row.key_type === 'creds' && row.key_id === 'main') {
                    fileName = 'creds.json';
                } else if (row.key_type === 'other') {
                    fileName = row.key_id.endsWith('.json') ? row.key_id : `${row.key_id}.json`;
                } else {
                    fileName = `${row.key_type}-${row.key_id}.json`;
                }
                const filePath = path.join(authDir, fileName);
                fs.writeFileSync(filePath, JSON.stringify(row.key_data));
            }
            console.log(`[AUTH] ✅ Successfully restored '${accountType}' session from RMAA PostgreSQL!`);
            return authDir;
        }
    } catch (dbErr) {
        console.warn(`[AUTH] Could not restore from database: ${dbErr.message}`);
    }

    return authDir;
}
