from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


class StatusResponse(BaseModel):
    status: str


class RootResponse(StatusResponse):
    service: str


class FilterOption(BaseModel):
    id: str
    label: str
    region: str | None = None


class ModelMetadata(BaseModel):
    id: str
    name: str
    short: str
    co2PerKToken: float
    verified: bool
    color: str
    cssVar: str


class FiltersResponse(BaseModel):
    providers: list[FilterOption]
    dataCenters: list[FilterOption]
    departments: list[FilterOption]
    useCases: list[str]
    taskTypes: list[str]
    defaultModelIds: list[str]


class DashboardQueryParams(BaseModel):
    preset: str = "month"
    custom_start: datetime | None = None
    custom_end: datetime | None = None
    models: str | None = None
    provider: str = "all"
    data_center: str = "all"
    department: str = "all"
    simulation_multiplier: float = Field(default=1.0, gt=0)

    @field_validator("custom_start", "custom_end", mode="after")
    @classmethod
    def normalize_optional_datetime(cls, value: datetime | None) -> datetime | None:
        if value is None:
            return None
        if value.tzinfo is None:
            return value
        return value.astimezone().replace(tzinfo=None)


class DashboardTotals(BaseModel):
    tokens: int
    prompts: int
    users: int
    costEur: int
    latencyMs: int


class IndustryBreakdown(BaseModel):
    yourOrg: float
    banking: float


class DashboardResponse(BaseModel):
    totals: DashboardTotals
    series: list[dict[str, Any]]
    byUseCase: list[dict[str, Any]]
    byTaskType: list[dict[str, Any]]
    productivity: list[dict[str, Any]]
    industry: IndustryBreakdown
    byDepartment: list[dict[str, Any]]

    model_config = ConfigDict(extra="allow")
