import { createContext, useContext, type ReactNode } from "react";
import { useOrcamentosStore, orcamentosStore } from "@/lib/orcamentos-store";
import type { Orcamento, Period } from "@/lib/types";

function periodStart(period: Period): Date {
  const now = new Date();
  const start = new Date(now);
  if (period === "7d") start.setDate(now.getDate() - 7);
  else if (period === "30d") start.setDate(now.getDate() - 30);
  else if (period === "90d") start.setDate(now.getDate() - 90);
  else if (period === "12m") start.setFullYear(now.getFullYear() - 1);
  return start;
}

interface FilterParams {
  storeIds: string[];
  period: Period;
  vendedorId?: string;
}

interface OrcamentosContextValue {
  orcamentos: Orcamento[];
  addOrcamento: typeof orcamentosStore.add;
  updateOrcamento: typeof orcamentosStore.update;
  markAsWon: typeof orcamentosStore.markAsWon;
  wonRevenueForPeriod: (params: FilterParams) => number;
  wonCountForPeriod: (params: FilterParams) => number;
}

const OrcamentosContext = createContext<OrcamentosContextValue | null>(null);

export function OrcamentosProvider({ children }: { children: ReactNode }) {
  const orcamentos = useOrcamentosStore((s) => s.orcamentos);

  function filterWon(
    { storeIds, period, vendedorId }: FilterParams,
  ): Orcamento[] {
    const start = periodStart(period);
    return orcamentos.filter((o) => {
      if (o.status !== "ganho" || !o.wonAt) return false;
      if (new Date(o.wonAt) < start) return false;
      if (storeIds.length > 0 && !storeIds.includes(o.storeId)) return false;
      if (vendedorId && o.vendedorId !== vendedorId) return false;
      return true;
    });
  }

  function wonRevenueForPeriod(params: FilterParams): number {
    return filterWon(params).reduce((sum, o) => sum + o.totalValue, 0);
  }

  function wonCountForPeriod(params: FilterParams): number {
    return filterWon(params).length;
  }

  return (
    <OrcamentosContext.Provider
      value={{
        orcamentos,
        addOrcamento: orcamentosStore.add,
        updateOrcamento: orcamentosStore.update,
        markAsWon: orcamentosStore.markAsWon,
        wonRevenueForPeriod,
        wonCountForPeriod,
      }}
    >
      {children}
    </OrcamentosContext.Provider>
  );
}

export function useOrcamentos() {
  const ctx = useContext(OrcamentosContext);
  if (!ctx) throw new Error("useOrcamentos must be used within OrcamentosProvider");
  return ctx;
}
