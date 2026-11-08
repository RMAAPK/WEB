# ==============================================================================
# Multi-Stage Container for RMAA Core Server
# - RMAA C++20 Micro-Gateway (Ultra Low Latency, Zero-Copy Static & Reverse Proxy)
# - GoToSocial (Mastodon ActivityPub Daemon)
# - Conduwuit / Conduit (Matrix Homeserver Daemon)
# - Vaultwarden / Bitwarden Zero-Knowledge Vault with Privy SSO Hook
# - WA-DB Sentinel (Dual WhatsApp Baileys Daemon)
# ==============================================================================

# Stage 0: Extract Vaultwarden Alpine Binary & Web Vault
FROM vaultwarden/server:alpine AS vaultwarden-src

# Stage 1: Build RMAA C++20 Micro-Gateway
FROM alpine:3.19 AS gateway-builder
RUN apk add --no-cache g++ make musl-dev
WORKDIR /build
COPY gateway_cpp/ ./
RUN g++ -std=c++20 -O3 -pthread -s -static-libstdc++ -static-libgcc -o /build/gateway_bin main.cpp

# Stage 2: Production Minimal Runtime
FROM alpine:3.19

RUN apk add --no-cache ca-certificates curl git python3 py3-pip nodejs npm tar tzdata libpq \
    && pip3 install --break-system-packages --no-cache-dir huggingface_hub requests boto3

# Copy Vaultwarden binary and web-vault assets from official alpine image
COPY --from=vaultwarden-src /vaultwarden /usr/local/bin/vaultwarden
COPY --from=vaultwarden-src /web-vault /app/web-vault
RUN chmod +x /usr/local/bin/vaultwarden

WORKDIR /gotosocial

# Download and unpack full official GoToSocial release tarball (binary + web templates/assets)
RUN curl -sSL "https://codeberg.org/superseriousbusiness/gotosocial/releases/download/v0.17.0/gotosocial_0.17.0_linux_amd64.tar.gz" \
    | tar -xz -C /gotosocial/ \
    && ln -s /gotosocial/gotosocial /usr/local/bin/gotosocial \
    && chmod +x /usr/local/bin/gotosocial

# Download official Conduwuit release binary (musl static amd64)
RUN curl -sSL -o /usr/local/bin/matrix-homeserver "https://github.com/x86pup/conduwuit/releases/download/v0.5.0-rc4/static-x86_64-linux-musl" \
    && chmod +x /usr/local/bin/matrix-homeserver

WORKDIR /app

# Pre-install WA-DB Sentinel dependencies
COPY services/wadb/package.json /app/services/wadb/
RUN cd /app/services/wadb && npm install --omit=dev --ignore-scripts || npm install --production

# Copy Gateway binary from Stage 1
COPY --from=gateway-builder /build/gateway_bin /app/gateway_bin

# Copy configs, scripts, services, and landing page
COPY static/ /app/static/
COPY fediverse/ /app/fediverse/
COPY matrix/ /app/matrix/
COPY storage/ /app/storage/
COPY scripts/ /app/scripts/
COPY services/ /app/services/
COPY api/ /app/api/
COPY entrypoint.sh /app/entrypoint.sh

RUN chmod +x /app/entrypoint.sh /app/gateway_bin /app/scripts/*.sh

ENV PORT=10000
EXPOSE 10000

VOLUME ["/data"]
ENTRYPOINT ["/app/entrypoint.sh"]
