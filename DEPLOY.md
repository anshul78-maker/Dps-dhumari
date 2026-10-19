# Deploying the ERP backend (HTTPS, persistent data)

The web frontend and the mobile app both talk to the Express + SQLite backend
in this repo (`server/`, started with `npm start`). For real users — especially
the mobile app — that backend needs to run on a **public HTTPS host** with
**persistent storage** for the database and uploaded PDFs.

> The marketing site at `lockmandas-school-erp-web.vercel.app` is a **website
> only** — it does **not** serve `/api`. It can't host this backend (Vercel is
> serverless with an ephemeral, read-only filesystem, so SQLite + file uploads
> don't work there). Use a host with a persistent disk, below.

## Recommended host: Render (Blueprint in this repo)

[`render.yaml`](render.yaml) in the repo root is a ready-to-use Render
Blueprint. It builds with `npm install`, starts with `npm start`, gives you a
free `https://…onrender.com` URL (TLS handled by Render), generates a strong
`JWT_SECRET`, and mounts a **1 GB persistent disk at `/data`** for `data.db`
and `uploads/`.

### Steps

1. Push this repo to GitHub (or GitLab/Bitbucket).
2. In the [Render dashboard](https://dashboard.render.com): **New +  →
   Blueprint**, pick this repository. Render reads `render.yaml`.
3. Review the plan it proposes (one web service + one disk) and **Apply**.
4. Wait for the first build/deploy to finish. Your API is then live at:

   ```
   https://dhumari-public-school-erp.onrender.com
   ```

   (The host prefix matches the service `name` in `render.yaml`; confirm the
   exact URL on the service's page after it deploys.)

5. Sanity-check it: open `https://<your-url>/` (the web app) and
   `https://<your-url>/api/login` should respond (405/400 to a GET is fine —
   it means the API is reachable).

### What the Blueprint sets for you

| Setting | Value | Why |
|---|---|---|
| `JWT_SECRET` | auto-generated | Signs login tokens. **Not** the dev default `dev-secret-change-me` in `server/auth.js`. |
| `DATA_DIR` | `/data` | `server/db.js` and `server/files.js` read this and put `data.db` + `uploads/` on the disk. |
| `PORT` | set by Render | `server/index.js` already reads `process.env.PORT`. |
| HTTPS | automatic | Render terminates TLS on the `onrender.com` domain. |
| Disk `erp-data` | 1 GB at `/data` | Keeps the database and PDFs across restarts and redeploys. |

### Cost note (the persistent disk needs a paid plan)

Render **disks require a paid instance** (Starter, ~$7/mo), so `render.yaml`
sets `plan: starter`. This is the setup you want for real data.

**To trial it for free first:** edit `render.yaml` — remove the `disk:` block,
remove the `DATA_DIR` env var, and set `plan: free`. The app will run on a free
instance, but its filesystem is **ephemeral**: `data.db` and uploaded PDFs are
**wiped on every restart/redeploy**, and the instance sleeps after ~15 min idle
(first request after that is slow). Fine for a demo; not for a live school.

> Choosing a plan and paying for it is your call — this repo just carries the
> config and steps; it does not sign you up for anything.

## CORS

The web frontend is served from the **same origin** as the API, so CORS stays
off by default. The **native mobile app** (React Native / Expo Go) is not a
browser and does **not** need CORS either. Only set `CORS_ORIGIN` (to the
origin that serves the frontend) if you later run **Expo web** or host the web
UI on a different domain than the API.

## Data: seeding and resets

- On first boot the database is **empty**, so it is auto-seeded from
  `seed/data.js`. With a persistent disk this happens **once** — real data then
  accumulates and survives redeploys.
- `npm run seed` **wipes and re-seeds** the database. Don't run it against a
  production disk once real data exists.

## Other hosts

- **Railway / Fly.io** work the same way: Node service + a persistent volume
  mounted at some path, with `DATA_DIR` pointing at it, `JWT_SECRET` set in the
  host's env, and `PORT` from the platform. On Fly, add a `[mounts]` volume in
  `fly.toml` and set `DATA_DIR` to its destination.
- **A host with no persistent disk** (e.g. plain Vercel/Netlify functions)
  can't keep SQLite or uploads. There, switch the database to **managed
  Postgres** and store PDFs in object storage (e.g. S3/R2) — that's a code
  change beyond this deploy config and isn't done here.

## After deploy: point the mobile app at it

Set the mobile app's production API base to your deployed URL. See
[`mobile/.env.example`](mobile/.env.example) and `mobile/README.md`:

```
EXPO_PUBLIC_API_BASE=https://dhumari-public-school-erp.onrender.com
```
