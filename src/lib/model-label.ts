import { MODEL_BY_ID, type ModelId } from "./models";

export type EnergyGrade = "A" | "B" | "C" | "D" | "E" | "F";

export interface GradeMeta {
  grade: EnergyGrade;
  color: string;
  /** upper bound, kWh per 1k tokens */
  max: number;
  description: string;
}

/**
 * Thresholds from the GenAI-Sustainability Rating draft (Joule/token).
 * 1 J/token = 1000 J per 1k tokens = 1000 / 3.6e6 kWh per 1k tokens
 *           ≈ 2.78e-4 kWh per 1k tokens.
 *
 * Screenshot mapping (Energy/Token):
 *  A: < 0.001 J/token
 *  B: < 0.01  J/token
 *  C: < 0.1   J/token
 *  D: < 1     J/token
 *  E: < 2     J/token
 *  F: ≥ 2     J/token  OR  no data from supplier
 */
export const GRADE_TIERS: GradeMeta[] = [
  { grade: "A", max: 2.78e-7, color: "#15803d", description: "< 0.001 J / token" },
  { grade: "B", max: 2.78e-6, color: "#65a30d", description: "< 0.01 J / token" },
  { grade: "C", max: 2.78e-5, color: "#eab308", description: "< 0.1 J / token" },
  { grade: "D", max: 2.78e-4, color: "#f59e0b", description: "< 1 J / token" },
  { grade: "E", max: 5.56e-4, color: "#ea580c", description: "< 2 J / token" },
  { grade: "F", max: Infinity, color: "#dc2626", description: "≥ 2 J / token or unverified" },
];

const F_TIER = GRADE_TIERS[GRADE_TIERS.length - 1];

export function getModelEnergyLabel(modelId: ModelId): GradeMeta {
  const meta = MODEL_BY_ID[modelId];
  if (!meta?.verified) return F_TIER;
  return GRADE_TIERS.find((t) => meta.co2PerKToken <= t.max) ?? F_TIER;
}
