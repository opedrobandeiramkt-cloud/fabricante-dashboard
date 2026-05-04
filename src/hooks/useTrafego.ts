import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type {
  DashboardFilters,
  TrafegoOverview,
  TrafegoDetalhamento,
  TrafegoHistorico,
  TrafegoTab,
} from "@/lib/types";
import {
  getMockTrafegoOverview,
  getMockTrafegoDetalhamento,
  getMockTrafegoHistorico,
} from "@/lib/mock-ads";

const USE_API = import.meta.env.VITE_USE_API === "true";

interface UseTrafegoResult {
  overview: TrafegoOverview | null;
  detalhamento: TrafegoDetalhamento | null;
  historico: TrafegoHistorico | null;
  loading: boolean;
  error: string | null;
}

export function useTrafego(filters: DashboardFilters, tab: TrafegoTab): UseTrafegoResult {
  const [overview, setOverview]           = useState<TrafegoOverview | null>(null);
  const [detalhamento, setDetalhamento]   = useState<TrafegoDetalhamento | null>(null);
  const [historico, setHistorico]         = useState<TrafegoHistorico | null>(null);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  const storeKey = filters.storeIds.join(",");

  useEffect(() => {
    if (tab === "leads") return;

    setLoading(true);
    setError(null);

    if (!USE_API) {
      const timer = setTimeout(() => {
        if (tab === "visao-geral")  setOverview(getMockTrafegoOverview(filters));
        if (tab === "detalhamento") setDetalhamento(getMockTrafegoDetalhamento(filters));
        if (tab === "historico")    setHistorico(getMockTrafegoHistorico());
        setLoading(false);
      }, 400);
      return () => clearTimeout(timer);
    }

    const year = new Date().getFullYear();
    let promise: Promise<void>;

    if (tab === "visao-geral") {
      promise = api.trafegoOverview(filters.storeIds, filters.period).then(setOverview);
    } else if (tab === "detalhamento") {
      promise = api.trafegoDetalhamento(filters.storeIds, filters.period).then(setDetalhamento);
    } else if (tab === "historico") {
      promise = api.trafegoHistorico(filters.storeIds, year).then(setHistorico);
    } else {
      promise = Promise.resolve();
    }

    promise
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Erro ao carregar dados")
      )
      .finally(() => setLoading(false));
  }, [tab, storeKey, filters.period]);

  return { overview, detalhamento, historico, loading, error };
}
