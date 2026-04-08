import type {
  FunnelStageData,
  KPIData,
  Period,
  StageTimeData,
  StoreRankingRow,
  TrendPoint,
} from "./types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";
const TENANT   = import.meta.env.VITE_TENANT_SLUG ?? "igui";

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "x-tenant-slug": TENANT },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? "Erro na API");
  }
  return res.json() as Promise<T>;
}

function buildParams(storeIds: string[], period: Period): string {
  const params = new URLSearchParams({ period });
  if (storeIds.length > 0) params.set("storeIds", storeIds.join(","));
  return params.toString();
}

export const api = {
  kpis(storeIds: string[], period: Period): Promise<KPIData> {
    return apiFetch(`/api/dashboard/kpis?${buildParams(storeIds, period)}`);
  },

  funnel(storeIds: string[], period: Period): Promise<FunnelStageData[]> {
    return apiFetch(`/api/dashboard/funnel?${buildParams(storeIds, period)}`);
  },

  trend(storeIds: string[], period: Period): Promise<TrendPoint[]> {
    return apiFetch(`/api/dashboard/trend?${buildParams(storeIds, period)}`);
  },

  ranking(storeIds: string[], period: Period): Promise<StoreRankingRow[]> {
    return apiFetch(`/api/dashboard/ranking?${buildParams(storeIds, period)}`);
  },

  stores(): Promise<{ id: string; name: string; city: string; state: string }[]> {
    return apiFetch("/api/dashboard/stores");
  },

  stageTime(storeIds: string[], period: Period): Promise<StageTimeData[]> {
    return apiFetch(`/api/dashboard/stage-time?${buildParams(storeIds, period)}`);
  },
};
