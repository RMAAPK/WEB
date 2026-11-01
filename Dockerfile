# ==============================================================================
# Multi-Stage Enterprise Scratch Container for RMAA Core Server
# Copies pre-compiled binaries directly from official images:
# - GoToSocial (Mastodon ActivityPub Daemon) from superseriousbusiness/gotosocial
# - Conduit (Matrix Homeserver Daemon) from matrixconduit/matrix-conduit
# - RMAA Gateway (Single-port router + 403 Middle Finger Page) from Go Alpine
# Total Container Memory: ~80-120 MB RAM (Fits perfectly in 512 MB Render Free Tier)
# ==============================================================================

# Stage 1: Build RMAA Micro-Gateway
FROM golang:1.21-alpine AS gateway-builder
WORKDIR /build
COPY gateway/ ./gateway/
COPY static/ ./static/
RUN cd gateway && CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /build/gateway_bin main.go

# Stage 2: Extract official GoToSocial binary
FROM superseriousbusiness/gotosocial:latest AS gotosocial-source

# Stage 3: Extract official Conduit binary
FROM matrixconduit/matrix-conduit:latest AS conduit-source

# Stage 4: Production Ultra-Lean Runtime
FROM alpine:3.19

RUN apk add --no-cache ca-certificates curl python3 py3-pip tar tzdata \
    && pip3 install --break-system-packages --no-cache-dir huggingface_hub requests

WORKDIR /app

# Copy binaries from respective image stages
COPY --from=gotosocial-source /gotosocial/gotosocial /usr/local/bin/gotosocial
COPY --from=conduit-source /conduit /usr/local/bin/conduit
COPY --from=gateway-builder /build/gateway_bin /app/gateway_bin

# Copy configs, scripts, and landing page
COPY static/ /app/static/
COPY fediverse/ /app/fediverse/
COPY matrix/ /app/matrix/
COPY storage/ /app/storage/
COPY entrypoint.sh /app/entrypoint.sh

RUN chmod +x /app/entrypoint.sh /app/gateway_bin /usr/local/bin/gotosocial /usr/local/bin/conduit

ENV PORT=10000
EXPOSE 10000

VOLUME ["/data"]
ENTRYPOINT ["/app/entrypoint.sh"]
