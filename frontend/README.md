# RMAA Holdings Frontend

React + Vite static website. The frontend is built by Render and published from `dist/`; it is not run with a Node/Express web server.

## Local development

```sh
npm ci
npm run dev
```

## Production build

```sh
npm ci
npm run build
```

The build runs TypeScript checking, Vite, then `scripts/generate-static-seo.cjs` to emit sitemap, robots, RSS, and static blog metadata pages. Set `VITE_API_BASE_URL` at build time to the backend origin (production: `https://s.rmaa.pk`).

The combined Render blueprint is kept at `../backend/render.yaml`; its static-site service points `rootDir` at this directory.
