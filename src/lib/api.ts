import type {
  FunnelStageData,
  KPIData,
  Period,
  StageTimeData,
  StoreRankingRow,
  TrendPoint,
} from "./types";
import type { AppUser } from "./auth-types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";
const TENANT   = import.meta.env.VITE_TENANT_SLUG ?? "igui";

async function apiFetch<T>(path: string, options?: RequestInit & { userId?: string }): Promise<T> {
  const headers: Record<string, string> = {
    "x-tenant-slug": TENANT,
    ...(options?.userId ? { "x-user-id": options.userId } : {}),
    ...(options?.body ? { "Content-Type": "application/json" } : {}),
  };
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
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

  login(email: string, password: string): Promise<{ user: AppUser }> {
    return apiFetch("/api/auth/login", {
      method: "POST",
      body:   JSON.stringify({ email, password }),
    });
  },

  listUsers(adminId: string): Promise<AppUser[]> {
    return apiFetch("/api/auth/users", { userId: adminId });
  },

  createUser(adminId: string, data: { name: string; email: string; password: string; role: string; storeIds: string[] }): Promise<{ user: AppUser }> {
    return apiFetch("/api/auth/users", {
      method: "POST",
      userId: adminId,
      body:   JSON.stringify(data),
    });
  },

  updateUser(adminId: string, id: string, data: { name?: string; email?: string; password?: string; role?: string; storeIds?: string[] }): Promise<{ user: AppUser }> {
    return apiFetch(`/api/auth/users/${id}`, {
      method: "PUT",
      userId: adminId,
      body:   JSON.stringify(data),
    });
  },

  deleteUser(adminId: string, id: string): Promise<{ ok: boolean }> {
    return apiFetch(`/api/auth/users/${id}`, {
      method: "DELETE",
      userId: adminId,
    });
  },
};
