DO $body$
DECLARE
    sch TEXT;
BEGIN
    FOR sch IN SELECT unnest(ARRAY['personal', 'business']) LOOP
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I.rejected_calls (
                id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                call_id TEXT NOT NULL,
                caller_jid TEXT NOT NULL,
                timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                is_group_call BOOLEAN DEFAULT false,
                is_video BOOLEAN DEFAULT false,
                auto_reply_sent BOOLEAN DEFAULT false,
                auto_reply_text TEXT DEFAULT ''Plz Refrain To Msges Only'',
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_%I_rejected_calls_time ON %I.rejected_calls (caller_jid, timestamp DESC);
        ', sch, sch, sch);
    END LOOP;
END $body$;

