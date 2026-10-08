# TrAIce Backend

FastAPI backend that serves the existing TrAIce mock dashboard data model.

## Requirements

- Python 3.13
- uv (recommended)

## Run locally

```bash
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Lint and format

```bash
uvx ruff check .
uvx ruff format .
```

## Endpoints

- `GET /health` and `GET /healthz`
- `GET /api/v1/meta/models`
- `GET /api/v1/meta/filters`
- `GET /api/v1/dashboard`

### Example

```bash
curl "http://localhost:8000/api/v1/dashboard?preset=month&models=gptOss120b,gpt4o"
```
