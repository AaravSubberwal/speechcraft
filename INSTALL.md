# Install And Bootstrap

This guide is written for both humans and coding agents.

The goal is to make repo setup deterministic, low-friction, and easy to verify.

## What You Are Setting Up

Speechcraft currently has two runnable parts:

- `backend/`: FastAPI API for the Phase 1 Clip Prep Workstation
- `frontend/`: React + Vite UI for the Phase 1 workstation

The backend provides a persistent demo project and writes local state to disk.

## Recommended Prerequisites

These are the preferred tools for the current repo:

- Python `3.11+`
- Node.js `20+`
- `npm` `10+`
- `uv` for Python environment management
- `make`

Optional:

- `bun` works for the frontend, but `npm` is the portability default for other users and agents

## One-Time Bootstrap

## Fastest Path

From the repo root:

```bash
make setup
make check
```

Then run the app in two terminals:

```bash
make dev-backend
```

```bash
make dev-frontend
```

Use `make help` to see the available repo-level commands.

## One-Time Bootstrap

### Backend

Run from the repo root:

```bash
cd backend
UV_CACHE_DIR=/tmp/uv-cache uv sync
```

This creates `backend/.venv/` and installs the backend dependencies.

### Frontend

Run from the repo root:

```bash
cd frontend
npm install
```

This installs the Vite + React dependencies into `frontend/node_modules/`.

## Run The App

Open two terminals.

### Terminal 1: Backend

```bash
cd /home/kavin/github/speechcraft/backend
UV_CACHE_DIR=/tmp/uv-cache uv run uvicorn app.main:app --reload
```

Backend URLs:

- API root: `http://127.0.0.1:8000`
- OpenAPI docs: `http://127.0.0.1:8000/docs`

### Terminal 2: Frontend

```bash
cd /home/kavin/github/speechcraft/frontend
npm run dev
```

Frontend URL:

- App: `http://127.0.0.1:5173`

## Fish Shell Note

If you want to activate the backend venv manually in `fish`, use:

```fish
source .venv/bin/activate.fish
```

Then you can run:

```fish
uvicorn app.main:app --reload
```

Using `uv run ...` is still the simpler default.

## Agent Bootstrap Checklist

If an agent is setting up the repo automatically, this is the preferred sequence:

1. From the repo root, prefer the helper layer first:

```bash
cd /home/kavin/github/speechcraft
make setup
make check
```

2. If the agent needs the explicit underlying commands instead, use:

Backend deps:

```bash
cd /home/kavin/github/speechcraft/backend
UV_CACHE_DIR=/tmp/uv-cache uv sync
```

Frontend deps:

```bash
cd /home/kavin/github/speechcraft/frontend
npm install
```

3. Verify backend code compiles:

```bash
cd /home/kavin/github/speechcraft
python3 -m compileall backend/app
```

4. Verify frontend builds:

```bash
cd /home/kavin/github/speechcraft/frontend
npm run build
```

5. Start backend:

```bash
cd /home/kavin/github/speechcraft
make dev-backend
```

6. Start frontend:

```bash
cd /home/kavin/github/speechcraft
make dev-frontend
```

7. Open and verify:

- `http://127.0.0.1:5173/`
- `http://127.0.0.1:5173/backend-test`
- `http://127.0.0.1:8000/docs`

## What Gets Created Locally

The repo creates local state in these places:

- `backend/.venv/`: Python virtual environment
- `frontend/node_modules/`: frontend dependencies
- `frontend/dist/`: frontend production build output
- `backend/data/phase1-demo.json`: persistent demo project state
- `backend/exports/`: export runs and rendered demo output

These are generated or local-runtime files and should not be treated as source.

## Default Runtime Behavior

Important defaults:

- The frontend points to `http://127.0.0.1:8000` by default.
- If needed, you can override the frontend API target with `VITE_API_BASE_URL`.
- The main workstation uses backend-aware fallback helpers for some reads.
- The `/backend-test` route is stricter and is intended to hit the real backend only.

## Troubleshooting

### `uv sync` fails during backend install

Use the commands exactly as shown above from `backend/`.

The current backend packaging is configured for editable installs and should work with:

```bash
cd backend
UV_CACHE_DIR=/tmp/uv-cache uv sync
```

### Frontend cannot reach the backend

Check:

- backend is running on `127.0.0.1:8000`
- `VITE_API_BASE_URL` is not pointing somewhere stale
- your browser console for fetch errors

### Audio preview does not play

The frontend depends on the backend route:

- `GET /api/clips/{clip_id}/audio`

If the backend is down or returning an error, playback will fail.

### Export succeeds but the audio is not “real”

That is expected for now.

The current repo uses deterministic synthetic clip rendering for demo purposes.
Real source-backed rendering is a later upgrade.

## DX Notes

For the best developer experience in this repo:

- use the root `Makefile` first
- use `uv` for backend setup and execution
- use `npm` for frontend setup and execution
- use `make check` for quick repo-level verification
- use `/backend-test` after startup to validate the current backend surface quickly
