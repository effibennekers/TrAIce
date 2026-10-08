from __future__ import annotations

import os
from typing import Annotated

import uvicorn
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .mock_data import (
    DATA_CENTERS,
    DEFAULT_MODEL_IDS,
    DEPARTMENTS,
    MODELS,
    PROVIDERS,
    TASK_TYPES,
    USE_CASES,
    generate_data,
)
from .schemas import (
    DashboardQueryParams,
    DashboardResponse,
    FilterOption,
    FiltersResponse,
    ModelMetadata,
    RootResponse,
    StatusResponse,
)


def parse_models(value: str | None) -> list[str]:
    fallback = list(DEFAULT_MODEL_IDS)
    if value is None or value.strip() == "":
        return fallback

    model_ids = [item.strip() for item in value.split(",") if item.strip()]
    return model_ids or fallback


app = FastAPI(
    title="TrAIce Backend",
    version="0.1.0",
    description="FastAPI backend that serves TrAIce dashboard mock data.",
)

cors_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8080,http://127.0.0.1:8080",
)
allow_origins = [origin.strip() for origin in cors_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root() -> RootResponse:
    return RootResponse(service="traice-backend", status="ok")


@app.get("/health")
@app.get("/healthz")
def health() -> StatusResponse:
    return StatusResponse(status="ok")


@app.get("/api/v1/meta/models")
def get_models() -> list[ModelMetadata]:
    return [ModelMetadata.model_validate(model) for model in MODELS]


@app.get("/api/v1/meta/filters")
def get_filters() -> FiltersResponse:
    return FiltersResponse(
        providers=[FilterOption.model_validate(item) for item in PROVIDERS],
        dataCenters=[FilterOption.model_validate(item) for item in DATA_CENTERS],
        departments=[FilterOption.model_validate(item) for item in DEPARTMENTS],
        useCases=list(USE_CASES),
        taskTypes=list(TASK_TYPES),
        defaultModelIds=list(DEFAULT_MODEL_IDS),
    )


@app.get("/api/v1/dashboard")
def get_dashboard_data(
    params: Annotated[DashboardQueryParams, Depends()],
) -> DashboardResponse:
    options = {
        "preset": params.preset,
        "custom_start": params.custom_start,
        "custom_end": params.custom_end,
        "models": parse_models(params.models),
        "provider": params.provider,
        "data_center": params.data_center,
        "department": params.department,
        "simulation_multiplier": params.simulation_multiplier,
    }
    return DashboardResponse.model_validate(generate_data(options))


def run() -> None:
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)


if __name__ == "__main__":
    run()
