#!/bin/sh
set -e

echo "=== [RMAA CORE SERVER: INITIALIZING] ==="

# 1. Restore persistent encrypted database snapshot from Hugging Face / IPFS Vault
if [ -n "$HF_TOKEN" ]; then
    echo "[Boot] Restoring state from cloud vault..."
    python3 /app/storage/vault_sync.py restore || true
fi

mkdir -p /data/matrix /data/gotosocial/storage

# 2. Launch GoToSocial (Mastodon API Daemon) in background with direct stdout/stderr logging
echo "[Boot] Launching GoToSocial on 0.0.0.0:8080..."
gotosocial --config-path /app/fediverse/config.yaml server start >/tmp/gts.log 2>&1 &

# 3. Launch Matrix Homeserver (Tuwunel / Conduit) in background
echo "[Boot] Launching Matrix Homeserver on 127.0.0.1:6167..."
CONDUIT_CONFIG=/app/matrix/conduit.toml matrix-homeserver >/tmp/matrix.log 2>&1 &

# Run user initialization / provisioning in background
/app/scripts/init_users.sh &

# 4. Launch Cloud State Sync Loop in background (Hourly snapshot)
if [ -n "$HF_TOKEN" ]; then
    python3 /app/storage/vault_sync.py loop &
fi

# 5. Launch RMAA Gateway on $PORT (Front-facing Reverse Proxy & Middle Finger Page)
echo "[Boot] Launching RMAA Gateway on :${PORT:-10000}..."
exec /app/gateway_bin
