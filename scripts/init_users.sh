#!/bin/sh

echo "[Users] Checking admin initialization..."

# Wait for Matrix Homeserver to respond on 127.0.0.1:6167
for i in $(seq 1 30); do
    if curl -s http://127.0.0.1:6167/_matrix/client/versions >/dev/null 2>&1; then
        echo "[Users] Matrix Homeserver is ready."
        break
    fi
    sleep 1
done

# Provision user: thealidev
ADMIN_USER="${ADMIN_USERNAME:-thealidev}"
ADMIN_PASS="${ADMIN_PASSWORD:-302-Killer}"
ADMIN_MAIL="${ADMIN_EMAIL:-server@rmaa.pk}"

REGISTER_PAYLOAD="{\"username\":\"$ADMIN_USER\",\"password\":\"$ADMIN_PASS\",\"auth\":{\"type\":\"m.login.registration_token\",\"token\":\"RMAA-302-SECRET\"}}"
RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d "$REGISTER_PAYLOAD" "http://127.0.0.1:6167/_matrix/client/v3/register")
echo "[Users] Matrix register response: $RESPONSE"

if command -v gotosocial >/dev/null 2>&1; then
    gotosocial --config-path /app/fediverse/config.yaml admin account create \
        --username "$ADMIN_USER" \
        --email "$ADMIN_MAIL" \
        --password "$ADMIN_PASS" 2>/dev/null || true
    gotosocial --config-path /app/fediverse/config.yaml admin account promote \
        --username "$ADMIN_USER" 2>/dev/null || true
fi
