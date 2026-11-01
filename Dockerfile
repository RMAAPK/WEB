# ==============================================================================
# Multi-Stage Minimal Scratch/Alpine Container for RMAA Core Server
# Hosts:
# - RMAA Gateway (Reverse Proxy + Landing Page)
# - GoToSocial (Mastodon API in Go)
# - Conduit (Matrix Server in Rust)
# Memory Target: < 120 MB RAM (Fits comfortably in Render Free 512 MB tier)
# ==============================================================================

# Stage 1: Build RMAA Gateway
FROM golang:1.21-alpine AS gateway-builder
WORKDIR /build
COPY gateway/ ./gateway/
COPY static/ ./static/
RUN cd gateway && CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /build/gateway_bin main.go

# Stage 2: Final Minimal Runtime Image
FROM alpine:3.19

RUN apk add --no-cache ca-certificates curl python3 py3-pip tar tzdata \
    && pip3 install --break-system-packages --no-cache-dir huggingface_hub requests

WORKDIR /app

# Download pre-built GoToSocial (Go Mastodon binary)
ARG GTS_VERSION=0.16.0
RUN curl -sSL https://github.com/superseriousbusiness/gotosocial/releases/download/v${GTS_VERSION}/gotosocial_${GTS_VERSION}_linux_amd64.tar.gz \
    | tar -xz -C /usr/local/bin/ gotosocial

# Download pre-built Conduit (Rust Matrix binary)
ARG CONDUIT_VERSION=v0.8.0
RUN curl -sSL https://gitlab.com/famedly/conduit/-/jobs/artifacts/${CONDUIT_VERSION}/raw/conduit-x86_64-unknown-linux-musl?job=build:x86_64-musl \
    -o /app/conduit && chmod +x /app/conduit

# Copy Gateway and Configs
COPY --from=gateway-builder /build/gateway_bin /app/gateway_bin
COPY static/ /app/static/
COPY fediverse/ /app/fediverse/
COPY matrix/ /app/matrix/
COPY storage/ /app/storage/
COPY entrypoint.sh /app/entrypoint.sh

RUN chmod +x /app/entrypoint.sh /app/gateway_bin

ENV PORT=10000
EXPOSE 10000

VOLUME ["/data"]
ENTRYPOINT ["/app/entrypoint.sh"]
