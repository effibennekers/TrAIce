export type ModelId =
  | "gptOss120b"
  | "deepseekV3"
  | "mistralSmall"
  | "qwen7b"
  | "gpt4o"
  | "gpt4omini"
  | "claude35"
  | "llama70"
  | "llama8"
  | "gemma4"
  | "whisperBase"
  | "whisperLarge"
  | "sdxl";

export interface ModelMeta {
  id: ModelId;
  name: string;
  short: string;
  /** kWh per 1k tokens — energy intensity factor across the dashboard. */
  co2PerKToken: number;
  /** Energy figure verified against vendor / direct telemetry? */
  verified: boolean;
  color: string;
  cssVar: string;
}

// kWh per 1k tokens. Verified models derived from ml.energy/leaderboard
// (Joule/token measured on H100), unverified models from CSV averages.
// Conversion: 1 J/token = 2.78e-4 kWh / 1k tokens.
export const MODELS: ModelMeta[] = [
  {
    id: "gptOss120b",
    name: "GPT OSS 120B",
    short: "GPT OSS 120B",
    co2PerKToken: 0.0000002, // ~0.0007 J/token → Label A
    verified: true,
    color: "#16A34A",
    cssVar: "model-gptoss",
  },
  {
    id: "deepseekV3",
    name: "DeepSeek V3",
    short: "DeepSeek V3",
    co2PerKToken: 0.000417, // ~1.5 J/token (MoE, 37B active)  → Label E
    verified: true,
    color: "#7C3AED",
    cssVar: "model-deepseek",
  },
  {
    id: "mistralSmall",
    name: "Mistral Small 3 (24B)",
    short: "Mistral Small",
    co2PerKToken: 0.000222, // ~0.8 J/token  → Label D
    verified: true,
    color: "#F97316",
    cssVar: "model-mistral",
  },
  {
    id: "qwen7b",
    name: "Qwen 2.5 7B",
    short: "Qwen 2.5 7B",
    co2PerKToken: 0.000111, // ~0.4 J/token  → Label D
    verified: true,
    color: "#06B6D4",
    cssVar: "model-qwen",
  },
  {
    id: "gpt4o",
    name: "OpenAI GPT-4o",
    short: "GPT-4o",
    co2PerKToken: 0.000903,
    verified: false,
    color: "#FCAB10",
    cssVar: "model-gpt4o",
  },
  {
    id: "gpt4omini",
    name: "OpenAI GPT-4o mini",
    short: "GPT-4o mini",
    co2PerKToken: 0.000368,
    verified: false,
    color: "#F4C2A1",
    cssVar: "model-gpt4omini",
  },
  {
    id: "claude35",
    name: "Claude 3.5 Sonnet",
    short: "Claude 3.5",
    co2PerKToken: 0.000852,
    verified: false,
    color: "#2B9EB3",
    cssVar: "model-claude",
  },
  {
    id: "llama70",
    name: "LLaMA 3 70B",
    short: "LLaMA 3 70B",
    co2PerKToken: 0.000655,
    verified: false,
    color: "#8B5CF6",
    cssVar: "model-llama70",
  },
  {
    id: "llama8",
    name: "LLaMA 3 8B",
    short: "LLaMA 3 8B",
    co2PerKToken: 0.000226,
    verified: false,
    color: "#C5B4E3",
    cssVar: "model-llama8",
  },
  {
    id: "gemma4",
    name: "Gemma-4 (local)",
    short: "Gemma-4",
    co2PerKToken: 0.000189,
    verified: false,
    color: "#44AF69",
    cssVar: "model-gemma",
  },
  {
    id: "whisperBase",
    name: "Whisper Base",
    short: "Whisper B",
    co2PerKToken: 0.00921,
    verified: false,
    color: "#EAB308",
    cssVar: "model-whisper-base",
  },
  {
    id: "whisperLarge",
    name: "Whisper Large",
    short: "Whisper L",
    co2PerKToken: 0.01273,
    verified: false,
    color: "#D97706",
    cssVar: "model-whisper-large",
  },
  {
    id: "sdxl",
    name: "Stable Diffusion XL",
    short: "SDXL",
    co2PerKToken: 0.02296,
    verified: false,
    color: "#EF4444",
    cssVar: "model-sdxl",
  },
];

export const MODEL_BY_ID: Record<ModelId, ModelMeta> = MODELS.reduce(
  (acc, m) => ({ ...acc, [m.id]: m }),
  {} as Record<ModelId, ModelMeta>,
);

export const ALL_MODEL_IDS: ModelId[] = MODELS.map((m) => m.id);

/** Default selected — mix of verified and unverified for a representative view. */
export const DEFAULT_MODEL_IDS: ModelId[] = ["gptOss120b", "deepseekV3", "gpt4o", "claude35"];

const OPEN_WEIGHTS: ModelId[] = [
  "gptOss120b",
  "deepseekV3",
  "mistralSmall",
  "qwen7b",
  "llama70",
  "llama8",
  "gemma4",
  "whisperBase",
  "whisperLarge",
  "sdxl",
];

/** Which models each provider can host. */
export const PROVIDER_MODEL_COMPATIBILITY: Record<string, ModelId[]> = {
  all: ALL_MODEL_IDS,
  cloud: ALL_MODEL_IDS,
  premise: OPEN_WEIGHTS,
  azure: ["gpt4o", "gpt4omini"],
  m365: ["gpt4o", "gpt4omini"],
  gcp: ["claude35", "gptOss120b", "deepseekV3"],
};

/** Which providers can serve a given model. */
export const MODEL_PROVIDER_COMPATIBILITY: Record<ModelId, string[]> = (() => {
  const out: Record<string, string[]> = {};
  for (const m of ALL_MODEL_IDS) out[m] = [];
  for (const [prov, ms] of Object.entries(PROVIDER_MODEL_COMPATIBILITY)) {
    for (const m of ms) out[m].push(prov);
  }
  return out as Record<ModelId, string[]>;
})();
