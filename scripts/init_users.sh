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
REGISTER_PAYLOAD='{"username":"thealidev","password":"302-Killer","auth":{"type":"m.login.dummy"}}'
RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d "$REGISTER_PAYLOAD" "http://127.0.0.1:6167/_matrix/client/v3/register")
echo "[Users] Matrix register response: $RESPONSE"

# Provision GoToSocial user if applicable
ADMIN_USER="${ADMIN_USERNAME:-thealidev}"
ADMIN_PASS="${ADMIN_PASSWORD:-302-Killer}"
ADMIN_MAIL="${ADMIN_EMAIL:-server@rmaa.pk}"

if command -v gotosocial >/dev/null 2>&1; then
    gotosocial --config-path /app/fediverse/config.yaml --admin-account-username "$ADMIN_USER" --admin-account-email "$ADMIN_MAIL" --admin-account-password "$ADMIN_PASS" admin account create 2>/dev/null || true
    gotosocial --config-path /app/fediverse/config.yaml --username "$ADMIN_USER" admin account promote 2>/dev/null || true
fi
