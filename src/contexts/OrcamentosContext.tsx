import { createContext, useContext, type ReactNode } from "react";
import { useQuotesStore, quotesStore } from "@/lib/quotes-store";
import type { SavedQuote } from "@/lib/pool-data";
import type { Period } from "@/lib/types";

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
  quotes: SavedQuote[];
  addQuote: typeof quotesStore.add;
  updateQuote: typeof quotesStore.update;
  markAsWon: typeof quotesStore.markAsWon;
  markAsLost: typeof quotesStore.markAsLost;
  wonRevenueForPeriod: (params: FilterParams) => number;
  wonCountForPeriod: (params: FilterParams) => number;
}

const OrcamentosContext = createContext<OrcamentosContextValue | null>(null);

export function OrcamentosProvider({ children }: { children: ReactNode }) {
  const quotes = useQuotesStore();

  function filterWon({ storeIds, period, vendedorId }: FilterParams): SavedQuote[] {
    const start = periodStart(period);
    return quotes.filter((q) => {
      if (q.status !== "ganho" || !q.wonAt) return false;
      if (new Date(q.wonAt) < start) return false;
      if (storeIds.length > 0 && !storeIds.includes(q.storeId)) return false;
      if (vendedorId && q.vendedorId !== vendedorId) return false;
      return true;
    });
  }

  function wonRevenueForPeriod(params: FilterParams): number {
    return filterWon(params).reduce((sum, q) => sum + q.proposalValue, 0);
  }

  function wonCountForPeriod(params: FilterParams): number {
    return filterWon(params).length;
  }

  return (
    <OrcamentosContext.Provider
      value={{
        quotes,
        addQuote: quotesStore.add,
        updateQuote: quotesStore.update,
        markAsWon: quotesStore.markAsWon,
        markAsLost: quotesStore.markAsLost,
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
