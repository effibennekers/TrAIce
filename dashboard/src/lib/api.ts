import type { ModelId } from "./models";
import type {
  DataCenterId,
  DashboardData,
  DepartmentId,
  ProviderId,
  TimePreset,
} from "./mock-data";

export interface DashboardQuery {
  preset: TimePreset;
  customStart?: Date;
  customEnd?: Date;
  models: ModelId[];
  provider: ProviderId;
  dataCenter: DataCenterId;
  department: DepartmentId;
  simulationMultiplier?: number;
}

const API_BASE_URL = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || "/api"
).replace(/\/+$/, "");

function buildUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export async function fetchDashboardData(
  query: DashboardQuery,
  signal?: AbortSignal,
): Promise<DashboardData> {
  const params = new URLSearchParams({
    preset: query.preset,
    models: query.models.join(","),
    provider: query.provider,
    data_center: query.dataCenter,
    department: query.department,
    simulation_multiplier: String(query.simulationMultiplier ?? 1),
  });

  if (query.customStart) params.set("custom_start", query.customStart.toISOString());
  if (query.customEnd) params.set("custom_end", query.customEnd.toISOString());

  const res = await fetch(buildUrl(`/v1/dashboard?${params.toString()}`), {
    method: "GET",
    signal,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API request failed with status ${res.status}`);
  }

  return (await res.json()) as DashboardData;
}
