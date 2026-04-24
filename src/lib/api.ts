import type {
  FunnelStageData,
  GoalData,
  KPIData,
  Period,
  StageTimeData,
  StoreRankingRow,
  TrendPoint,
} from "./types";
import type { AppUser } from "./auth-types";
import type { SavedQuote } from "./pool-data";
import { authToken } from "./auth-token";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";
const TENANT   = import.meta.env.VITE_TENANT_SLUG ?? "igui";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = authToken.get();
  const headers: Record<string, string> = {
    "x-tenant-slug": TENANT,
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...(options?.body ? { "Content-Type": "application/json" } : {}),
  };
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? "Erro na API");
  }
  return res.json() as Promise<T>;
}

function buildParams(storeIds: string[], period: Period, salesperson?: string): string {
  const params = new URLSearchParams({ period });
  if (storeIds.length > 0) params.set("storeIds", storeIds.join(","));
  if (salesperson)         params.set("salesperson", salesperson);
  return params.toString();
}

export const api = {
  kpis(storeIds: string[], period: Period, salesperson?: string): Promise<KPIData> {
    return apiFetch(`/api/dashboard/kpis?${buildParams(storeIds, period, salesperson)}`);
  },

  funnel(storeIds: string[], period: Period, salesperson?: string): Promise<FunnelStageData[]> {
    return apiFetch(`/api/dashboard/funnel?${buildParams(storeIds, period, salesperson)}`);
  },

  trend(storeIds: string[], period: Period, salesperson?: string): Promise<TrendPoint[]> {
    return apiFetch(`/api/dashboard/trend?${buildParams(storeIds, period, salesperson)}`);
  },

  ranking(storeIds: string[], period: Period): Promise<StoreRankingRow[]> {
    return apiFetch(`/api/dashboard/ranking?${buildParams(storeIds, period)}`);
  },

  stores(): Promise<{ id: string; name: string; city: string; state: string; externalId?: string; storeType?: string }[]> {
    return apiFetch("/api/dashboard/stores");
  },

  stageTime(storeIds: string[], period: Period, salesperson?: string): Promise<StageTimeData[]> {
    return apiFetch(`/api/dashboard/stage-time?${buildParams(storeIds, period, salesperson)}`);
  },

  goal(storeId: string, salesperson: string): Promise<GoalData> {
    const params = new URLSearchParams({ salesperson });
    if (storeId) params.set("storeId", storeId);
    return apiFetch(`/api/dashboard/goal?${params}`);
  },

  login(email: string, password: string): Promise<{ user: AppUser; token: string }> {
    return apiFetch("/api/auth/login", {
      method: "POST",
      body:   JSON.stringify({ email, password }),
    });
  },

  listUsers(): Promise<AppUser[]> {
    return apiFetch("/api/auth/users");
  },

  createUser(data: { name: string; email: string; password: string; role: string; storeIds: string[]; salesGoal?: number; crmUserId?: string }): Promise<{ user: AppUser }> {
    return apiFetch("/api/auth/users", {
      method: "POST",
      body:   JSON.stringify(data),
    });
  },

  updateUser(id: string, data: { name?: string; email?: string; password?: string; role?: string; storeIds?: string[]; salesGoal?: number; crmUserId?: string }): Promise<{ user: AppUser }> {
    return apiFetch(`/api/auth/users/${id}`, {
      method: "PUT",
      body:   JSON.stringify(data),
    });
  },

  deleteUser(id: string): Promise<{ ok: boolean }> {
    return apiFetch(`/api/auth/users/${id}`, { method: "DELETE" });
  },

  createStore(data: { name: string; city?: string; state?: string; externalId?: string; storeType?: string }): Promise<{ id: string; name: string; city: string; state: string; externalId?: string; storeType: string; createdAt: string; active: boolean }> {
    return apiFetch("/api/stores", {
      method: "POST",
      body:   JSON.stringify(data),
    });
  },

  updateStore(id: string, data: { name?: string; city?: string; state?: string; externalId?: string; storeType?: string }): Promise<{ id: string; name: string; city: string; state: string; externalId?: string; storeType: string; createdAt: string; active: boolean }> {
    return apiFetch(`/api/stores/${id}`, {
      method: "PUT",
      body:   JSON.stringify(data),
    });
  },

  deleteStore(id: string): Promise<{ ok: boolean }> {
    return apiFetch(`/api/stores/${id}`, { method: "DELETE" });
  },

  // ── Orçamentos ───────────────────────────────────────────────────────────────

  listQuotes(): Promise<SavedQuote[]> {
    return apiFetch("/api/quotes");
  },

  createQuote(data: Omit<SavedQuote, "id" | "date">): Promise<SavedQuote> {
    return apiFetch("/api/quotes", {
      method: "POST",
      body:   JSON.stringify(data),
    });
  },

  updateQuote(id: string, data: Partial<Omit<SavedQuote, "id" | "wonAt">>): Promise<SavedQuote> {
    return apiFetch(`/api/quotes/${id}`, {
      method: "PUT",
      body:   JSON.stringify(data),
    });
  },

  markQuoteWon(id: string): Promise<SavedQuote> {
    return apiFetch(`/api/quotes/${id}/won`, { method: "PATCH" });
  },

  markQuoteLost(id: string): Promise<SavedQuote> {
    return apiFetch(`/api/quotes/${id}/lost`, { method: "PATCH" });
  },
};
