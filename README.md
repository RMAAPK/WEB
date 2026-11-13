# RMAA Holdings

The repository has two application roots:

- `frontend/` — React/Vite website and all public pages (`/accounts/`, `/admin/`, `/forge/`, `/alicnc/`, `/fargolore/`), deployed as a Render **Static Site** at `rmaa.pk`.
- `backend/` — Docker API server, gateways, protocol daemons, service code, and configs, deployed as a Render **Web Service** at `s.rmaa.pk`. It returns JSON/protocol responses and redirects legacy website URLs to `rmaa.pk`; it does not serve the public site.

The repo root contains only this README and those two folders.

## Render dashboard setup

Create/configure the two services directly in Render; no Blueprint is required.

### Static Site — frontend

- Root Directory: `frontend`
- Build Command: `npm ci && npm run build`
- Publish Directory: `dist`
- Free plan
- Environment: `VITE_API_BASE_URL=https://s.rmaa.pk`
- Add the SPA rewrite `/*` → `/index.html`
- Custom domain: `rmaa.pk`

### Web Service — backend

- Runtime: Docker
- Root Directory: `backend`
- Dockerfile: `Dockerfile`
- Free plan
- Health Check Path: `/api/healthz`
- Custom domain: `s.rmaa.pk`
- Set `FRONTEND_ORIGINS=https://rmaa.pk,https://www.rmaa.pk`

Set provider/database secrets in the backend service’s Render environment, not in source: `REPLICATE_API_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GTS_DB_ADDRESS`, `HF_TOKEN`, plus any service-specific credentials. The API listens internally on `127.0.0.1:5174`; the gateway proxies the website API routes to it.

## Local checks

```sh
cd frontend
npm ci
npm run build
cd ..
docker build -t rmaa-backend backend
```

The API health check is `/api/healthz`; website APIs include `/api/blogs`, `/api/ping-google`, and `/api/chat`. Forge AI and Ali CNC assets live in `frontend/public/forge/` and `frontend/public/alicnc/`; the backend redirects legacy `/forge` and `/alicnc` requests to the static site.
