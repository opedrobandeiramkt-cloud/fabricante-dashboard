import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import type { DashboardFilters, LeadOrigem, LeadRow } from "@/lib/types";

const USE_API = import.meta.env.VITE_USE_API === "true";

export function useLeads(filters: DashboardFilters) {
  const [leads,      setLeads]      = useState<LeadRow[]>([]);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page,       setPage]       = useState(1);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => { setPage(1); }, [filters.storeIds.join(","), filters.period]);

  useEffect(() => {
    if (!USE_API) { setLeads([]); return; }

    setLoading(true);
    setError(null);

    api.leads(filters.storeIds, filters.period, page)
      .then((res) => {
        if (!mountedRef.current) return;
        setLeads(res.data);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      })
      .catch((e) => {
        if (!mountedRef.current) return;
        setError(e instanceof Error ? e.message : "Erro ao carregar leads");
      })
      .finally(() => { if (mountedRef.current) setLoading(false); });
  }, [filters.storeIds.join(","), filters.period, page]);

  const updateLead = useCallback((id: string, origemManual: LeadOrigem | null) => {
    setLeads((prev) => prev.map((l) => {
      if (l.id !== id) return l;
      return { ...l, origemManual, origem: origemManual ?? l.origem };
    }));
  }, []);

  return { leads, total, totalPages, page, setPage, loading, error, updateLead };
}
