# Engagement OS

A single home for every client engagement: project health at a glance, a 182-item EM
checklist, a phased project plan with an auto-generated Gantt timeline, a use-case
repository, KPIs & value tracking, RACI, and the full Value Realization Framework
(Value Baseline, Value Hypothesis, Stakeholder Value Map).

This is a production implementation of the `Engagement OS.dc.html` design handoff.

## Structure

This is an npm workspaces monorepo (`client`, `server`) with a third, Vercel-only
entry point (`api/`):

- `client/` — React (Vite) single-page app. All engagement data is stored in the
  browser (`localStorage` for structured data, `IndexedDB` for uploaded file blobs).
  Use **Export all** / **Import backup** to move data between devices.
- `server/` — Express API used for local development, plus `server/lib/extract.js`,
  the shared logic behind the Resource Library's **Auto-fill** feature: it reads text
  already extracted client-side from an uploaded file and asks Claude (via the
  Anthropic API) to propose use cases, KPIs, RACI markings, stakeholders, checklist
  updates and Value Baseline answers. Nothing is written to a project until you
  review and apply the suggestions.
- `api/extract.js` — a Vercel serverless function wrapping that same shared logic,
  used instead of the Express server when deployed on Vercel (see below).

## Setup

```bash
npm install
```

(A single `npm install` at the repo root installs both workspaces' dependencies.)

Copy `server/.env.example` to `server/.env` and set `ANTHROPIC_API_KEY` to enable the
Resource Library's Auto-fill feature locally (everything else works without it).

## Development

From the repo root:

```bash
npm run dev
```

This runs the Vite dev server (`http://localhost:5173`) and the Express API
(`http://localhost:8787`) together; the client proxies `/api/*` to the server in dev.

## Production build (self-hosted)

```bash
npm run build   # builds client/dist
npm start       # serves the built client + the API from a single Express process
```

## Deploying to Vercel

The repo includes a root `vercel.json` (build command, `client/dist` as the output
directory) and `api/extract.js`, so importing the repo into Vercel with default
settings (Root Directory = repo root) builds and deploys as-is — no per-package
Root Directory override needed.

One manual step: in the Vercel project's **Settings → Environment Variables**, add
`ANTHROPIC_API_KEY` (and optionally `ANTHROPIC_MODEL`) so `api/extract.js` can reach
the Anthropic API. Everything else (the checklist, plan, use cases, KPIs, RACI, etc.)
works with no configuration, since it's all client-side.
