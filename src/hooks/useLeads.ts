import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import type { DashboardFilters, LeadRow } from "@/lib/types";

const USE_API = import.meta.env.VITE_USE_API === "true";
const POLL_INTERVAL_MS = 60_000;

export function useLeads(filters: DashboardFilters) {
  const [leads,   setLeads]   = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!USE_API) {
      setLeads([]);
      return;
    }

    async function fetchLeads(isPolling = false) {
      if (!isPolling) setLoading(true);
      setError(null);
      try {
        const data = await api.leads(filters.storeIds, filters.period);
        if (mountedRef.current) setLeads(data);
      } catch (e) {
        if (mountedRef.current) setError(e instanceof Error ? e.message : "Erro ao carregar leads");
      } finally {
        if (!isPolling && mountedRef.current) setLoading(false);
      }
    }

    fetchLeads(false);
    const id = setInterval(() => { if (mountedRef.current) fetchLeads(true); }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [filters.storeIds.join(","), filters.period]);

  return { leads, loading, error };
}
