import { MODELS, MODEL_BY_ID, type ModelId } from "./models";

// Simple deterministic PRNG so filter changes feel "real"
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

let TODAY_OVERRIDE: Date | null = null;

/** Override "today" globally (e.g. anchor to sample-data end date). Pass null to reset. */
export function setTodayOverride(d: Date | null): void {
  TODAY_OVERRIDE = d ? new Date(d) : null;
}

/** Single source of truth for "now" across the dashboard. */
export function getToday(): Date {
  const d = TODAY_OVERRIDE ? new Date(TODAY_OVERRIDE) : new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

// ─────────────────────────────────────────────────────────────────────────────
// Use cases (workflow_type from the bank-AI dataset)
// ─────────────────────────────────────────────────────────────────────────────
export const USE_CASES = [
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
] as const;
export type UseCase = (typeof USE_CASES)[number];

// Rebalanced: engineering & deep-reasoning workflows dominate energy spend,
// search drops to mid-pack (high volume but tiny tokens per call).
const USE_CASE_WEIGHTS: Record<UseCase, number> = {
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
};

// ─────────────────────────────────────────────────────────────────────────────
// Task types (from CSV)
// ─────────────────────────────────────────────────────────────────────────────
export const TASK_TYPES = [
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
] as const;
export type TaskType = (typeof TASK_TYPES)[number];

// Energy intensity, not row count. Long-context tasks (coding, research,
// image gen) cost far more per call than short search/classification.
const TASK_WEIGHTS: Record<TaskType, number> = {
  coding: 1.6,
  deep_research: 1.4,
  image_generation: 1.3,
  drafting: 1.0,
  summarising: 0.9,
  advising: 0.8,
  translation: 0.55,
  search: 0.45,
  classification: 0.4,
  transcription: 0.35,
};

// Pretty labels for the chart axis.
export const TASK_LABELS: Record<TaskType, string> = {
  coding: "Coding",
  deep_research: "Deep research",
  image_generation: "Image generation",
  drafting: "Drafting",
  summarising: "Summarising",
  advising: "Advising",
  translation: "Translation",
  search: "Search",
  classification: "Classification",
  transcription: "Transcription",
};

// ─────────────────────────────────────────────────────────────────────────────
// Providers / data centers / departments
// ─────────────────────────────────────────────────────────────────────────────
export const PROVIDERS = [
  { id: "all", label: "All providers" },
  { id: "cloud", label: "All cloud" },
  { id: "premise", label: "All on-premise" },
  { id: "azure", label: "Azure" },
  { id: "m365", label: "M365" },
  { id: "gcp", label: "GCP" },
] as const;
export type ProviderId = (typeof PROVIDERS)[number]["id"];

export const DATA_CENTERS = [
  { id: "all", label: "All data centers", region: "global" },
  { id: "ams", label: "Amsterdam (NL)", region: "eu" },
  { id: "fra", label: "Frankfurt (DE)", region: "eu" },
  { id: "par", label: "Paris (FR)", region: "eu" },
  { id: "iad", label: "Virginia (US)", region: "us" },
  { id: "sjc", label: "San Jose (US)", region: "us" },
] as const;
export type DataCenterId = (typeof DATA_CENTERS)[number]["id"];

const DC_SCALE: Record<DataCenterId, number> = {
  all: 1,
  ams: 0.62,
  fra: 0.74,
  par: 0.48,
  iad: 0.95,
  sjc: 0.82,
};

export const DEPARTMENTS = [
  { id: "all", label: "All departments" },
  { id: "retail", label: "Retail Banking" },
  { id: "commercial", label: "Commercial Banking" },
  { id: "wealth", label: "Wealth & Private Banking" },
  { id: "ib", label: "Investment Banking" },
  { id: "markets", label: "Capital Markets" },
  { id: "risk", label: "Risk & Compliance" },
  { id: "ops", label: "Operations" },
  { id: "tech", label: "Technology & Engineering" },
  { id: "finance", label: "Finance & Treasury" },
  { id: "hr", label: "Human Resources" },
] as const;
export type DepartmentId = (typeof DEPARTMENTS)[number]["id"];

const DEPT_SHARE: Record<DepartmentId, number> = {
  all: 1.0,
  retail: 0.22,
  commercial: 0.12,
  wealth: 0.06,
  ib: 0.08,
  markets: 0.07,
  risk: 0.14,
  ops: 0.11,
  tech: 0.13,
  finance: 0.05,
  hr: 0.02,
};

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
export const KWH_PER_KG = 1 / 0.35;
export const EUR_PER_KWH = 0.42;

export type TimePreset =
  | "day"
  | "week"
  | "month"
  | "quarter"
  | "year"
  | "custom"
  | "next-week"
  | "next-month"
  | "next-quarter"
  | "next-year";

export const FUTURE_PRESETS: TimePreset[] = [
  "next-week",
  "next-month",
  "next-quarter",
  "next-year",
];

export function isFuturePreset(p: TimePreset): boolean {
  return p.startsWith("next-");
}

export function getRangeForPreset(preset: TimePreset, customStart?: Date, customEnd?: Date) {
  const today = getToday();
  if (preset === "custom") {
    const end = customEnd ? new Date(customEnd) : new Date(today);
    end.setHours(23, 59, 59, 999);
    const start = customStart ? new Date(customStart) : new Date(end);
    if (!customStart) start.setDate(end.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }
  if (isFuturePreset(preset)) {
    const start = new Date(today);
    start.setDate(start.getDate() + 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    switch (preset) {
      case "next-week":
        end.setDate(start.getDate() + 6);
        break;
      case "next-month":
        end.setDate(start.getDate() + 29);
        break;
      case "next-quarter":
        end.setDate(start.getDate() + 89);
        break;
      case "next-year":
        end.setDate(start.getDate() + 364);
        break;
    }
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  const end = new Date(today);
  const start = new Date(end);
  switch (preset) {
    case "day":
      start.setHours(0, 0, 0, 0);
      break;
    case "week":
      start.setDate(end.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      break;
    case "month":
      start.setDate(end.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      break;
    case "quarter":
      start.setDate(end.getDate() - 89);
      start.setHours(0, 0, 0, 0);
      break;
    case "year":
      start.setDate(end.getDate() - 364);
      start.setHours(0, 0, 0, 0);
      break;
  }
  return { start, end };
}

function bucketing(start: Date, end: Date) {
  const ms = end.getTime() - start.getTime();
  const days = ms / 86_400_000;
  if (days <= 1.5) return { unit: "hour" as const, count: 24 };
  if (days <= 8) return { unit: "day" as const, count: Math.ceil(days) };
  if (days <= 35) return { unit: "day" as const, count: Math.ceil(days) };
  if (days <= 100) return { unit: "week" as const, count: Math.ceil(days / 7) };
  return { unit: "month" as const, count: Math.ceil(days / 30) };
}

function fmtBucket(d: Date, unit: "hour" | "day" | "week" | "month") {
  if (unit === "hour") return `${String(d.getHours()).padStart(2, "0")}:00`;
  if (unit === "month") return d.toLocaleString("en-US", { month: "short", year: "2-digit" });
  return d.toLocaleString("en-US", { month: "short", day: "numeric" });
}

export interface SeriesPoint {
  label: string;
  ts: number;
  [modelKey: string]: number | string;
}

export interface DashboardData {
  totals: { tokens: number; prompts: number; users: number; costEur: number; latencyMs: number };
  series: SeriesPoint[];
  byUseCase: Array<{ useCase: UseCase; total: number } & Partial<Record<ModelId, number>>>;
  byTaskType: Array<{ task: TaskType; total: number } & Partial<Record<ModelId, number>>>;
  productivity: Array<{ label: string; ts: number; units: number; baseline: number }>;
  industry: { yourOrg: number; banking: number };
  byDepartment: Array<{ id: DepartmentId; label: string; value: number }>;
}

export function generateData(opts: {
  preset: TimePreset;
  customStart?: Date;
  customEnd?: Date;
  models: ModelId[];
  provider?: ProviderId;
  dataCenter?: DataCenterId;
  department?: DepartmentId;
  simulationMultiplier?: number;
}): DashboardData {
  const { start, end } = getRangeForPreset(opts.preset, opts.customStart, opts.customEnd);
  const { unit, count } = bucketing(start, end);
  const totalDays = Math.max(1, (end.getTime() - start.getTime()) / 86_400_000);
  const provider = opts.provider ?? "all";
  const dataCenter = opts.dataCenter ?? "all";
  const department = opts.department ?? "all";
  const simMul = opts.simulationMultiplier ?? 1;
  const providerScale =
    provider === "all"
      ? 1
      : provider === "cloud"
        ? 0.78
        : provider === "premise"
          ? 0.32
          : provider === "azure"
            ? 0.45
            : provider === "m365"
              ? 0.28
              : provider === "gcp"
                ? 0.22
                : 1;
  const dcScale = DC_SCALE[dataCenter] ?? 1;
  const deptScale = DEPT_SHARE[department] ?? 1;
  const seed = `${opts.preset}-${start.toDateString()}-${end.toDateString()}-${provider}-${dataCenter}-${department}-${simMul}`;

  const series: SeriesPoint[] = [];
  const stepMs =
    unit === "hour"
      ? 3600_000
      : unit === "day"
        ? 86_400_000
        : unit === "week"
          ? 7 * 86_400_000
          : 30 * 86_400_000;

  const nowRef = getToday();
  const GROWTH_WINDOW_DAYS = 365;
  const GROWTH_MULTIPLIER = 3.2;
  const k = Math.log(GROWTH_MULTIPLIER) / GROWTH_WINDOW_DAYS;

  for (let i = 0; i < count; i++) {
    const d = new Date(start.getTime() + i * stepMs);
    const point: SeriesPoint = { label: fmtBucket(d, unit), ts: d.getTime() };

    // For past dates, trend grows exponentially toward today.
    // For future dates, the same curve continues forward.
    const daysFromNow = (d.getTime() - nowRef.getTime()) / 86_400_000;
    const trend = Math.exp(k * daysFromNow) * 1; // anchored so today ≈ 1

    const dow = d.getDay();
    const isWeekend = dow === 0 || dow === 6;
    const weekendFactor = unit === "hour" || unit === "day" ? (isWeekend ? 0.18 : 1) : 1;

    for (const m of opts.models) {
      const meta = MODEL_BY_ID[m];
      const noise = 0.78 + hash(`${seed}-${m}-${i}`) * 0.44;
      const base =
        meta.co2PerKToken *
        18000 *
        trend *
        weekendFactor *
        noise *
        providerScale *
        dcScale *
        deptScale *
        simMul;
      point[m] = +base.toFixed(2);
    }
    series.push(point);
  }

  const dayFactor = totalDays;
  const modelFactor = opts.models.length / 3;
  const futureBoost = isFuturePreset(opts.preset) ? 1.3 : 1; // forward growth lift
  const tokens = Math.round(
    1_250_000 *
      (dayFactor / 30) *
      modelFactor *
      (0.85 + hash(seed) * 0.3) *
      providerScale *
      dcScale *
      deptScale *
      simMul *
      futureBoost,
  );
  const prompts = Math.round(
    9_400 *
      (dayFactor / 30) *
      modelFactor *
      (0.85 + hash(seed + "p") * 0.3) *
      providerScale *
      dcScale *
      deptScale *
      simMul *
      futureBoost,
  );
  const users = Math.min(
    520,
    Math.round(
      (180 + 180 * Math.log10(1 + dayFactor)) *
        (0.7 + modelFactor * 0.3) *
        (provider === "all" ? 1 : 0.7) *
        (department === "all" ? 1 : 0.45 + deptScale * 1.5) *
        Math.sqrt(simMul),
    ),
  );
  const costEur = +((tokens / 1000) * 2.1 * (0.9 + hash(seed + "c") * 0.2)).toFixed(0);
  const latencyMs = Math.round(
    (provider === "premise" ? 380 : 720) * (0.92 + hash(seed + "l") * 0.18),
  );

  const totalCo2 = series.reduce((sum, p) => {
    let s = 0;
    for (const m of opts.models) s += (p[m] as number) ?? 0;
    return sum + s;
  }, 0);

  const byUseCase = (USE_CASES as readonly UseCase[]).map((uc) => {
    const w = USE_CASE_WEIGHTS[uc];
    const row: { useCase: UseCase; total: number } & Partial<Record<ModelId, number>> = {
      useCase: uc,
      total: 0,
    };
    let total = 0;
    for (const m of opts.models) {
      const meta = MODEL_BY_ID[m];
      const variance = 0.75 + hash(`${seed}-uc-${uc}-${m}`) * 0.5;
      const v = totalCo2 * w * meta.co2PerKToken * variance * 6;
      row[m] = +v.toFixed(2);
      total += v;
    }
    row.total = +total.toFixed(2);
    return row;
  });

  const byTaskType = (TASK_TYPES as readonly TaskType[]).map((tt) => {
    const w = TASK_WEIGHTS[tt];
    const row: { task: TaskType; total: number } & Partial<Record<ModelId, number>> = {
      task: tt,
      total: 0,
    };
    let total = 0;
    for (const m of opts.models) {
      const meta = MODEL_BY_ID[m];
      const variance = 0.75 + hash(`${seed}-tt-${tt}-${m}`) * 0.5;
      const v = totalCo2 * w * meta.co2PerKToken * variance * 5.2;
      row[m] = +v.toFixed(2);
      total += v;
    }
    row.total = +total.toFixed(2);
    return row;
  });

  const productivity = series.map((p, i) => {
    const d = new Date(p.ts);
    const daysFromNow = (d.getTime() - nowRef.getTime()) / 86_400_000;
    const trend = Math.exp(k * daysFromNow);
    const dow = d.getDay();
    const isWeekend = dow === 0 || dow === 6;
    const weekendFactor = (unit === "hour" || unit === "day") && isWeekend ? 0.22 : 1;
    const noise = 0.9 + hash(`${seed}-prod-${i}`) * 0.2;
    const baseline = +(120 * weekendFactor * noise).toFixed(0);
    const units = +(120 * trend * weekendFactor * noise * Math.sqrt(simMul)).toFixed(0);
    return { label: p.label, ts: p.ts, units, baseline };
  });

  const orgIntensity = +(7.4 * (0.9 + hash(seed + "ind") * 0.2) * providerScale).toFixed(2);
  const bankingAvg = +(8.6 * (0.95 + hash(seed + "bnk") * 0.1)).toFixed(2);

  // Department benchmark must be stable w.r.t. the department filter — only
  // the highlighted bar should change when the user switches department.
  const benchSeed = `${opts.preset}-${start.toDateString()}-${end.toDateString()}-${provider}-${dataCenter}-${simMul}`;
  const benchOrgIntensity = +(7.4 * (0.9 + hash(benchSeed + "ind") * 0.2) * providerScale).toFixed(
    2,
  );
  const byDepartment = DEPARTMENTS.filter((d) => d.id !== "all").map((d) => {
    const share = DEPT_SHARE[d.id];
    const noise = 0.85 + hash(`${benchSeed}-dept-${d.id}`) * 0.3;
    return {
      id: d.id,
      label: d.label,
      value: +(benchOrgIntensity * (0.6 + share * 2.4) * noise).toFixed(2),
    };
  });

  return {
    totals: { tokens, prompts, users, costEur, latencyMs },
    series,
    byUseCase,
    byTaskType,
    productivity,
    industry: { yourOrg: orgIntensity, banking: bankingAvg },
    byDepartment,
  };
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return String(n);
}

export function formatKg(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(2) + " t";
  return n.toFixed(1) + " kg";
}

export const USE_CASE_SHORT: Record<UseCase, string> = {
  "Software engineering / data engineering & DevOps": "Eng. & DevOps",
  "Risk management & scenario analysis": "Risk & scenarios",
  "AML / transaction monitoring & investigations": "AML & monitoring",
  "Customer onboarding & KYC": "Onboarding & KYC",
  "Regulatory compliance & reporting": "Reg. compliance",
  "Customer service & contact center": "Customer service",
  "Enterprise knowledge management & internal search": "Knowledge & search",
  "Internal policy / procedures & governance": "Policy & governance",
  "Marketing & communications (internal/external)": "Marketing & comms",
  "Credit & loan origination": "Credit & loans",
};
