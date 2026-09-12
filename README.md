# Aether — Weather & Climate Analytics Dashboard

A high-precision, real-time weather & climate analytics platform built with
vanilla HTML/CSS/JavaScript, an Express + Next.js backend, and live public APIs
(Open-Meteo, Copernicus CAMS, OpenFreeMap). No API keys are required.

The dashboard is a fully client-side app: it calls the public weather and air
quality APIs directly from the browser. The Express/Next.js server is only an
optional convenience for local development and for caching/proxying upstream
requests — the app runs perfectly as a static site with no backend.

---

## Run locally (with backend)

```bash
npm install
node server.js          # serves on port 80 (falls back to 3000 if unprivileged)
# or
npm run dev             # Next.js dev server
```

Open http://localhost in your browser.

---

## Deploy as a static site (no backend)

The app is designed to be hosted statically on **GitHub Pages** or **Netlify**.
In static mode the client automatically detects the absence of a backend,
skips all `/api/*` proxy calls, and talks to the public weather/air-quality
APIs directly from the browser (CORS-enabled, no key needed). User preferences
and recent locations are persisted to `localStorage` instead of `data.json`.

### Netlify

`netlify.toml` is already configured. Just connect the repo — the build command
is `npm run build:static` and the publish directory is `out`.

```bash
npm run build:static    # produces ./out for local preview
npm run preview:static  # serve ./out locally
```

### GitHub Pages

1. Push the repo to GitHub and enable **Settings → Pages → Source: GitHub Actions**.
2. The included workflow (`.github/workflows/deploy.yml`) builds a static export
   with the correct base path and deploys it.
3. For a **project page** served from `https://<user>.github.io/<repo>/`, the
   workflow sets `BASE_PATH=<repo>` automatically. For a **user/org page**
   (served from the root), set `BASE_PATH` to empty in the workflow.

```bash
npm run build:gh-pages  # static export with BASE_PATH=<repo-name>
```

The workflow uploads `./out` (with a `.nojekyll` marker) and publishes it.

---

## What's in the box

- **Views** — Overview, Climate & Analytics, Air Quality, Interactive World
  Map, City Comparisons, Settings.
- **Visualizations** — hourly area charts, multi-parameter trace, wind rose,
  precipitation bars, pressure trajectory, donut & pie composition charts,
  radar chart, semicircle comfort gauge, waffle grid, bubble scatter plot,
  48-hour AQI trend, stacked pollutant bars, and more.
- **Appearance** — dark / light mode, 5 accent colors + a "Prismatic" mode
  where every card gets its own color, and 3 layout densities. Custom scrollbars
  and full mobile responsiveness included.
- **Live data** — current weather, 7/14-day forecasts, hourly trace, air
  quality (US & European AQI, PM2.5/10, O₃, NO₂, SO₂, CO), climate normals,
  and a dark, watermark-free world map.

---

## Notes

- `data.json` is only used as temporary client-side browser storage (last
  selected location, recent locations, preferences). It is never presented as
  the source of live dashboard data.
- The map uses OpenFreeMap vector tiles (dark/light) with a legally-required,
  unobtrusive attribution line.
- Preferences persist to `localStorage` and sync to `data.json` when a backend
  is present.
