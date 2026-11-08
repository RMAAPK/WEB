# RMAA Holdings — split frontend/backend deployment

The primary public website and the RMAA server are separate Render services:

- **Frontend:** React + Vite in `frontend/`, built to static files and served by a Render Static Site at `rmaa.pk`.
- **Backend:** Docker orchestration and the website API in `backend/`, deployed as a Render Web Service at `s.rmaa.pk`. The C++ gateway continues to route Matrix, Fediverse, and the existing backend modules; website API paths are proxied to the loopback Node API.
- **Other service source:** standalone modules and their own deployment configs remain in their existing root folders (`services/`, `scripts/`, `gateway_cpp/`, etc.) so their deployment paths are not needlessly changed.

## Layout

```text
frontend/                 React/Vite source; static build output is frontend/dist/
  src/lib/api.ts          API URL helper (VITE_API_BASE_URL)
  scripts/                build-time static SEO generation
backend/
  Dockerfile              Dockerfile; build from repository-root context
  entrypoint.sh           starts the backend daemons and API
  api/                    website JSON API
  static/                 legacy backend-hosted pages/assets
render.yaml               Docker backend blueprint
web/render.yaml           frontend static-site/LiteLLM blueprint
```

## Render deployment

### Frontend

The frontend blueprint is `web/render.yaml`. It defines `rmaa-holdings-frontend` as a static site with:

- Root directory: `frontend`
- Build: `npm ci && npm run build`
- Publish directory: `dist`
- API base URL: `https://s.rmaa.pk`

Attach the custom domain `rmaa.pk` to this static service after detaching it from the legacy Node website service. The frontend blueprint deliberately avoids taking the domain while that old service may still own it.

### Backend

The root `render.yaml` defines the Docker service. It points to `backend/Dockerfile` **with the repository root as Docker build context**, because the Dockerfile copies existing backend modules from root-level folders. Its health check is `/api/healthz`; the public website API is routed through the gateway to Node on `127.0.0.1:5174`.

Set the backend custom domain to `s.rmaa.pk`. Configure secrets in Render, not in source control:

- `REPLICATE_API_TOKEN` for AI chat
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` if chat logging is enabled
- Existing Matrix, Fediverse, Hugging Face, and storage variables required by the selected backend services

`FRONTEND_ORIGINS` is set to `https://rmaa.pk,https://www.rmaa.pk` for API CORS. Update it if the frontend uses different origins.

## Local checks

From the repository root:

```sh
cd frontend
npm ci
npm run build
cd ..
docker build -f backend/Dockerfile -t rmaa-backend .
```

The final `.` is important: it keeps the Docker build context at the repository root. After running the backend locally, check:

```sh
curl -i http://localhost:10000/api/healthz
curl -i -X OPTIONS http://localhost:10000/api/chat \
  -H 'Origin: https://rmaa.pk' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type'
```

The API returns JSON at `/api/healthz`, `/api/blogs`, `/api/blogs/:slug`, `/api/ping-google`, and `/api/chat` (AI chat requires a configured Replicate token). The frontend build generates `sitemap.xml`, `robots.txt`, RSS feeds, and static blog metadata pages.
