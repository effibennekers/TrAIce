export interface CsvField {
  key: string;
  label: string;
  required: boolean;
  /** Aliases the auto-mapper will try (case-insensitive, snake/space tolerant). */
  aliases: string[];
  description: string;
  /** Widget areas that use this field. */
  powers: string[];
}

export const CSV_SCHEMA: CsvField[] = [
  {
    key: "timestamp",
    label: "Timestamp",
    required: true,
    aliases: ["timestamp", "date", "datetime", "time", "created_at", "ts"],
    description: "When the prompt was sent. ISO 8601, RFC 3339 or epoch ms.",
    powers: ["Usage & emissions over time", "All time filters"],
  },
  {
    key: "model",
    label: "Model name",
    required: true,
    aliases: ["model", "model_name", "ai_model", "engine", "llm"],
    description: "Name of the model that served the prompt (e.g. gpt-4o, claude-3.5).",
    powers: ["Model legend", "Per-model breakdown"],
  },
  {
    key: "tokens",
    label: "Tokens",
    required: true,
    aliases: ["tokens", "total_tokens", "token_count"],
    description:
      "Total tokens for the request. If you only have input/output, the upload form sums them.",
    powers: ["Energy, emissions, cost, KPIs"],
  },
  {
    key: "input_tokens",
    label: "Input tokens",
    required: false,
    aliases: ["input_tokens", "prompt_tokens", "tokens_in"],
    description: "Used as a fallback for tokens when no total column is present.",
    powers: ["Tokens KPI"],
  },
  {
    key: "output_tokens",
    label: "Output tokens",
    required: false,
    aliases: ["output_tokens", "completion_tokens", "tokens_out"],
    description: "Used as a fallback for tokens when no total column is present.",
    powers: ["Tokens KPI"],
  },
  {
    key: "energy_kwh",
    label: "Energy (kWh)",
    required: false,
    aliases: ["energy_kwh", "kwh", "energy", "energy_consumption_kwh"],
    description: "Measured energy in kWh. If absent, computed from tokens × per-model factor.",
    powers: ["Usage chart", "All energy figures"],
  },
  {
    key: "co2_kg",
    label: "CO₂ (kg)",
    required: false,
    aliases: ["co2_kg", "co2", "emissions_kg", "kg_co2e", "co2e_kg"],
    description: "Measured CO₂e. If absent, computed from energy × grid intensity.",
    powers: ["Emissions toggle"],
  },
  {
    key: "cost_eur",
    label: "Cost (€)",
    required: false,
    aliases: ["cost_eur", "cost", "price_eur", "euro_cost", "cost_€"],
    description: "Per-request cost in euro. If absent, computed from energy × €0.42/kWh.",
    powers: ["Cost KPI", "Cost toggle"],
  },
  {
    key: "task_type",
    label: "Task type",
    required: false,
    aliases: ["task_type", "task", "category", "intent"],
    description: "Generic task — search, coding, summarising, etc.",
    powers: ["Impact per task-type"],
  },
  {
    key: "workflow_type",
    label: "Use case / workflow",
    required: false,
    aliases: ["workflow_type", "workflow", "use_case", "usecase", "business_process"],
    description: "Business use case driving the prompt.",
    powers: ["Impact per use case"],
  },
  {
    key: "department",
    label: "Department",
    required: false,
    aliases: ["department", "team", "business_unit", "bu", "org_unit"],
    description: "Which department issued the prompt.",
    powers: ["Department filter & benchmark"],
  },
  {
    key: "data_center",
    label: "Data center / region",
    required: false,
    aliases: ["data_center", "datacenter", "region", "dc", "location"],
    description: "Where the request was served. Drives grid intensity.",
    powers: ["Data-center filter"],
  },
  {
    key: "provider",
    label: "Provider",
    required: false,
    aliases: ["provider", "cloud", "vendor", "platform"],
    description: "Cloud or hosting provider (Azure, GCP, on-premise…).",
    powers: ["Provider filter"],
  },
  {
    key: "user_id",
    label: "User ID",
    required: false,
    aliases: ["user_id", "user", "userid", "employee_id"],
    description: "Unique user identifier. Powers active-users KPI.",
    powers: ["Active users KPI"],
  },
  {
    key: "prompt_id",
    label: "Prompt ID",
    required: false,
    aliases: ["prompt_id", "request_id", "id"],
    description: "Unique request identifier. Defaults to row count.",
    powers: ["Prompts KPI"],
  },
  {
    key: "units_of_work",
    label: "Units of work",
    required: false,
    aliases: [
      "units_of_work",
      "units",
      "work_units",
      "output_units",
      "deliverables",
      "items_completed",
      "tasks_done",
    ],
    description:
      "Concrete business output the prompt produced — e.g. 1 ticket resolved, 1 page summarised, 1 PR reviewed, 1 invoice extracted, 1 minute transcribed. Use 1 per row if the prompt equals one deliverable; decimals allowed (0.25 = a quarter of a deliverable). Leave blank to fall back to a row-count proxy.",
    powers: ["Productivity", "Time to market"],
  },
  {
    key: "latency_ms",
    label: "Latency (ms)",
    required: false,
    aliases: ["latency_ms", "latency", "duration_ms", "response_ms"],
    description: "End-to-end response time in milliseconds.",
    powers: ["Avg. latency KPI"],
  },
];

export const REQUIRED_FIELDS = CSV_SCHEMA.filter((f) => f.required);
export const OPTIONAL_FIELDS = CSV_SCHEMA.filter((f) => !f.required);

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Best-effort header → schema field auto-mapping. */
export function autoMap(headers: string[]): Record<string, string | null> {
  const map: Record<string, string | null> = {};
  const normHeaders = headers.map((h) => ({ raw: h, n: norm(h) }));
  for (const f of CSV_SCHEMA) {
    let hit: string | null = null;
    for (const a of f.aliases) {
      const na = norm(a);
      const m = normHeaders.find((h) => h.n === na);
      if (m) {
        hit = m.raw;
        break;
      }
    }
    if (!hit) {
      // looser contains match
      for (const a of f.aliases) {
        const na = norm(a);
        const m = normHeaders.find((h) => h.n.includes(na) || na.includes(h.n));
        if (m) {
          hit = m.raw;
          break;
        }
      }
    }
    map[f.key] = hit;
  }
  return map;
}
