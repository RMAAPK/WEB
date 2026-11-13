# RMAA Holdings Frontend

React + Vite website deployed as a Render Static Site. All public sub-pages live under `public/`: Accounts, Admin, Forge AI, Ali CNC, and Fargo Lore. Node is used to build the site; there is no frontend Node/Express runtime.

```sh
npm ci
npm run dev
npm run build
```

The production build emits static assets plus sitemap, robots, RSS, and static blog metadata pages. Set `VITE_API_BASE_URL` to `https://s.rmaa.pk` in the Render Static Site environment.
