import Papa from "papaparse";
import { MODELS, MODEL_BY_ID, type ModelId } from "./models";
import {
  USE_CASES,
  TASK_TYPES,
  DEPARTMENTS,
  DATA_CENTERS,
  PROVIDERS,
  KWH_PER_KG,
  EUR_PER_KWH,
  getRangeForPreset,
  getToday,
  isFuturePreset,
  type DashboardData,
  type SeriesPoint,
  type TimePreset,
  type ProviderId,
  type DataCenterId,
  type DepartmentId,
  type UseCase,
  type TaskType,
} from "./mock-data";

export interface UploadedRow {
  ts: number;
  model: ModelId;
  tokens: number;
  energy_kwh: number;
  co2_kg: number;
  cost_eur: number;
  task_type?: TaskType;
  workflow_type?: UseCase;
  department?: DepartmentId;
  data_center?: DataCenterId;
  provider?: ProviderId;
  user_id?: string;
  prompt_id?: string;
  latency_ms?: number;
  units_of_work?: number;
  /** Original CSV string values, preserved so chart axes reflect uploaded data. */
  raw_task_type?: string;
  raw_workflow_type?: string;
  raw_department?: string;
  raw_data_center?: string;
  raw_provider?: string;
}

export interface UploadedDataset {
  filename: string;
  rowCount: number;
  rows: UploadedRow[];
  minTs: number;
  maxTs: number;
  /** Which schema fields are present in the source CSV. */
  presentFields: Set<string>;
  warnings: string[];
  /** True when this is the bundled sample dataset loaded at startup. */
  isDefault?: boolean;
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function matchModel(raw: string): ModelId {
  const n = norm(raw);
  for (const m of MODELS) {
    if (norm(m.id) === n || norm(m.name) === n || norm(m.short) === n) return m.id;
  }
  for (const m of MODELS) {
    if (n.includes(norm(m.short)) || norm(m.short).includes(n)) return m.id;
  }
  // crude fallbacks by family
  if (n.includes("gpt4o") && n.includes("mini")) return "gpt4omini";
  if (n.includes("gpt4o")) return "gpt4o";
  if (n.includes("claude")) return "claude35";
  if (n.includes("llama") && n.includes("70")) return "llama70";
  if (n.includes("llama") && n.includes("8")) return "llama8";
  if (n.includes("deepseek")) return "deepseekV3";
  if (n.includes("mistral")) return "mistralSmall";
  if (n.includes("qwen")) return "qwen7b";
  if (n.includes("gemma")) return "gemma4";
  if (n.includes("whisper") && n.includes("large")) return "whisperLarge";
  if (n.includes("whisper")) return "whisperBase";
  if (n.includes("sd") || n.includes("stable") || n.includes("diffusion")) return "sdxl";
  if (n.includes("oss") || n.includes("120")) return "gptOss120b";
  return "gpt4o";
}

function matchUseCase(raw: string): UseCase | undefined {
  if (!raw) return undefined;
  const n = norm(raw);
  for (const u of USE_CASES) if (norm(u) === n) return u;
  for (const u of USE_CASES) if (norm(u).includes(n) || n.includes(norm(u).slice(0, 10))) return u;
  return undefined;
}

function matchTask(raw: string): TaskType | undefined {
  if (!raw) return undefined;
  const n = norm(raw);
  for (const t of TASK_TYPES) if (norm(t) === n) return t as TaskType;
  for (const t of TASK_TYPES) if (n.includes(norm(t)) || norm(t).includes(n)) return t as TaskType;
  return undefined;
}

function matchDept(raw: string): DepartmentId | undefined {
  if (!raw) return undefined;
  const n = norm(raw);
  for (const d of DEPARTMENTS) if (norm(d.label) === n || norm(d.id) === n) return d.id;
  for (const d of DEPARTMENTS) {
    if (d.id === "all") continue;
    if (norm(d.label).includes(n) || n.includes(norm(d.id))) return d.id;
  }
  return undefined;
}

function matchDc(raw: string): DataCenterId | undefined {
  if (!raw) return undefined;
  const n = norm(raw);
  for (const d of DATA_CENTERS) if (norm(d.label) === n || norm(d.id) === n) return d.id;
  for (const d of DATA_CENTERS) {
    if (d.id === "all") continue;
    if (n.includes(norm(d.id)) || norm(d.label).includes(n)) return d.id;
  }
  return undefined;
}

function matchProvider(raw: string): ProviderId | undefined {
  if (!raw) return undefined;
  const n = norm(raw);
  for (const p of PROVIDERS) if (norm(p.label) === n || norm(p.id) === n) return p.id;
  if (n.includes("azure")) return "azure";
  if (n.includes("m365") || n.includes("microsoft365")) return "m365";
  if (n.includes("gcp") || n.includes("google")) return "gcp";
  if (n.includes("prem") || n.includes("onprem")) return "premise";
  if (n.includes("cloud")) return "cloud";
  return undefined;
}

function parseTs(v: unknown): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") {
    // epoch s or ms
    return v > 1e12 ? v : v * 1000;
  }
  const s = String(v).trim();
  const n = Number(s);
  if (!Number.isNaN(n) && /^\d+$/.test(s)) return n > 1e12 ? n : n * 1000;
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : t;
}

export interface ParseResult {
  headers: string[];
  preview: Record<string, string>[];
  rowCount: number;
  rawRows: Record<string, string>[];
}

export function parseCsv(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (res) => {
        const headers = res.meta.fields ?? [];
        const rows = res.data;
        resolve({
          headers,
          preview: rows.slice(0, 5),
          rowCount: rows.length,
          rawRows: rows,
        });
      },
      error: (err) => reject(err),
    });
  });
}

export function buildDataset(
  filename: string,
  rawRows: Record<string, string>[],
  mapping: Record<string, string | null>,
): UploadedDataset {
  const warnings: string[] = [];
  const present = new Set<string>();
  for (const [k, v] of Object.entries(mapping)) if (v) present.add(k);

  const get = (row: Record<string, string>, key: string): string | undefined => {
    const col = mapping[key];
    if (!col) return undefined;
    const v = row[col];
    return v == null || v === "" ? undefined : String(v).trim();
  };

  const rows: UploadedRow[] = [];
  let skippedTs = 0;
  let skippedTokens = 0;

  for (const r of rawRows) {
    const ts = parseTs(get(r, "timestamp"));
    if (ts == null) {
      skippedTs++;
      continue;
    }
    const modelRaw = get(r, "model") ?? "";
    if (!modelRaw) continue;
    const model = matchModel(modelRaw);

    let tokens = Number(get(r, "tokens") ?? "");
    if (!Number.isFinite(tokens) || tokens <= 0) {
      const inT = Number(get(r, "input_tokens") ?? 0);
      const outT = Number(get(r, "output_tokens") ?? 0);
      tokens = (Number.isFinite(inT) ? inT : 0) + (Number.isFinite(outT) ? outT : 0);
    }
    if (!Number.isFinite(tokens) || tokens <= 0) {
      skippedTokens++;
      continue;
    }

    const meta = MODEL_BY_ID[model];
    let energy_kwh = Number(get(r, "energy_kwh") ?? "");
    if (!Number.isFinite(energy_kwh) || energy_kwh <= 0) {
      energy_kwh = (tokens / 1000) * meta.co2PerKToken;
    }

    let co2_kg = Number(get(r, "co2_kg") ?? "");
    if (!Number.isFinite(co2_kg) || co2_kg <= 0) co2_kg = energy_kwh / KWH_PER_KG;

    let cost_eur = Number(get(r, "cost_eur") ?? "");
    if (!Number.isFinite(cost_eur) || cost_eur <= 0) cost_eur = energy_kwh * EUR_PER_KWH;

    const latency_raw = Number(get(r, "latency_ms") ?? "");
    const latency_ms = Number.isFinite(latency_raw) ? latency_raw : undefined;

    const uow_raw = Number(get(r, "units_of_work") ?? "");
    const units_of_work = Number.isFinite(uow_raw) && uow_raw > 0 ? uow_raw : undefined;

    const rawTask = get(r, "task_type");
    const rawWorkflow = get(r, "workflow_type");
    const rawDept = get(r, "department");
    const rawDc = get(r, "data_center");
    const rawProv = get(r, "provider");
    rows.push({
      ts,
      model,
      tokens,
      energy_kwh,
      co2_kg,
      cost_eur,
      task_type: matchTask(rawTask ?? ""),
      workflow_type: matchUseCase(rawWorkflow ?? ""),
      department: matchDept(rawDept ?? ""),
      data_center: matchDc(rawDc ?? ""),
      provider: matchProvider(rawProv ?? ""),
      user_id: get(r, "user_id"),
      prompt_id: get(r, "prompt_id"),
      latency_ms,
      units_of_work,
      raw_task_type: rawTask,
      raw_workflow_type: rawWorkflow,
      raw_department: rawDept,
      raw_data_center: rawDc,
      raw_provider: rawProv,
    });
  }

  if (skippedTs > 0) warnings.push(`${skippedTs} rows skipped (invalid timestamp).`);
  if (skippedTokens > 0) warnings.push(`${skippedTokens} rows skipped (no tokens).`);
  if (rows.length === 0) warnings.push("No valid rows after parsing.");

  rows.sort((a, b) => a.ts - b.ts);

  return {
    filename,
    rowCount: rows.length,
    rows,
    minTs: rows[0]?.ts ?? Date.now(),
    maxTs: rows[rows.length - 1]?.ts ?? Date.now(),
    presentFields: present,
    warnings,
  };
}

function bucketing(start: Date, end: Date) {
  const days = (end.getTime() - start.getTime()) / 86_400_000;
  if (days <= 1.5) return { unit: "hour" as const, count: 24, stepMs: 3600_000 };
  if (days <= 35) return { unit: "day" as const, count: Math.ceil(days), stepMs: 86_400_000 };
  if (days <= 100)
    return { unit: "week" as const, count: Math.ceil(days / 7), stepMs: 7 * 86_400_000 };
  return { unit: "month" as const, count: Math.ceil(days / 30), stepMs: 30 * 86_400_000 };
}

function fmtBucket(d: Date, unit: "hour" | "day" | "week" | "month") {
  if (unit === "hour") return `${String(d.getHours()).padStart(2, "0")}:00`;
  if (unit === "month") return d.toLocaleString("en-US", { month: "short", year: "2-digit" });
  return d.toLocaleString("en-US", { month: "short", day: "numeric" });
}

export function aggregateUploaded(
  dataset: UploadedDataset,
  opts: {
    preset: TimePreset;
    customStart?: Date;
    customEnd?: Date;
    models: ModelId[];
    provider?: ProviderId;
    dataCenter?: DataCenterId;
    department?: DepartmentId;
    simulationMultiplier?: number;
  },
): DashboardData {
  const { start, end } = getRangeForPreset(opts.preset, opts.customStart, opts.customEnd);
  const { unit, count, stepMs } = bucketing(start, end);
  const simMul = opts.simulationMultiplier ?? 1;
  const isFuture = isFuturePreset(opts.preset);

  // Source rows: filter by selected dimensions if present.
  const inDimFilter = (r: UploadedRow): boolean => {
    if (
      opts.provider &&
      opts.provider !== "all" &&
      r.provider !== opts.provider &&
      r.raw_provider !== opts.provider
    )
      return false;
    if (
      opts.dataCenter &&
      opts.dataCenter !== "all" &&
      r.data_center !== opts.dataCenter &&
      r.raw_data_center !== opts.dataCenter
    )
      return false;
    if (
      opts.department &&
      opts.department !== "all" &&
      r.department !== opts.department &&
      r.raw_department !== opts.department
    )
      return false;
    if (opts.models.length && !opts.models.includes(r.model)) return false;
    return true;
  };

  const filtered = dataset.rows.filter(inDimFilter);

  // For future presets, "shift" the most recent window of the upload forward.
  const shiftMs = isFuture
    ? start.getTime() - Math.max(dataset.minTs, dataset.maxTs - (end.getTime() - start.getTime()))
    : 0;

  const inRange: UploadedRow[] = [];
  if (isFuture) {
    const refStart = dataset.maxTs - (end.getTime() - start.getTime());
    for (const r of filtered) {
      if (r.ts >= refStart && r.ts <= dataset.maxTs) {
        inRange.push({ ...r, ts: r.ts + shiftMs });
      }
    }
  } else {
    for (const r of filtered) {
      if (r.ts >= start.getTime() && r.ts <= end.getTime()) inRange.push(r);
    }
  }

  // Bucketed series per model
  const series: SeriesPoint[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(start.getTime() + i * stepMs);
    const point: SeriesPoint = { label: fmtBucket(d, unit), ts: d.getTime() };
    for (const m of opts.models) point[m] = 0;
    series.push(point);
  }
  for (const r of inRange) {
    const idx = Math.min(count - 1, Math.max(0, Math.floor((r.ts - start.getTime()) / stepMs)));
    if (!opts.models.includes(r.model)) continue;
    const kg = r.co2_kg * simMul;
    series[idx][r.model] = +(((series[idx][r.model] as number) ?? 0) + kg).toFixed(4);
  }

  // Totals
  let totalTokens = 0;
  let totalKwh = 0;
  let totalCostEur = 0;
  const users = new Set<string>();
  const prompts = new Set<string>();
  let latencySum = 0;
  let latencyN = 0;
  for (const r of inRange) {
    totalTokens += r.tokens;
    totalKwh += r.energy_kwh;
    totalCostEur += r.cost_eur;
    if (r.user_id) users.add(r.user_id);
    if (r.prompt_id) prompts.add(r.prompt_id);
    if (r.latency_ms != null) {
      latencySum += r.latency_ms;
      latencyN++;
    }
  }
  const tokens = Math.round(totalTokens * simMul);
  const promptsCount =
    prompts.size > 0 ? Math.round(prompts.size * simMul) : Math.round(inRange.length * simMul);
  const usersCount =
    users.size > 0 ? users.size : Math.max(1, Math.round(Math.sqrt(inRange.length) * 4));
  const costEur = Math.round(totalCostEur * simMul);
  const latencyMs = latencyN > 0 ? Math.round(latencySum / latencyN) : 720;

  // By use case — use raw CSV values when present, fall back to enum.
  const rawWorkflowSet = new Set<string>();
  for (const r of inRange) if (r.raw_workflow_type) rawWorkflowSet.add(r.raw_workflow_type);
  const useCaseKeys: string[] =
    rawWorkflowSet.size > 0 ? Array.from(rawWorkflowSet) : (USE_CASES as readonly string[]).slice();
  const byUseCase = useCaseKeys.map((uc) => {
    const row: { useCase: UseCase; total: number } & Partial<Record<ModelId, number>> = {
      useCase: uc as UseCase,
      total: 0,
    };
    let total = 0;
    for (const m of opts.models) row[m] = 0;
    for (const r of inRange) {
      const key = r.raw_workflow_type ?? r.workflow_type;
      if (key !== uc) continue;
      if (!opts.models.includes(r.model)) continue;
      const v = r.co2_kg * simMul;
      row[r.model] = +(((row[r.model] as number) ?? 0) + v).toFixed(4);
      total += v;
    }
    row.total = +total.toFixed(4);
    return row;
  });

  // By task type — use raw CSV values when present, fall back to enum.
  const rawTaskSet = new Set<string>();
  for (const r of inRange) if (r.raw_task_type) rawTaskSet.add(r.raw_task_type);
  const taskKeys: string[] =
    rawTaskSet.size > 0 ? Array.from(rawTaskSet) : (TASK_TYPES as readonly string[]).slice();
  const byTaskType = taskKeys.map((tt) => {
    const row: { task: TaskType; total: number } & Partial<Record<ModelId, number>> = {
      task: tt as TaskType,
      total: 0,
    };
    let total = 0;
    for (const m of opts.models) row[m] = 0;
    for (const r of inRange) {
      const key = r.raw_task_type ?? r.task_type;
      if (key !== tt) continue;
      if (!opts.models.includes(r.model)) continue;
      const v = r.co2_kg * simMul;
      row[r.model] = +(((row[r.model] as number) ?? 0) + v).toFixed(4);
      total += v;
    }
    row.total = +total.toFixed(4);
    return row;
  });

  // Productivity: prefer real units_of_work when present, otherwise proxy from row count.
  const productivity = series.map((p, i) => {
    const bucketRows = inRange.filter((r) => {
      const idx = Math.min(count - 1, Math.max(0, Math.floor((r.ts - start.getTime()) / stepMs)));
      return idx === i;
    });
    const hasUow = bucketRows.some((r) => r.units_of_work != null);
    let units: number;
    if (hasUow) {
      const sumUow = bucketRows.reduce((s, r) => s + (r.units_of_work ?? 1), 0);
      units = Math.max(1, Math.round(sumUow * simMul));
    } else {
      units = Math.max(1, Math.round(bucketRows.length * 0.6 * Math.sqrt(simMul)));
    }
    const baseline = Math.max(1, Math.round(units * 0.3));
    return { label: p.label, ts: p.ts, units, baseline };
  });

  // Industry / department benchmarks (kWh per 1k prompts)
  const yourOrg =
    promptsCount > 0 ? +((totalKwh * simMul) / (promptsCount / 1000) || 0).toFixed(2) : 0;
  const industry = { yourOrg, banking: +(yourOrg * 1.15 + 0.5).toFixed(2) };

  // Department benchmark must be stable w.r.t. the department filter — only
  // the highlighted bar should change when the user switches department.
  // Rebuild the time-window rows ignoring the department filter.
  const filteredAllDepts = dataset.rows.filter((r) => {
    if (
      opts.provider &&
      opts.provider !== "all" &&
      r.provider !== opts.provider &&
      r.raw_provider !== opts.provider
    )
      return false;
    if (
      opts.dataCenter &&
      opts.dataCenter !== "all" &&
      r.data_center !== opts.dataCenter &&
      r.raw_data_center !== opts.dataCenter
    )
      return false;
    if (opts.models.length && !opts.models.includes(r.model)) return false;
    return true;
  });
  const inRangeAllDepts: UploadedRow[] = [];
  if (isFuture) {
    const refStart = dataset.maxTs - (end.getTime() - start.getTime());
    for (const r of filteredAllDepts) {
      if (r.ts >= refStart && r.ts <= dataset.maxTs)
        inRangeAllDepts.push({ ...r, ts: r.ts + shiftMs });
    }
  } else {
    for (const r of filteredAllDepts) {
      if (r.ts >= start.getTime() && r.ts <= end.getTime()) inRangeAllDepts.push(r);
    }
  }
  // Use raw CSV department names when present, fall back to enum list.
  const rawDeptSet = new Set<string>();
  for (const r of inRangeAllDepts) if (r.raw_department) rawDeptSet.add(r.raw_department);
  const byDepartment =
    rawDeptSet.size > 0
      ? Array.from(rawDeptSet).map((name) => {
          const subset = inRangeAllDepts.filter((r) => r.raw_department === name);
          const kwh = subset.reduce((s, r) => s + r.energy_kwh, 0) * simMul;
          const cnt = Math.max(1, subset.length);
          return { id: name as DepartmentId, label: name, value: +(kwh / (cnt / 1000)).toFixed(2) };
        })
      : DEPARTMENTS.filter((d) => d.id !== "all").map((d) => {
          const subset = inRangeAllDepts.filter((r) => r.department === d.id);
          const kwh = subset.reduce((s, r) => s + r.energy_kwh, 0) * simMul;
          const cnt = Math.max(1, subset.length);
          return { id: d.id, label: d.label, value: +(kwh / (cnt / 1000)).toFixed(2) };
        });

  return {
    totals: { tokens, prompts: promptsCount, users: usersCount, costEur, latencyMs },
    series,
    byUseCase,
    byTaskType,
    productivity,
    industry,
    byDepartment,
  };
}

export interface BaselineRow {
  ts: number;
  units: number;
}

export interface BaselineDataset {
  filename: string;
  rowCount: number;
  rows: BaselineRow[];
  warnings: string[];
}

/**
 * Parse a CSV containing the pre-AI baseline units of work over time.
 * Auto-detects a timestamp column (date/time/timestamp/period/month) and a
 * units column (units/units_of_work/output/work/baseline/value/count).
 */
export function parseBaselineCsv(file: File): Promise<BaselineDataset> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (res) => {
        const headers = res.meta.fields ?? [];
        const tsKey =
          headers.find((h) =>
            /^(timestamp|date|time|period|month|day|week|year)$/i.test(h.trim()),
          ) ?? headers[0];
        const unitsKey =
          headers.find((h) =>
            /(units?(_of_work)?|output|work|baseline|value|count|productivity)/i.test(h.trim()),
          ) ?? headers[1];
        if (!tsKey || !unitsKey) {
          reject(new Error("Need at least two columns: timestamp and units."));
          return;
        }
        const warnings: string[] = [];
        const rows: BaselineRow[] = [];
        let skipped = 0;
        for (const r of res.data) {
          const ts = parseTs(r[tsKey]);
          const units = Number(String(r[unitsKey] ?? "").replace(/[, ]/g, ""));
          if (ts == null || !Number.isFinite(units) || units <= 0) {
            skipped++;
            continue;
          }
          rows.push({ ts, units });
        }
        if (skipped > 0) warnings.push(`${skipped} baseline rows skipped (invalid).`);
        rows.sort((a, b) => a.ts - b.ts);
        resolve({ filename: file.name, rowCount: rows.length, rows, warnings });
      },
      error: (err) => reject(err),
    });
  });
}
