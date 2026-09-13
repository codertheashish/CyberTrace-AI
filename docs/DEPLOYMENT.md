# Deployment Guide

CyberTrace AI has two deployable parts, and they need **different kinds of
hosting**:

| Part | What it is | Where to deploy |
|---|---|---|
| `frontend/` | Static React/Vite build | **Vercel** (or Netlify) |
| `backend/` + `ml/` | Long-running FastAPI process + SQLite file + trained model | **Render** or **Railway** (a real server, not serverless) |

**Why not put everything on Vercel?** Vercel runs backends as short-lived
serverless functions with a read-only filesystem (except `/tmp`, which is
wiped between invocations). This backend needs to load a ~few-MB model file
into memory and read/write a SQLite database on disk — that needs a
persistent, always-on process, which Vercel's serverless model doesn't give
you. So: **frontend on Vercel, backend on Render/Railway**, talking to each
other over the network (CORS is already wide open in `backend/app/main.py`).

---

## Part 1 — Push the code to GitHub

From the project root (`cybertrace-ai/`):

```bash
git init
git add .
git commit -m "Initial commit: CyberTrace AI"
```

Then on github.com: create a new empty repository (don't initialize it with a
README), copy the URL it gives you, and:

```bash
git remote add origin https://github.com/<your-username>/<your-repo>.git
git branch -M main
git push -u origin main
```

**Before you commit**, make sure `frontend/node_modules/`, `frontend/dist/`,
and Python `__pycache__/` folders are excluded — add a `.gitignore`:

```
node_modules/
dist/
__pycache__/
*.pyc
.env
```

You can commit `backend/data/*.csv`, `backend/data/cybertrace.db`, and
`ml/saved_models/*.joblib` if you want the repo to be immediately runnable —
or leave them out and let the Render build step regenerate them (see below).

---

## Part 2 — Deploy the backend (Render)

1. Go to [render.com](https://render.com) → **New +** → **Web Service** →
   connect your GitHub repo.
2. **Root Directory:** `backend`
3. **Environment:** Python 3
4. **Build Command:**
   ```
   pip install -r requirements.txt && python ../ml/generate_dataset.py && python ../ml/train_model.py && python app/database/setup_db.py
   ```
   (This regenerates the synthetic data and retrains the model fresh on every
   deploy — a `render.yaml` with this exact config is already included at
   `backend/render.yaml`, so Render may detect it automatically.)
5. **Start Command:**
   ```
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
6. Deploy. Once live, note your backend URL, e.g.
   `https://cybertrace-backend.onrender.com`.
7. Confirm it works: open
   `https://cybertrace-backend.onrender.com/api/health` — you should see
   `{"status":"ok","model_available":true}`.

**Railway** works the same way (New Project → Deploy from GitHub → set root
directory to `backend` → same build/start commands) if you prefer it over
Render.

> Free tiers on both platforms "sleep" after inactivity — the first request
> after a period of idleness can take 20–50 seconds while it wakes up. That's
> normal, not a bug.

---

## Part 3 — Deploy the frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) → **Add New** → **Project** →
   import the same GitHub repo.
2. **Root Directory:** `frontend`
3. Framework preset: Vite (should auto-detect). Build command `npm run
   build`, output directory `dist` (a `vercel.json` with the SPA rewrite rule
   is already included at `frontend/vercel.json`, so client-side routes like
   `/dashboard` won't 404 on refresh).
4. **Environment Variables** (Project Settings → Environment Variables):
   | Key | Value |
   |---|---|
   | `VITE_API_BASE_URL` | `https://cybertrace-backend.onrender.com/api` (your Render URL + `/api`) |
   | `VITE_ADMIN_USERNAME` | your chosen login username (default `admin`) |
   | `VITE_ADMIN_PASSWORD` | your chosen login password (default `cybertrace@2026`) |
5. Deploy. Vercel gives you a URL like `https://cybertrace-ai.vercel.app`.
6. Open it, log in with the credentials you set, and the dashboard should
   pull real data from your Render backend.

A `.env.example` is included at `frontend/.env.example` documenting these
same variables for local development.

---

## Common Issues After Deploying

| Symptom | Cause | Fix |
|---|---|---|
| "Request failed" on every page | `VITE_API_BASE_URL` not set, or set without `/api` at the end | Double-check the env var includes the `/api` suffix, then **redeploy** the frontend (env var changes require a new build on Vercel) |
| CORS error in browser console | Backend not reachable or crashed | Visit the backend's `/api/health` URL directly first |
| Login page accepts nothing / wrong creds | `VITE_ADMIN_USERNAME` / `VITE_ADMIN_PASSWORD` env vars differ from what you're typing | Check Vercel project env vars, redeploy after changing them |
| Backend `model_available: false` | The build command's `train_model.py` step failed or was skipped | Check Render build logs; re-run the build command locally to see the error |
| First load is very slow | Free-tier backend was asleep | Normal — wait ~30s, it wakes up on the first request |

---

## Local Development (unchanged)

Local dev still works exactly as before — leave `VITE_API_BASE_URL` unset
locally and Vite's dev proxy (`frontend/vite.config.ts`) forwards `/api/*` to
`localhost:8000` automatically.
