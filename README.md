# Engagement OS

A single home for every client engagement: project health at a glance, a 182-item EM
checklist, a phased project plan with an auto-generated Gantt timeline, a use-case
repository, KPIs & value tracking, RACI, and the full Value Realization Framework
(Value Baseline, Value Hypothesis, Stakeholder Value Map).

This is a production implementation of the `Engagement OS.dc.html` design handoff.

## Structure

- `client/` — React (Vite) single-page app. All engagement data is stored in the
  browser (`localStorage` for structured data, `IndexedDB` for uploaded file blobs).
  Use **Export all** / **Import backup** to move data between devices.
- `server/` — Small Express API with one real endpoint, `POST /api/extract`, used by
  the Resource Library's **Auto-fill** feature: it reads text already extracted
  client-side from an uploaded file and asks Claude (via the Anthropic API) to
  propose use cases, KPIs, RACI markings, stakeholders, checklist updates and Value
  Baseline answers. Nothing is written to a project until you review and apply the
  suggestions.

## Setup

```bash
npm install --prefix client
npm install --prefix server
```

Copy `server/.env.example` to `server/.env` and set `ANTHROPIC_API_KEY` to enable the
Resource Library's Auto-fill feature (everything else works without it).

## Development

From the repo root:

```bash
npm install   # installs the `concurrently` dev dependency used by `npm run dev`
npm run dev
```

This runs the Vite dev server (`http://localhost:5173`) and the Express API
(`http://localhost:8787`) together; the client proxies `/api/*` to the server in dev.

## Production build

```bash
npm run build   # builds client/dist
npm start       # serves the built client + the API from a single Express process
```
