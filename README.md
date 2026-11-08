# RMAA Holdings

The repository is deliberately split into two application directories:

- `frontend/` — the React/Vite website, built as a Render Static Site for `rmaa.pk`.
- `backend/` — the Docker server, API, gateways, protocol daemons, service code, configs, and deployment blueprint for `s.rmaa.pk`.

## Repository layout

```text
README.md
frontend/
  src/                  React/Vite website
  scripts/              static SEO generation used during build
  public/               frontend assets
backend/
  Dockerfile            main Docker image
  entrypoint.sh         starts the API and backend daemons
  api/                  Node API proxied by the C++ gateway
  gateway/              Go gateway source
  gateway_cpp/          production C++ gateway source
  fediverse/ matrix/ scripts/ services/ storage/ static/
  render.yaml           Render blueprint for frontend and backend services
```

All application source and deployment configuration is under `frontend/` or `backend/`; the repository root contains only this README and those two directories.

## Render

The combined blueprint is `backend/render.yaml`. The frontend is a Static Site with root directory `frontend`; the Docker backend is built from the repository root using `backend/Dockerfile` and is served at `s.rmaa.pk`. The frontend calls `https://s.rmaa.pk` for API requests.

After moving the blueprint file, set the Render Blueprint path to `backend/render.yaml` if the existing Blueprint still points to `/render.yaml`. Attach `rmaa.pk` to the new static service after releasing it from the legacy Node website service. Render’s deployment of the code and reassignment of an existing custom domain are separate operations.

The old scheduled GitHub keepalive workflow is nested under `backend/.github`; GitHub only runs workflows in the repository-root `.github/workflows` directory. If the Render free service must be kept warm, use an external monitor or a Render cron. The backend’s internal self-ping alone may not prevent Render idle suspension.

Secrets belong in Render environment settings, not in source. The blueprint marks provider/database secrets as unsynchronized values.

## Local checks

From the repository root:

```sh
cd frontend
npm ci
npm run build
cd ..
docker build -f backend/Dockerfile -t rmaa-backend .
```

The Docker build context (`.`) must remain the repository root. The API health check is `/api/healthz`; website APIs include `/api/blogs`, `/api/ping-google`, and `/api/chat`.
