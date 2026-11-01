# ==============================================================================
# Multi-Stage Minimal Alpine Container for RMAA Core Server
# - RMAA Gateway (Single-Port Router + Middle Finger Landing Page)
# - GoToSocial (Mastodon ActivityPub Daemon) from Codeberg release
# - Tuwunel/Conduit (Matrix Homeserver Daemon) from GHCR official image
# ==============================================================================

# Stage 1: Build RMAA Micro-Gateway
FROM golang:1.21-alpine AS gateway-builder
WORKDIR /build
COPY gateway/ ./gateway/
COPY static/ ./static/
RUN cd gateway && CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /build/gateway_bin main.go

# Stage 2: Extract official Tuwunel (Conduit successor) binary
FROM ghcr.io/matrix-construct/tuwunel:latest AS matrix-source

# Stage 3: Production Minimal Runtime
FROM alpine:3.19

RUN apk add --no-cache ca-certificates curl python3 py3-pip tar tzdata \
    && pip3 install --break-system-packages --no-cache-dir huggingface_hub requests

WORKDIR /app

# Install GoToSocial directly from Codeberg verified release
ARG GTS_VERSION=0.17.0
RUN curl -sSL https://codeberg.org/superseriousbusiness/gotosocial/releases/download/v${GTS_VERSION}/gotosocial_${GTS_VERSION}_linux_amd64.tar.gz \
    | tar -xz -C /usr/local/bin/ gotosocial

# Copy Matrix binary from official image
COPY --from=matrix-source /usr/local/bin/tuwunel /usr/local/bin/matrix-homeserver

# Copy Gateway binary
COPY --from=gateway-builder /build/gateway_bin /app/gateway_bin

# Copy configs, scripts, and landing page
COPY static/ /app/static/
COPY fediverse/ /app/fediverse/
COPY matrix/ /app/matrix/
COPY storage/ /app/storage/
COPY entrypoint.sh /app/entrypoint.sh

RUN chmod +x /app/entrypoint.sh /app/gateway_bin /usr/local/bin/gotosocial /usr/local/bin/matrix-homeserver

ENV PORT=10000
EXPOSE 10000

VOLUME ["/data"]
ENTRYPOINT ["/app/entrypoint.sh"]
