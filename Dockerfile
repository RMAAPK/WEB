# ==============================================================================
# Multi-Stage Minimal Alpine Container for RMAA Core Server
# - RMAA Gateway (Single-Port Router + Middle Finger Landing Page)
# - GoToSocial (Mastodon ActivityPub Daemon)
# - Conduwuit / Conduit (Matrix Homeserver Daemon)
# - WA-DB Sentinel (Dual WhatsApp Baileys Daemon)
# ==============================================================================

# Stage 1: Build RMAA Micro-Gateway
FROM golang:1.21-alpine AS gateway-builder
WORKDIR /build
COPY gateway/ ./gateway/
COPY static/ ./static/
RUN cd gateway && CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /build/gateway_bin main.go

# Stage 2: Production Minimal Runtime
FROM alpine:3.19

RUN apk add --no-cache ca-certificates curl python3 py3-pip nodejs npm tar tzdata \
    && pip3 install --break-system-packages --no-cache-dir huggingface_hub requests

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
COPY entrypoint.sh /app/entrypoint.sh

RUN chmod +x /app/entrypoint.sh /app/gateway_bin /app/scripts/*.sh

ENV PORT=10000
EXPOSE 10000

VOLUME ["/data"]
ENTRYPOINT ["/app/entrypoint.sh"]
