import WebSocket from 'ws';
if (!globalThis.WebSocket) {
    globalThis.WebSocket = WebSocket;
}
import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';
import fs from 'fs';
import path from 'path';

let supabase = null;

if (config.supabaseUrl && config.supabaseKey) {
    try {
        supabase = createClient(config.supabaseUrl, config.supabaseKey, {
            auth: { persistSession: false }
        });
        console.log('[STORAGE] Supabase Storage client initialized.');
    } catch (err) {
        console.warn('[STORAGE] Failed to initialize Supabase client:', err.message);
    }
} else {
    console.log('[STORAGE] Running in local/DB storage mode (Supabase service key not provided).');
}

/**
 * Uploads media buffer to Supabase Storage or local fallback
 */
export async function uploadMedia(schema, buffer, fileName, mimeType, isViewOnce = false) {
    const subFolder = isViewOnce ? 'view-once' : 'media';
    const storagePath = `${schema}/${subFolder}/${fileName}`;

    if (supabase) {
        try {
            const { data, error } = await supabase.storage
                .from(config.supabaseBucket)
                .upload(storagePath, buffer, {
                    contentType: mimeType,
                    upsert: true
                });

            if (error) {
                console.error(`[STORAGE] Upload error:`, error.message);
            } else {
                const { data: publicUrlData } = supabase.storage
                    .from(config.supabaseBucket)
                    .getPublicUrl(storagePath);

                console.log(`[STORAGE] 🚀 Uploaded to Supabase Storage: ${storagePath}`);
                return {
                    s3Key: storagePath,
                    s3Bucket: config.supabaseBucket,
                    s3Url: publicUrlData?.publicUrl || null
                };
            }
        } catch (uploadErr) {
            console.error('[STORAGE] Unexpected upload failure:', uploadErr.message);
        }
    }

    // Fallback: Local vault on disk
    const localDir = `/tmp/wa_vault/${schema}/${subFolder}`;
    fs.mkdirSync(localDir, { recursive: true });
    const localFilePath = path.join(localDir, fileName);
    fs.writeFileSync(localFilePath, buffer);
    console.log(`[STORAGE] 💾 Saved locally to: ${localFilePath}`);

    return {
        s3Key: storagePath,
        s3Bucket: 'local-vault',
        s3Url: `file://${localFilePath}`
    };
}