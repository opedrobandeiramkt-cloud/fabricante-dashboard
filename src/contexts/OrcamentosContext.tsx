import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { api } from "@/lib/api";
import { loadQuotes } from "@/lib/pool-data";
import type { SavedQuote } from "@/lib/pool-data";
import type { Period } from "@/lib/types";

const USE_API = import.meta.env.VITE_USE_API === "true";

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
  quotes:              SavedQuote[];
  loading:             boolean;
  addQuote:            (quote: Omit<SavedQuote, "id" | "date">) => Promise<void>;
  updateQuote:         (id: string, updates: Partial<Omit<SavedQuote, "id" | "wonAt">>) => Promise<void>;
  markAsWon:           (id: string) => Promise<void>;
  markAsLost:          (id: string) => Promise<void>;
  wonRevenueForPeriod: (params: FilterParams) => number;
  wonCountForPeriod:   (params: FilterParams) => number;
}

const OrcamentosContext = createContext<OrcamentosContextValue | null>(null);

export function OrcamentosProvider({ children }: { children: ReactNode }) {
  const [quotes,  setQuotes]  = useState<SavedQuote[]>([]);
  const [loading, setLoading] = useState(false);

  const loadFromApi = useCallback(async () => {
    if (!USE_API) {
      setQuotes(loadQuotes());
      return;
    }
    setLoading(true);
    try {
      const remote = await api.listQuotes();
      setQuotes(remote);

      // Migração única: envia orçamentos do localStorage para a API e limpa a chave
      const local = loadQuotes();
      if (local.length > 0) {
        await Promise.allSettled(
          local.map((q) =>
            api.createQuote({
              clientName:    q.clientName,
              proposalValue: q.proposalValue,
              status:        q.status,
              formData:      q.formData,
              vendedorId:    q.vendedorId,
              vendedorName:  q.vendedorName,
              storeId:       q.storeId,
            })
          )
        );
        localStorage.removeItem("igui-quotes");
        const updated = await api.listQuotes();
        setQuotes(updated);
      }
    } catch {
      setQuotes(loadQuotes());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFromApi();
  }, [loadFromApi]);

  async function addQuote(quote: Omit<SavedQuote, "id" | "date">): Promise<void> {
    if (!USE_API) {
      const { quotesStore } = await import("@/lib/quotes-store");
      quotesStore.add(quote);
      setQuotes(loadQuotes());
      return;
    }
    try {
      const created = await api.createQuote(quote);
      setQuotes((prev) => [created, ...prev]);
    } catch (err) {
      console.error("Erro ao criar orçamento:", err);
    }
  }

  async function updateQuote(id: string, updates: Partial<Omit<SavedQuote, "id" | "wonAt">>): Promise<void> {
    if (!USE_API) {
      const { quotesStore } = await import("@/lib/quotes-store");
      quotesStore.update(id, updates);
      setQuotes(loadQuotes());
      return;
    }
    setQuotes((prev) => prev.map((q) => q.id === id && q.status !== "ganho" ? { ...q, ...updates } : q));
    try {
      const updated = await api.updateQuote(id, updates);
      setQuotes((prev) => prev.map((q) => q.id === id ? updated : q));
    } catch (err) {
      console.error("Erro ao atualizar orçamento:", err);
    }
  }

  async function markAsWon(id: string): Promise<void> {
    if (!USE_API) {
      const { quotesStore } = await import("@/lib/quotes-store");
      quotesStore.markAsWon(id);
      setQuotes(loadQuotes());
      return;
    }
    setQuotes((prev) => prev.map((q) => q.id === id ? { ...q, status: "ganho" as const, wonAt: new Date().toISOString() } : q));
    try {
      const updated = await api.markQuoteWon(id);
      setQuotes((prev) => prev.map((q) => q.id === id ? updated : q));
    } catch (err) {
      console.error("Erro ao marcar como ganho:", err);
    }
  }

  async function markAsLost(id: string): Promise<void> {
    if (!USE_API) {
      const { quotesStore } = await import("@/lib/quotes-store");
      quotesStore.markAsLost(id);
      setQuotes(loadQuotes());
      return;
    }
    setQuotes((prev) => prev.map((q) => q.id === id && q.status !== "ganho" ? { ...q, status: "perdido" as const } : q));
    try {
      const updated = await api.markQuoteLost(id);
      setQuotes((prev) => prev.map((q) => q.id === id ? updated : q));
    } catch (err) {
      console.error("Erro ao marcar como perdido:", err);
    }
  }

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

  return (
    <OrcamentosContext.Provider
      value={{
        quotes,
        loading,
        addQuote,
        updateQuote,
        markAsWon,
        markAsLost,
        wonRevenueForPeriod: (p) => filterWon(p).reduce((sum, q) => sum + q.proposalValue, 0),
        wonCountForPeriod:   (p) => filterWon(p).length,
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
