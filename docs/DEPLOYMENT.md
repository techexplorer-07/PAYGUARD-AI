# Deploying PAYGUARD AI (free tier)

- **Frontend** (React + Vite) → **Vercel**
- **Backend** (FastAPI) → **Render** free web service

Both deploy from GitHub and redeploy automatically on every push to the chosen branch.
Order matters: deploy the backend first, because the frontend build needs the backend's address.

---

## Before you start

- A GitHub account with access to this repository.
- Sign in to **https://render.com** and **https://vercel.com** with that GitHub account.
- Decide which branch to deploy (normally `main` after pull requests are merged).

---

## Part 1 — Backend on Render

### 1.1 Create the service

1. Render dashboard → **New** → **Blueprint**.
2. Connect the repository. Render reads [`render.yaml`](../render.yaml) and proposes a web service named `payguard-api`.
3. Choose the branch to deploy.
4. When asked for the values marked `sync: false`:
   - `CORS_EXTRA_ORIGINS`: leave empty for now; it is filled in Part 3.
   - `CORS_ORIGIN_REGEX`: leave empty (optional, see Part 3).
5. Click **Apply**. The first build takes a few minutes (it installs scikit-learn and pandas).

`render.yaml` already sets:

| Setting | Value | Why |
|---|---|---|
| Root directory | `backend` | The FastAPI app lives there |
| Build | `pip install -r requirements.txt` | |
| Start | `uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1` | One worker: the evidence graph and model live in process memory |
| Health check | `/health` | Render restarts the service if this fails |
| `PYTHON_VERSION` | `3.11.9` | Matches local development |
| `ENVIRONMENT` | `production` | |
| `DEBUG` | `false` | Hides internal exception details from API responses |

### 1.2 Check it

Open `https://<your-service>.onrender.com/health`. Expected:

```json
{"status":"ok","service":"payguard-api"}
```

Copy this base address (without `/health`), e.g. `https://payguard-api.onrender.com`.

---

## Part 2 — Frontend on Vercel

1. Vercel dashboard → **Add New…** → **Project** → import the repository.
2. **Root Directory**: click **Edit** and choose `frontend`. (Required: the repo also contains the backend.)
3. Framework preset: **Vite** (detected automatically; [`frontend/vercel.json`](../frontend/vercel.json) also sets it).
4. **Environment Variables** → add:
   - Name: `VITE_API_BASE_URL`
   - Value: the Render address from Part 1.2, e.g. `https://payguard-api.onrender.com` (no trailing slash needed)
   - Environments: Production (and Preview if you use preview links)
5. Click **Deploy**.

If `VITE_API_BASE_URL` is missing, the build stops on purpose with a message telling you to add it,
instead of producing a site that silently calls `127.0.0.1` on visitors' machines.

`frontend/vercel.json` also:
- serves `index.html` for every route, so refreshing `/analyse`, `/investigator/...` etc. works;
- caches hashed assets for a year and adds basic security headers.

Copy the production address Vercel gives you, e.g. `https://payguard-ai.vercel.app`.

---

## Part 3 — Connect them (CORS)

The backend only accepts browser requests from allowed origins.

1. Render → `payguard-api` → **Environment**.
2. Set `CORS_EXTRA_ORIGINS` to the Vercel address, e.g. `https://payguard-ai.vercel.app`.
   Several addresses can be comma-separated (add your custom domain here later).
3. Optional, for Vercel preview deployments: set `CORS_ORIGIN_REGEX`, e.g.
   `https://payguard-ai(-[a-z0-9-]+)?\.vercel\.app`
4. **Save changes**. Render redeploys automatically.

---

## Part 4 — Live check (5 minutes)

On the Vercel address, on a laptop and a phone:

1. Dashboard loads.
2. **Profile → System diagnostics** (`/system`) shows the backend as connected.
3. **Analyse**: submit a suspicious message with a different UPI ID → a HIGH result and the warning sound.
4. **Investigator** (`/investigator`): the header shows **Service online**; switch to **Demo dataset** and open the alert queue, an investigation and the evidence graph.
5. Refresh on `/investigator/graph`: the page still loads.

---

## Free-tier behaviour to know

- **Render free services sleep** after a period without traffic; the next request can take about a minute.
  Before a demo, open `/health` once to wake it. To keep it awake, a free uptime monitor
  (e.g. UptimeRobot or cron-job.org) can request `https://<service>.onrender.com/health` every 10 minutes.
- **Memory resets on restart or sleep.** The SPEG evidence graph and the investigator's session records are in memory only.
- Free-plan limits and policies change; check Render's and Vercel's current terms.

## Known gap: PaySim model file

The PaySim supervised behavioural model (`backend/models/paysim_behavior_model.joblib`) is git-ignored,
so it is **not** deployed. The backend starts normally and logs
`PaySim model artifact not found`; the supervised behavioural signal is then unavailable while every other engine works.
To include it, the backend owner can commit the model file (if its size and licence allow) or host it elsewhere
and point `PAYSIM_MODEL_PATH` at it. Locally, `backend/tests/test_paysim_behavior.py` needs this file to pass.

## Custom domain (later)

When you have a domain: add it in Vercel → Project → **Domains** and in Render → Service → **Settings → Custom Domains**,
follow the DNS records each shows, then add the new frontend address to `CORS_EXTRA_ORIGINS`.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Vercel build fails: "VITE_API_BASE_URL is not set" | Add the variable (Part 2.4) and redeploy |
| Site loads but analysis fails with "couldn't reach the analysis service" | Backend asleep (wait / open `/health`) or CORS: check `CORS_EXTRA_ORIGINS` matches the exact Vercel address, including `https://` |
| 404 on page refresh | Vercel Root Directory must be `frontend` so `vercel.json` is used |
| Render build fails on a missing module | Add it to `backend/requirements.txt` |
| `/system` shows the backend offline | Same as the CORS row above |
