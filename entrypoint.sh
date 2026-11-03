#!/bin/sh
set -e

echo "=== [RMAA CORE SERVER: INITIALIZING] ==="

# 1. Restore persistent encrypted database snapshot from Hugging Face / IPFS Vault
if [ -n "$HF_TOKEN" ]; then
    echo "[Boot] Restoring state from cloud vault..."
    python3 /app/storage/vault_sync.py restore || true
fi

mkdir -p /data/matrix /data/gotosocial/storage

# 2. Launch GoToSocial (Mastodon API Daemon) in background
echo "[Boot] Launching GoToSocial on 0.0.0.0:8080..."
gotosocial --config-path /app/fediverse/config.yaml server start >/tmp/gts.log 2>&1 &

# 3. Launch Matrix Homeserver (Tuwunel / Conduit) in background
echo "[Boot] Launching Matrix Homeserver on 127.0.0.1:6167..."
CONDUIT_CONFIG=/app/matrix/conduit.toml matrix-homeserver >/tmp/matrix.log 2>&1 &

# Run user initialization / provisioning in background
/app/scripts/init_users.sh &

# Launch Matrix AI Bot Bridge (Claude, Gemini, ChatGPT via Replicate)
if [ -n "$REPLICATE_API_TOKEN" ]; then
    echo "[Boot] Launching RMAA Matrix AI Bots daemon..."
    python3 /app/scripts/matrix_ai_bots.py >/tmp/ai_bots.log 2>&1 &
fi

# Launch MusicAI Microservice Engine on port 9090
echo "[Boot] Launching MusicAI Engine on 127.0.0.1:9090..."
python3 /app/scripts/music_server.py >/tmp/music.log 2>&1 &

# Launch WA-DB Sentinel Daemon on port 3000
echo "[Boot] Launching WA-DB Sentinel Daemon on 127.0.0.1:3000..."
(cd /app/services/wadb && node src/index.js >/tmp/wadb.log 2>&1) &

# Launch Local-JIT Zero-Knowledge Vault on port 7470
if [ -f /app/services/localjit/server.py ]; then
    echo "[Boot] Launching LocalJIT Vault on 127.0.0.1:7470..."
    STORAGE_PATH=/data/vault PORT=7470 python3 -u /app/services/localjit/server.py >/tmp/localjit.log 2>&1 &
fi

# Launch DMCPS Secured Context Protocol Daemon on port 8000
if [ -f /app/services/dmcps/dist/dashboard.js ]; then
    echo "[Boot] Launching DMCPS Engine on 127.0.0.1:8000..."
    (cd /app/services/dmcps && PORT=8000 node dist/dashboard.js >/tmp/dmcps.log 2>&1) &
fi

# Launch UPAAS Pipeline Engine on port 9100
if [ -f /app/services/upaas/upaas/worker.py ]; then
    echo "[Boot] Launching UPAAS Engine on 127.0.0.1:9100..."
    (cd /app/services/upaas && PORT=9100 python3 -u upaas/worker.py >/tmp/upaas.log 2>&1) &
fi

# 4. Launch Cloud State Sync Loop in background (500ms reactive loop)
if [ -n "$HF_TOKEN" ]; then
    python3 /app/storage/vault_sync.py loop &
fi

# Graceful shutdown handler
cleanup() {
    echo "[Shutdown] SIGTERM/SIGINT received! Syncing latest state to Hugging Face Vault..."
    if [ -n "$HF_TOKEN" ]; then
        python3 /app/storage/vault_sync.py upload || true
    fi
    exit 0
}
trap cleanup TERM INT

# 5. Launch RMAA Gateway on $PORT (Front-facing Reverse Proxy & Router)
echo "[Boot] Launching RMAA Gateway on :${PORT:-10000}..."
/app/gateway_bin &
GATEWAY_PID=$!

wait $GATEWAY_PID
