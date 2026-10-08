ARG PYTHON_BASE_IMAGE=python@sha256:bf44cdfcb76cd3b41e879bc058fc37ec5872002ccfde7fcb765e218cde0cd79c
ARG PYTHON_DISTROLESS_IMAGE=gcr.io/distroless/python3-debian13@sha256:774595d652a294b54c9bd575b2d9fdd1a4b47547dc17b8bfa4c0e953c64855b3
ARG PYTHON_VERSION=3.13
ARG PORT=8000

FROM ${PYTHON_BASE_IMAGE} AS base
WORKDIR /app

ARG PORT
ENV PORT=${PORT} \
    PATH="/app/.venv/bin:$PATH" \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN pip install --no-cache-dir uv

EXPOSE ${PORT}

FROM base AS deps
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

FROM deps AS development
COPY app ./app
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --reload"]

FROM ${PYTHON_DISTROLESS_IMAGE} AS production
WORKDIR /app

ARG PYTHON_VERSION
ARG PORT
ENV PORT=${PORT} \
    PATH="/app/.venv/bin:$PATH" \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH="/app/.venv/lib/python${PYTHON_VERSION}/site-packages"

COPY --from=deps --chown=nonroot:nonroot /app/.venv /app/.venv
COPY --chown=nonroot:nonroot app ./app
COPY --chown=nonroot:nonroot start.py ./start.py

USER nonroot
EXPOSE ${PORT}
CMD ["start.py"]
