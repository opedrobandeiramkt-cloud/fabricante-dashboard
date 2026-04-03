import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import {
  getFunnelData,
  getKPIs,
  getStageTimeData,
  getStoreRanking,
  getTrendData,
} from "@/lib/mock-data";
import type {
  DashboardFilters,
  FunnelStageData,
  KPIData,
  StageTimeData,
  StoreRankingRow,
  TrendPoint,
} from "@/lib/types";

// Define se usa API real ou mock (padrão: mock enquanto backend não estiver pronto)
const USE_API = import.meta.env.VITE_USE_API === "true";

interface DashboardData {
  kpis:        KPIData;
  funnel:      FunnelStageData[];
  trend:       TrendPoint[];
  ranking:     StoreRankingRow[];
  stageTimes:  StageTimeData[];
  loading:     boolean;
  error:       string | null;
}

function getMockData(filters: DashboardFilters): Omit<DashboardData, "loading" | "error"> {
  return {
    kpis:       getKPIs(filters),
    funnel:     getFunnelData(filters),
    trend:      getTrendData(filters),
    ranking:    getStoreRanking(filters),
    stageTimes: getStageTimeData(filters),
  };
}

export function useDashboard(filters: DashboardFilters): DashboardData {
  const [data, setData] = useState<Omit<DashboardData, "loading" | "error">>(
    () => getMockData(filters)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  // Evita atualizar estado após unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!USE_API) {
      // Modo mock: recalcula de forma síncrona
      setData(getMockData(filters));
      return;
    }

    // Modo API: busca dados reais do backend
    let cancelled = false;
    setLoading(true);
    setError(null);

    const { storeIds, period } = filters;

    Promise.allSettled([
      api.kpis(storeIds, period),
      api.funnel(storeIds, period),
      api.trend(storeIds, period),
      api.ranking(storeIds, period),
      api.stageTime(storeIds, period),
    ])
      .then(([kpis, funnel, trend, ranking, stageTimes]) => {
        if (cancelled || !mountedRef.current) return;
        setData({
          kpis:       kpis.status       === "fulfilled" ? kpis.value       : getMockData(filters).kpis,
          funnel:     funnel.status     === "fulfilled" ? funnel.value     : [],
          trend:      trend.status      === "fulfilled" ? trend.value      : [],
          ranking:    ranking.status    === "fulfilled" ? ranking.value    : [],
          stageTimes: stageTimes.status === "fulfilled" ? stageTimes.value : [],
        });
      })
      .finally(() => {
        if (!cancelled && mountedRef.current) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [filters]);

  return { ...data, loading, error };
}
