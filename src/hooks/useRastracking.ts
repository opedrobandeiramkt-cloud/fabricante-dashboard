import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { DashboardFilters, RastrackingOverview } from "@/lib/types";
import { getMockRastracking } from "@/lib/mock-ads";

const USE_API = import.meta.env.VITE_USE_API === "true";

interface UseRastrackingResult {
  data:    RastrackingOverview | null;
  loading: boolean;
  error:   string | null;
}

export function useRastracking(filters: DashboardFilters): UseRastrackingResult {
  const [data,    setData]    = useState<RastrackingOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const storeKey = filters.storeIds.join(",");

  useEffect(() => {
    setLoading(true);
    setError(null);

    if (!USE_API) {
      const timer = setTimeout(() => {
        setData(getMockRastracking(filters));
        setLoading(false);
      }, 350);
      return () => clearTimeout(timer);
    }

    api
      .rastracking(filters.storeIds, filters.period, filters.dateFrom, filters.dateTo)
      .then(setData)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Erro ao carregar rastracking")
      )
      .finally(() => setLoading(false));
  }, [storeKey, filters.period, filters.dateFrom, filters.dateTo]);

  return { data, loading, error };
}
