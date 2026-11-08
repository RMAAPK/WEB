#!/bin/sh

echo "[Users] Checking admin & bot initialization..."

# 1. Wait for Matrix Homeserver to respond on 127.0.0.1:6167
for i in $(seq 1 30); do
    if curl -s http://127.0.0.1:6167/_matrix/client/versions >/dev/null 2>&1; then
        echo "[Users] Matrix Homeserver is ready."
        break
    fi
    sleep 1
done

ADMIN_USER="${ADMIN_USERNAME:-thealidev}"
ADMIN_PASS="${ADMIN_PASSWORD:-302-Killer}"
ADMIN_MAIL="${ADMIN_EMAIL:-thealidevmail@gmail.com}"
REG_TOKEN="RMAA-302-SECRET"

# Register Admin Matrix user
curl -s -X POST -H "Content-Type: application/json" \
    -d "{\"username\":\"$ADMIN_USER\",\"password\":\"$ADMIN_PASS\",\"auth\":{\"type\":\"m.login.registration_token\",\"token\":\"$REG_TOKEN\"}}" \
    "http://127.0.0.1:6167/_matrix/client/v3/register" >/dev/null 2>&1 || true

# Provision Passwordless AI Bot Matrix Accounts
BOT_USERS="claude gemini chatgpt"
for bot in $BOT_USERS; do
    BOT_PASS="RMAA-BOT-SECRET-AUTH-${bot}"
    # Register bot account
    curl -s -X POST -H "Content-Type: application/json" \
        -d "{\"username\":\"$bot\",\"password\":\"$BOT_PASS\",\"auth\":{\"type\":\"m.login.registration_token\",\"token\":\"$REG_TOKEN\"}}" \
        "http://127.0.0.1:6167/_matrix/client/v3/register" >/dev/null 2>&1 || true

    # Login to obtain persistent Access Token for bot runner
    LOGIN_RESP=$(curl -s -X POST -H "Content-Type: application/json" \
        -d "{\"type\":\"m.login.password\",\"identifier\":{\"type\":\"m.id.user\",\"user\":\"$bot\"},\"password\":\"$BOT_PASS\"}" \
        "http://127.0.0.1:6167/_matrix/client/v3/login")
    
    TOKEN=$(echo "$LOGIN_RESP" | jq -r '.access_token // empty' 2>/dev/null || true)
    if [ -n "$TOKEN" ]; then
        echo "$TOKEN" > "/tmp/token_${bot}.txt"
        echo "[Users] Bot @${bot}:s.rmaa.pk authenticated (Token cached)."
    fi
done

# 2. Wait for GoToSocial to respond on 127.0.0.1:8080
for i in $(seq 1 30); do
    if curl -s http://127.0.0.1:8080/api/v1/instance >/dev/null 2>&1; then
        echo "[Users] GoToSocial is ready."
        break
    fi
    sleep 1
done

# Provision GoToSocial admin user
if command -v gotosocial >/dev/null 2>&1; then
    gotosocial --config-path /app/fediverse/config.yaml admin account create \
        --username "$ADMIN_USER" \
        --email "$ADMIN_MAIL" \
        --password "$ADMIN_PASS" 2>/dev/null || true
    gotosocial --config-path /app/fediverse/config.yaml admin account promote \
        --username "$ADMIN_USER" 2>/dev/null || true
fi

# 3. Immediately trigger vault sync so initial Matrix keys/tokens/state are committed to Hugging Face
if [ -n "$HF_TOKEN" ]; then
    echo "[Users] Immediate state upload to Hugging Face vault..."
    python3 /app/storage/vault_sync.py upload || true
fi
