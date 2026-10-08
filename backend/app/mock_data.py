from __future__ import annotations

import math
from datetime import datetime, timedelta
from decimal import ROUND_HALF_UP, Decimal
from typing import Any

MODELS: list[dict[str, Any]] = [
    {
        "id": "gptOss120b",
        "name": "GPT OSS 120B",
        "short": "GPT OSS 120B",
        "co2PerKToken": 0.0000002,
        "verified": True,
        "color": "#16A34A",
        "cssVar": "model-gptoss",
    },
    {
        "id": "deepseekV3",
        "name": "DeepSeek V3",
        "short": "DeepSeek V3",
        "co2PerKToken": 0.000417,
        "verified": True,
        "color": "#7C3AED",
        "cssVar": "model-deepseek",
    },
    {
        "id": "mistralSmall",
        "name": "Mistral Small 3 (24B)",
        "short": "Mistral Small",
        "co2PerKToken": 0.000222,
        "verified": True,
        "color": "#F97316",
        "cssVar": "model-mistral",
    },
    {
        "id": "qwen7b",
        "name": "Qwen 2.5 7B",
        "short": "Qwen 2.5 7B",
        "co2PerKToken": 0.000111,
        "verified": True,
        "color": "#06B6D4",
        "cssVar": "model-qwen",
    },
    {
        "id": "gpt4o",
        "name": "OpenAI GPT-4o",
        "short": "GPT-4o",
        "co2PerKToken": 0.000903,
        "verified": False,
        "color": "#FCAB10",
        "cssVar": "model-gpt4o",
    },
    {
        "id": "gpt4omini",
        "name": "OpenAI GPT-4o mini",
        "short": "GPT-4o mini",
        "co2PerKToken": 0.000368,
        "verified": False,
        "color": "#F4C2A1",
        "cssVar": "model-gpt4omini",
    },
    {
        "id": "claude35",
        "name": "Claude 3.5 Sonnet",
        "short": "Claude 3.5",
        "co2PerKToken": 0.000852,
        "verified": False,
        "color": "#2B9EB3",
        "cssVar": "model-claude",
    },
    {
        "id": "llama70",
        "name": "LLaMA 3 70B",
        "short": "LLaMA 3 70B",
        "co2PerKToken": 0.000655,
        "verified": False,
        "color": "#8B5CF6",
        "cssVar": "model-llama70",
    },
    {
        "id": "llama8",
        "name": "LLaMA 3 8B",
        "short": "LLaMA 3 8B",
        "co2PerKToken": 0.000226,
        "verified": False,
        "color": "#C5B4E3",
        "cssVar": "model-llama8",
    },
    {
        "id": "gemma4",
        "name": "Gemma-4 (local)",
        "short": "Gemma-4",
        "co2PerKToken": 0.000189,
        "verified": False,
        "color": "#44AF69",
        "cssVar": "model-gemma",
    },
    {
        "id": "whisperBase",
        "name": "Whisper Base",
        "short": "Whisper B",
        "co2PerKToken": 0.00921,
        "verified": False,
        "color": "#EAB308",
        "cssVar": "model-whisper-base",
    },
    {
        "id": "whisperLarge",
        "name": "Whisper Large",
        "short": "Whisper L",
        "co2PerKToken": 0.01273,
        "verified": False,
        "color": "#D97706",
        "cssVar": "model-whisper-large",
    },
    {
        "id": "sdxl",
        "name": "Stable Diffusion XL",
        "short": "SDXL",
        "co2PerKToken": 0.02296,
        "verified": False,
        "color": "#EF4444",
        "cssVar": "model-sdxl",
    },
]

MODEL_BY_ID: dict[str, dict[str, Any]] = {model["id"]: model for model in MODELS}
DEFAULT_MODEL_IDS: list[str] = ["gptOss120b", "deepseekV3", "gpt4o", "claude35"]

USE_CASES: list[str] = [
    "Software engineering / data engineering & DevOps",
    "Risk management & scenario analysis",
    "AML / transaction monitoring & investigations",
    "Customer onboarding & KYC",
    "Regulatory compliance & reporting",
    "Customer service & contact center",
    "Enterprise knowledge management & internal search",
    "Internal policy / procedures & governance",
    "Marketing & communications (internal/external)",
    "Credit & loan origination",
]

USE_CASE_WEIGHTS: dict[str, float] = {
    "Software engineering / data engineering & DevOps": 1.6,
    "Risk management & scenario analysis": 1.2,
    "AML / transaction monitoring & investigations": 1.0,
    "Customer onboarding & KYC": 0.9,
    "Regulatory compliance & reporting": 0.85,
    "Customer service & contact center": 0.8,
    "Enterprise knowledge management & internal search": 0.75,
    "Internal policy / procedures & governance": 0.6,
    "Marketing & communications (internal/external)": 0.45,
    "Credit & loan origination": 0.4,
}

TASK_TYPES: list[str] = [
    "coding",
    "deep_research",
    "image_generation",
    "drafting",
    "summarising",
    "advising",
    "translation",
    "search",
    "classification",
    "transcription",
]

TASK_WEIGHTS: dict[str, float] = {
    "coding": 1.6,
    "deep_research": 1.4,
    "image_generation": 1.3,
    "drafting": 1.0,
    "summarising": 0.9,
    "advising": 0.8,
    "translation": 0.55,
    "search": 0.45,
    "classification": 0.4,
    "transcription": 0.35,
}

PROVIDERS: list[dict[str, str]] = [
    {"id": "all", "label": "All providers"},
    {"id": "cloud", "label": "All cloud"},
    {"id": "premise", "label": "All on-premise"},
    {"id": "azure", "label": "Azure"},
    {"id": "m365", "label": "M365"},
    {"id": "gcp", "label": "GCP"},
]

DATA_CENTERS: list[dict[str, str]] = [
    {"id": "all", "label": "All data centers", "region": "global"},
    {"id": "ams", "label": "Amsterdam (NL)", "region": "eu"},
    {"id": "fra", "label": "Frankfurt (DE)", "region": "eu"},
    {"id": "par", "label": "Paris (FR)", "region": "eu"},
    {"id": "iad", "label": "Virginia (US)", "region": "us"},
    {"id": "sjc", "label": "San Jose (US)", "region": "us"},
]

DC_SCALE: dict[str, float] = {
    "all": 1.0,
    "ams": 0.62,
    "fra": 0.74,
    "par": 0.48,
    "iad": 0.95,
    "sjc": 0.82,
}

DEPARTMENTS: list[dict[str, str]] = [
    {"id": "all", "label": "All departments"},
    {"id": "retail", "label": "Retail Banking"},
    {"id": "commercial", "label": "Commercial Banking"},
    {"id": "wealth", "label": "Wealth & Private Banking"},
    {"id": "ib", "label": "Investment Banking"},
    {"id": "markets", "label": "Capital Markets"},
    {"id": "risk", "label": "Risk & Compliance"},
    {"id": "ops", "label": "Operations"},
    {"id": "tech", "label": "Technology & Engineering"},
    {"id": "finance", "label": "Finance & Treasury"},
    {"id": "hr", "label": "Human Resources"},
]

DEPT_SHARE: dict[str, float] = {
    "all": 1.0,
    "retail": 0.22,
    "commercial": 0.12,
    "wealth": 0.06,
    "ib": 0.08,
    "markets": 0.07,
    "risk": 0.14,
    "ops": 0.11,
    "tech": 0.13,
    "finance": 0.05,
    "hr": 0.02,
}

KWH_PER_KG = 1 / 0.35
EUR_PER_KWH = 0.42
FUTURE_PRESETS = {"next-week", "next-month", "next-quarter", "next-year"}

MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def hash_value(value: str) -> float:
    h = 2166136261
    for char in value:
        h ^= ord(char)
        h = (h * 16777619) & 0xFFFFFFFF
    return h / 4294967295


def is_future_preset(preset: str) -> bool:
    return preset in FUTURE_PRESETS


def js_round(value: float) -> int:
    if value >= 0:
        return int(math.floor(value + 0.5))
    return int(math.ceil(value - 0.5))


def to_fixed(value: float, digits: int) -> float:
    quant = Decimal("1") if digits == 0 else Decimal("1").scaleb(-digits)
    rounded = Decimal(str(value)).quantize(quant, rounding=ROUND_HALF_UP)
    return float(rounded)


def get_today() -> datetime:
    now = datetime.now()
    return now.replace(hour=23, minute=59, second=59, microsecond=999000)


def to_js_date_string(value: datetime) -> str:
    return value.strftime("%a %b %d %Y")


def get_range_for_preset(
    preset: str,
    custom_start: datetime | None = None,
    custom_end: datetime | None = None,
) -> tuple[datetime, datetime]:
    today = get_today()

    if preset == "custom":
        end = custom_end or today
        end = end.replace(hour=23, minute=59, second=59, microsecond=999000)

        start = custom_start or end
        if custom_start is None:
            start = end - timedelta(days=6)
        start = start.replace(hour=0, minute=0, second=0, microsecond=0)
        return start, end

    if is_future_preset(preset):
        start = (today + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
        end = start

        if preset == "next-week":
            end = start + timedelta(days=6)
        elif preset == "next-month":
            end = start + timedelta(days=29)
        elif preset == "next-quarter":
            end = start + timedelta(days=89)
        elif preset == "next-year":
            end = start + timedelta(days=364)

        end = end.replace(hour=23, minute=59, second=59, microsecond=999000)
        return start, end

    end = today
    start = end

    if preset == "day":
        start = start.replace(hour=0, minute=0, second=0, microsecond=0)
    elif preset == "week":
        start = (end - timedelta(days=6)).replace(hour=0, minute=0, second=0, microsecond=0)
    elif preset == "month":
        start = (end - timedelta(days=29)).replace(hour=0, minute=0, second=0, microsecond=0)
    elif preset == "quarter":
        start = (end - timedelta(days=89)).replace(hour=0, minute=0, second=0, microsecond=0)
    elif preset == "year":
        start = (end - timedelta(days=364)).replace(hour=0, minute=0, second=0, microsecond=0)

    return start, end


def bucketing(start: datetime, end: datetime) -> tuple[str, int]:
    days = (end - start).total_seconds() / 86400

    if days <= 1.5:
        return "hour", 24
    if days <= 8:
        return "day", math.ceil(days)
    if days <= 35:
        return "day", math.ceil(days)
    if days <= 100:
        return "week", math.ceil(days / 7)
    return "month", math.ceil(days / 30)


def fmt_bucket(value: datetime, unit: str) -> str:
    if unit == "hour":
        return f"{value.hour:02d}:00"

    if unit == "month":
        return f"{MONTHS[value.month - 1]} {str(value.year)[2:]}"

    return f"{MONTHS[value.month - 1]} {value.day}"


def provider_scale(provider: str) -> float:
    if provider == "all":
        return 1.0
    if provider == "cloud":
        return 0.78
    if provider == "premise":
        return 0.32
    if provider == "azure":
        return 0.45
    if provider == "m365":
        return 0.28
    if provider == "gcp":
        return 0.22
    return 1.0


def generate_data(opts: dict[str, Any]) -> dict[str, Any]:
    preset = opts.get("preset", "month")
    custom_start = opts.get("custom_start")
    custom_end = opts.get("custom_end")

    selected_models = [m for m in opts.get("models") or DEFAULT_MODEL_IDS if m in MODEL_BY_ID]
    if not selected_models:
        selected_models = list(DEFAULT_MODEL_IDS)

    provider = opts.get("provider", "all")
    data_center = opts.get("data_center", "all")
    department = opts.get("department", "all")
    sim_mul = float(opts.get("simulation_multiplier", 1.0))

    start, end = get_range_for_preset(preset, custom_start, custom_end)
    unit, count = bucketing(start, end)

    total_days = max(1.0, (end - start).total_seconds() / 86400)
    p_scale = provider_scale(provider)
    dc_scale = DC_SCALE.get(data_center, 1.0)
    dept_scale = DEPT_SHARE.get(department, 1.0)

    seed = (
        f"{preset}-{to_js_date_string(start)}-{to_js_date_string(end)}-"
        f"{provider}-{data_center}-{department}-{sim_mul}"
    )

    if unit == "hour":
        step = timedelta(hours=1)
    elif unit == "day":
        step = timedelta(days=1)
    elif unit == "week":
        step = timedelta(days=7)
    else:
        step = timedelta(days=30)

    now_ref = get_today()
    growth_window_days = 365
    growth_multiplier = 3.2
    k = math.log(growth_multiplier) / growth_window_days

    series: list[dict[str, Any]] = []

    for idx in range(count):
        current = start + (step * idx)
        point: dict[str, Any] = {
            "label": fmt_bucket(current, unit),
            "ts": int(current.timestamp() * 1000),
        }

        days_from_now = (current - now_ref).total_seconds() / 86400
        trend = math.exp(k * days_from_now)

        is_weekend = current.weekday() in (5, 6)
        weekend_factor = 0.18 if unit in ("hour", "day") and is_weekend else 1.0

        for model_id in selected_models:
            meta = MODEL_BY_ID[model_id]
            noise = 0.78 + hash_value(f"{seed}-{model_id}-{idx}") * 0.44
            base = (
                meta["co2PerKToken"]
                * 18000
                * trend
                * weekend_factor
                * noise
                * p_scale
                * dc_scale
                * dept_scale
                * sim_mul
            )
            point[model_id] = to_fixed(base, 2)

        series.append(point)

    day_factor = total_days
    model_factor = len(selected_models) / 3
    future_boost = 1.3 if is_future_preset(preset) else 1.0

    tokens = js_round(
        1_250_000
        * (day_factor / 30)
        * model_factor
        * (0.85 + hash_value(seed) * 0.3)
        * p_scale
        * dc_scale
        * dept_scale
        * sim_mul
        * future_boost
    )

    prompts = js_round(
        9_400
        * (day_factor / 30)
        * model_factor
        * (0.85 + hash_value(seed + "p") * 0.3)
        * p_scale
        * dc_scale
        * dept_scale
        * sim_mul
        * future_boost
    )

    users = min(
        520,
        js_round(
            (180 + 180 * math.log10(1 + day_factor))
            * (0.7 + model_factor * 0.3)
            * (1 if provider == "all" else 0.7)
            * (1 if department == "all" else 0.45 + dept_scale * 1.5)
            * math.sqrt(sim_mul)
        ),
    )

    cost_eur = int(to_fixed((tokens / 1000) * 2.1 * (0.9 + hash_value(seed + "c") * 0.2), 0))
    latency_ms = js_round(
        (380 if provider == "premise" else 720) * (0.92 + hash_value(seed + "l") * 0.18)
    )

    total_co2 = 0.0
    for point in series:
        for model_id in selected_models:
            total_co2 += float(point.get(model_id, 0.0))

    by_use_case: list[dict[str, Any]] = []
    for use_case in USE_CASES:
        weight = USE_CASE_WEIGHTS[use_case]
        row: dict[str, Any] = {"useCase": use_case, "total": 0.0}

        subtotal = 0.0
        for model_id in selected_models:
            meta = MODEL_BY_ID[model_id]
            variance = 0.75 + hash_value(f"{seed}-uc-{use_case}-{model_id}") * 0.5
            value = total_co2 * weight * meta["co2PerKToken"] * variance * 6
            row[model_id] = to_fixed(value, 2)
            subtotal += value

        row["total"] = to_fixed(subtotal, 2)
        by_use_case.append(row)

    by_task_type: list[dict[str, Any]] = []
    for task_type in TASK_TYPES:
        weight = TASK_WEIGHTS[task_type]
        row: dict[str, Any] = {"task": task_type, "total": 0.0}

        subtotal = 0.0
        for model_id in selected_models:
            meta = MODEL_BY_ID[model_id]
            variance = 0.75 + hash_value(f"{seed}-tt-{task_type}-{model_id}") * 0.5
            value = total_co2 * weight * meta["co2PerKToken"] * variance * 5.2
            row[model_id] = to_fixed(value, 2)
            subtotal += value

        row["total"] = to_fixed(subtotal, 2)
        by_task_type.append(row)

    productivity: list[dict[str, Any]] = []
    for idx, point in enumerate(series):
        current = datetime.fromtimestamp(point["ts"] / 1000)
        days_from_now = (current - now_ref).total_seconds() / 86400
        trend = math.exp(k * days_from_now)

        is_weekend = current.weekday() in (5, 6)
        weekend_factor = 0.22 if unit in ("hour", "day") and is_weekend else 1.0

        noise = 0.9 + hash_value(f"{seed}-prod-{idx}") * 0.2
        baseline = int(to_fixed(120 * weekend_factor * noise, 0))
        units = int(to_fixed(120 * trend * weekend_factor * noise * math.sqrt(sim_mul), 0))

        productivity.append(
            {
                "label": point["label"],
                "ts": point["ts"],
                "units": units,
                "baseline": baseline,
            }
        )

    org_intensity = to_fixed(7.4 * (0.9 + hash_value(seed + "ind") * 0.2) * p_scale, 2)
    banking_avg = to_fixed(8.6 * (0.95 + hash_value(seed + "bnk") * 0.1), 2)

    bench_seed = (
        f"{preset}-{to_js_date_string(start)}-{to_js_date_string(end)}-"
        f"{provider}-{data_center}-{sim_mul}"
    )
    bench_org_intensity = to_fixed(7.4 * (0.9 + hash_value(bench_seed + "ind") * 0.2) * p_scale, 2)

    by_department: list[dict[str, Any]] = []
    for department_meta in DEPARTMENTS:
        department_id = department_meta["id"]
        if department_id == "all":
            continue

        share = DEPT_SHARE[department_id]
        noise = 0.85 + hash_value(f"{bench_seed}-dept-{department_id}") * 0.3

        by_department.append(
            {
                "id": department_id,
                "label": department_meta["label"],
                "value": to_fixed(bench_org_intensity * (0.6 + share * 2.4) * noise, 2),
            }
        )

    return {
        "totals": {
            "tokens": tokens,
            "prompts": prompts,
            "users": users,
            "costEur": cost_eur,
            "latencyMs": latency_ms,
        },
        "series": series,
        "byUseCase": by_use_case,
        "byTaskType": by_task_type,
        "productivity": productivity,
        "industry": {"yourOrg": org_intensity, "banking": banking_avg},
        "byDepartment": by_department,
    }
