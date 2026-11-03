-- ============================================================================
-- WA-DB: Complete Isolation for Personal & Business WhatsApp Sentinels
-- Engine: PostgreSQL 17 (Supabase)
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS personal;
CREATE SCHEMA IF NOT EXISTS business;

DO $$
DECLARE
    sch TEXT;
BEGIN
    FOR sch IN SELECT unnest(ARRAY['personal', 'business']) LOOP
        
        -- 1. Session Auth & Keys (Render Restart Immunity)
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I.auth_sessions (
                key_type TEXT NOT NULL,
                key_id TEXT NOT NULL,
                key_data JSONB NOT NULL,
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                PRIMARY KEY (key_type, key_id)
            );
        ', sch);

        -- 2. Chats / Conversations
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I.chats (
                chat_jid TEXT PRIMARY KEY,
                name TEXT,
                is_group BOOLEAN DEFAULT false,
                ephemeral_expiration INT DEFAULT 0,
                archived BOOLEAN DEFAULT false,
                unread_count INT DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        ', sch);

        -- 3. Contacts / Address Book
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I.contacts (
                contact_jid TEXT PRIMARY KEY,
                phone_number TEXT,
                push_name TEXT,
                verified_name TEXT,
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        ', sch);

        -- 4. Messages (Anti-Delete, View-Once & Disappearing Immortal Ledger)
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I.messages (
                id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                message_id TEXT UNIQUE NOT NULL,
                chat_jid TEXT NOT NULL REFERENCES %I.chats(chat_jid) ON DELETE CASCADE,
                sender_jid TEXT NOT NULL,
                is_from_me BOOLEAN NOT NULL DEFAULT false,
                timestamp TIMESTAMPTZ NOT NULL,
                
                message_type TEXT NOT NULL,
                body TEXT,
                raw_payload JSONB NOT NULL,
                
                -- Anti-Delete Fields
                is_deleted BOOLEAN NOT NULL DEFAULT false,
                deleted_at TIMESTAMPTZ,
                
                -- View-Once & Disappearing Flags
                is_view_once BOOLEAN NOT NULL DEFAULT false,
                is_ephemeral BOOLEAN NOT NULL DEFAULT false,
                
                -- Edits Audit Trail
                is_edited BOOLEAN NOT NULL DEFAULT false,
                original_body TEXT,
                edited_at TIMESTAMPTZ,
                
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_%I_msgs_chat_time ON %I.messages (chat_jid, timestamp DESC);
            CREATE INDEX IF NOT EXISTS idx_%I_msgs_deleted ON %I.messages (is_deleted) WHERE is_deleted = true;
            CREATE INDEX IF NOT EXISTS idx_%I_msgs_view_once ON %I.messages (is_view_once) WHERE is_view_once = true;
        ', sch, sch, sch, sch, sch, sch, sch, sch);

        -- 5. Media (Supabase S3 Object Coordinates)
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I.media (
                id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                message_id TEXT NOT NULL REFERENCES %I.messages(message_id) ON DELETE CASCADE,
                media_type TEXT NOT NULL,
                mimetype TEXT NOT NULL,
                file_size_bytes BIGINT,
                file_hash_sha256 TEXT,
                s3_bucket TEXT NOT NULL DEFAULT ''wa-vault'',
                s3_key TEXT NOT NULL,
                public_url TEXT,
                is_view_once BOOLEAN NOT NULL DEFAULT false,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_%I_media_msg ON %I.media (message_id);
        ', sch, sch, sch, sch);

    END LOOP;
END $$;

