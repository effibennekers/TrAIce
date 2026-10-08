# TrAIce Workspace

This repository is now split into two applications:

- `dashboard/` - React + TanStack frontend
- `backend/` - FastAPI service that serves the existing TrAIce mock data logic

Deployment is split into two container profiles:

- Development profile in `docker-compose.yml` (hot reload)
- Hardened production-like profile in `docker-compose.prod.yml` (distroless app images + dedicated hardened ingress)

## Docker Compose Profiles

### Development (hot reload)

Use this for day-to-day coding.

```bash
make compose-up
```

Equivalent command:

```bash
docker compose -f docker-compose.yml up --build -d
```

Behavior:

- Backend and dashboard run their `development` Dockerfile targets
- Source code is bind-mounted for fast reload
- Nginx is the development entrypoint

Access:

- App: `http://localhost:8080`
- API through ingress: `http://localhost:8080/api/v1/dashboard`

Stop:

```bash
make compose-down
```

### Production-like (hardened)

Use this to validate runtime hardening and production image behavior locally.

```bash
make compose-prod-up
```

Equivalent command:

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

Behavior:

- Backend runs `production` target (distroless)
- Dashboard runs `production` target (distroless, `server.cjs` runtime)
- Dedicated `nginx/` image handles TLS, redirect, rate limits, and edge headers
- Backend and dashboard are internal-only; only ingress is published

Access:

- HTTP redirect endpoint: `http://localhost:8080`
- HTTPS app: `https://localhost:8443`
- HTTPS API through ingress: `https://localhost:8443/api/v1/dashboard`

Note: local TLS certificate is self-signed (for `curl`, use `-k`).

Stop:

```bash
make compose-prod-down
```

## Run without Docker

### Backend

```bash
cd backend
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Dashboard

```bash
cd dashboard
bun install
bun run dev --host 0.0.0.0 --port 5173
```

## Pre-commit hooks

Versioned hooks live in `.githooks/`.

Enable them once per clone:

```bash
git config core.hooksPath .githooks
chmod +x .githooks/pre-commit
```

The `pre-commit` hook runs:

- Prettier checks for dashboard and root workspace files
- Ruff checks for backend Python code
