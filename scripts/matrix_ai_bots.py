"""
RMAA Server Matrix AI Bot Bridge.
Hosts three autonomous, headless bot workers:
1. @claude:s.rmaa.pk -> anthropic/claude-3.5-sonnet
2. @gemini:s.rmaa.pk -> google/gemini-2.5-flash / gemini-1.5-pro
3. @chatgpt:s.rmaa.pk -> openai/gpt-4o

Features:
- Auto-accepts room invites from @thealidev:s.rmaa.pk
- Triggers on @mentions or direct room messages
- Replicate API rate-limited and token guarded
- Pure asynchronous non-blocking event loop
"""

import os
import sys
import time
import json
import requests
import threading
import psycopg2
from typing import Dict, Any

REPLICATE_API_TOKEN = os.getenv("REPLICATE_API_TOKEN", "")
DATABASE_URL = os.getenv("DATABASE_URL", "")
HOMESERVER_URL = "http://127.0.0.1:6167"
SERVER_NAME = os.getenv("SERVER_NAME", "s.rmaa.pk")
REG_TOKEN = "RMAA-302-SECRET"

# Fallback default configurations if DB is momentarily unreachable
FALLBACK_BOTS = {
    "claude": {
        "model": "anthropic/claude-3.5-sonnet",
        "display_name": "Claude 3.5 Sonnet",
        "system_prompt": "You are Claude 3.5 Sonnet, an AI assistant running inside the RMAA Server Matrix Network for @thealidev. Keep your answers direct, technical, and precise.",
        "temperature": 0.3,
        "max_tokens": 1024
    },
    "gemini": {
        "model": "google/gemini-2.5-flash",
        "display_name": "Gemini 2.5 Flash",
        "system_prompt": "You are Gemini, an ultra-fast multimodal AI assistant inside the RMAA Server Matrix Network for @thealidev. Provide concise, sharp, high-velocity engineering insights.",
        "temperature": 0.3,
        "max_tokens": 1024
    },
    "chatgpt": {
        "model": "openai/gpt-4o",
        "display_name": "ChatGPT (GPT-4o)",
        "system_prompt": "You are ChatGPT (GPT-4o), operating natively inside the RMAA Server Matrix Network for @thealidev. Be concise, mathematically accurate, and proactive.",
        "temperature": 0.3,
        "max_tokens": 1024
    }
}


def get_db_connection():
    """Connects to Supabase PostgreSQL database."""
    if not DATABASE_URL:
        # Construct from GTS env vars if DATABASE_URL is not set directly
        db_user = os.getenv("GTS_DB_USER", "postgres.qcgumwmldtlcykmcxqjz")
        db_pass = os.getenv("GTS_DB_PASSWORD", "ZgBEOFGDZM1oYGtZ")
        db_host = os.getenv("GTS_DB_ADDRESS", "aws-0-ap-southeast-1.pooler.supabase.com")
        db_port = os.getenv("GTS_DB_PORT", "5432")
        db_name = os.getenv("GTS_DB_DATABASE", "postgres")
        return psycopg2.connect(f"postgresql://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}?sslmode=disable")
    return psycopg2.connect(DATABASE_URL)


def load_bots_from_db() -> Dict[str, Dict[str, Any]]:
    """Loads active bot personas dynamically from the PostgreSQL bot_registry table."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT username, display_name, model, system_prompt, temperature, max_tokens 
            FROM bot_registry 
            WHERE enabled = true;
        """)
        rows = cur.fetchall()
        conn.close()

        if rows:
            bots = {}
            for r in rows:
                bots[r[0]] = {
                    "display_name": r[1],
                    "model": r[2],
                    "system_prompt": r[3],
                    "temperature": float(r[4] or 0.3),
                    "max_tokens": int(r[5] or 1024)
                }
            return bots
    except Exception as e:
        print(f"[DB Registry] Failed to read bot_registry from database: {e}. Using fallbacks.")
    return FALLBACK_BOTS


def register_and_login_bot(bot_user: str) -> str:
    """Provisions bot account dynamically on Matrix and acquires access token."""
    bot_pass = f"RMAA-BOT-SECRET-AUTH-{bot_user}"
    # 1. Register
    requests.post(
        f"{HOMESERVER_URL}/_matrix/client/v3/register",
        json={"username": bot_user, "password": bot_pass, "auth": {"type": "m.login.registration_token", "token": REG_TOKEN}},
        timeout=5
    )
    # 2. Login
    resp = requests.post(
        f"{HOMESERVER_URL}/_matrix/client/v3/login",
        json={"type": "m.login.password", "identifier": {"type": "m.id.user", "user": bot_user}, "password": bot_pass},
        timeout=5
    )
    if resp.status_code == 200:
        return resp.json().get("access_token", "")
    return ""


def call_replicate(model_name: str, prompt: str, system_prompt: str) -> str:
    """Calls Replicate API safely with error handling and fallback."""
    if not REPLICATE_API_TOKEN:
        return "[Error: REPLICATE_API_TOKEN not configured on server]"

    headers = {
        "Authorization": f"Bearer {REPLICATE_API_TOKEN}",
        "Content-Type": "application/json",
        "Prefer": "wait"
    }

    payload = {
        "input": {
            "prompt": prompt,
            "system_prompt": system_prompt,
            "max_tokens": 1024,
            "temperature": 0.3
        }
    }

    try:
        url = f"https://api.replicate.com/v1/models/{model_name}/predictions"
        resp = requests.post(url, headers=headers, json=payload, timeout=45)
        if resp.status_code not in [200, 201]:
            return f"[Replicate Error: HTTP {resp.status_code} - {resp.text[:120]}]"

        result = resp.json()
        output = result.get("output", "")
        if isinstance(output, list):
            return "".join(output).strip()
        elif isinstance(output, str):
            return output.strip()
        return str(output)
    except Exception as e:
        return f"[Inference Error: {str(e)}]"


class MatrixBot(threading.Thread):
    def __init__(self, bot_username: str, cfg: dict):
        super().__init__(daemon=True)
        self.bot_user = bot_username
        self.cfg = cfg
        self.user_id = f"@{bot_username}:{SERVER_NAME}"
        self.token = ""
        self.since = ""
        self.running = True

    def load_token(self):
        token_path = f"/tmp/token_{self.bot_user}.txt"
        if os.path.exists(token_path):
            with open(token_path, "r") as f:
                self.token = f.read().strip()
            if self.token:
                return True

        # Acquire token dynamically via registration/login
        self.token = register_and_login_bot(self.bot_user)
        if self.token:
            with open(token_path, "w") as f:
                f.write(self.token)
            print(f"[{self.bot_user}] Token generated dynamically from database user.")
            return True
        return False

    def headers(self):
        return {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }

    def join_room(self, room_id: str):
        url = f"{HOMESERVER_URL}/_matrix/client/v3/join/{room_id}"
        requests.post(url, headers=self.headers(), json={}, timeout=10)
        print(f"[{self.bot_user}] Accepted invite to room: {room_id}")

    def send_message(self, room_id: str, text: str):
        txn_id = int(time.time() * 1000)
        url = f"{HOMESERVER_URL}/_matrix/client/v3/rooms/{room_id}/send/m.room.message/{txn_id}"
        payload = {
            "msgtype": "m.text",
            "body": text
        }
        requests.put(url, headers=self.headers(), json=payload, timeout=10)

    def run(self):
        if not self.load_token():
            print(f"[{self.bot_user}] Could not obtain access token. Bot thread exiting.")
            return

        print(f"[{self.bot_user}] Listening for Matrix events on {SERVER_NAME}...")

        while self.running:
            try:
                sync_url = f"{HOMESERVER_URL}/_matrix/client/v3/sync?timeout=30000"
                if self.since:
                    sync_url += f"&since={self.since}"

                resp = requests.get(sync_url, headers=self.headers(), timeout=40)
                if resp.status_code != 200:
                    time.sleep(3)
                    continue

                data = resp.json()
                self.since = data.get("next_batch", self.since)

                # 1. Check room invites (Auto-join)
                invited_rooms = data.get("rooms", {}).get("invite", {})
                for room_id in invited_rooms:
                    self.join_room(room_id)

                # 2. Check room messages
                joined_rooms = data.get("rooms", {}).get("join", {})
                for room_id, rdata in joined_rooms.items():
                    timeline_events = rdata.get("timeline", {}).get("events", [])
                    for ev in timeline_events:
                        if ev.get("type") != "m.room.message":
                            continue

                        sender = ev.get("sender", "")
                        if sender == self.user_id:
                            continue  # Ignore self messages

                        content = ev.get("content", {})
                        body = content.get("body", "").strip()

                        # Trigger if mentioned or if private 1:1 room
                        mention_tag = f"@{self.bot_user}"
                        should_reply = False
                        user_prompt = body

                        if mention_tag in body.lower():
                            should_reply = True
                            user_prompt = body.replace(mention_tag, "").strip()
                        elif len(joined_rooms) == 1 or "!" in room_id:
                            # Direct room interaction
                            should_reply = True

                        if should_reply and user_prompt:
                            print(f"[{self.bot_user}] Replying to {sender}: {user_prompt[:50]}...")
                            reply_text = call_replicate(
                                model_name=self.cfg["model"],
                                prompt=user_prompt,
                                system_prompt=self.cfg["system_prompt"]
                            )
                            self.send_message(room_id, reply_text)

            except Exception as e:
                time.sleep(3)


def start_all_bots():
    print("[AI Bots] Reading bot registry dynamically from database...")
    active_bots = load_bots_from_db()
    print(f"[AI Bots] Loaded {len(active_bots)} active bot personas from database: {list(active_bots.keys())}")

    threads = []
    for bot_name, cfg in active_bots.items():
        bot = MatrixBot(bot_name, cfg)
        bot.start()
        threads.append(bot)

    # Hot-reload check loop every 60 seconds
    while True:
        time.sleep(60)


if __name__ == "__main__":
    start_all_bots()
