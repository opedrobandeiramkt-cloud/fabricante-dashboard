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

const POLL_INTERVAL_MS = 30_000; // 30 segundos

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
      setData(getMockData(filters));
      return;
    }

    const { storeIds, period } = filters;

    async function fetchAll(isPolling = false) {
      if (!isPolling) setLoading(true);
      setError(null);

      const [kpis, funnel, trend, ranking, stageTimes] = await Promise.allSettled([
        api.kpis(storeIds, period),
        api.funnel(storeIds, period),
        api.trend(storeIds, period),
        api.ranking(storeIds, period),
        api.stageTime(storeIds, period),
      ]);

      if (!mountedRef.current) return;
      setData({
        kpis:       kpis.status       === "fulfilled" ? kpis.value       : { totalLeads: 0, totalLeadsDelta: 0, totalConversion: 0, totalConversionDelta: 0, wonDeals: 0, wonDealsDelta: 0, avgCycleDays: 0, avgCycleDelta: 0, totalRevenue: 0, totalRevenueDelta: 0, avgTicket: 0, avgTicketDelta: 0, avgFirstResponseMinutes: 0, avgFirstResponseDelta: 0 },
        funnel:     funnel.status     === "fulfilled" ? funnel.value     : [],
        trend:      trend.status      === "fulfilled" ? trend.value      : [],
        ranking:    ranking.status    === "fulfilled" ? ranking.value    : [],
        stageTimes: stageTimes.status === "fulfilled" ? stageTimes.value : [],
      });
      if (!isPolling && mountedRef.current) setLoading(false);
    }

    fetchAll(false);

    const intervalId = setInterval(() => {
      if (mountedRef.current) fetchAll(true);
    }, POLL_INTERVAL_MS);

    return () => { clearInterval(intervalId); };
  }, [filters]);

  return { ...data, loading, error };
}
