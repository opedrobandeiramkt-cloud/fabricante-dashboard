import { useSyncExternalStore } from "react";
import { loadQuotes, saveQuotes, type SavedQuote } from "@/lib/pool-data";

type Listener = () => void;

function createStore() {
  let quotes: SavedQuote[] = loadQuotes();
  const listeners = new Set<Listener>();

  function notify() {
    listeners.forEach((l) => l());
  }

  return {
    subscribe(l: Listener) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    getSnapshot(): SavedQuote[] {
      return quotes;
    },
    add(quote: Omit<SavedQuote, "id" | "date">) {
      const entry: SavedQuote = {
        ...quote,
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
      };
      quotes = [entry, ...quotes];
      saveQuotes(quotes);
      notify();
    },
    update(id: string, updates: Partial<Omit<SavedQuote, "id" | "wonAt">>) {
      quotes = quotes.map((q) =>
        q.id === id && q.status !== "ganho" ? { ...q, ...updates } : q
      );
      saveQuotes(quotes);
      notify();
    },
    markAsWon(id: string) {
      quotes = quotes.map((q) =>
        q.id === id
          ? { ...q, status: "ganho" as const, wonAt: new Date().toISOString() }
          : q
      );
      saveQuotes(quotes);
      notify();
    },
    markAsLost(id: string) {
      quotes = quotes.map((q) =>
        q.id === id && q.status !== "ganho" ? { ...q, status: "perdido" as const } : q
      );
      saveQuotes(quotes);
      notify();
    },
  };
}

export const quotesStore = createStore();

export function useQuotesStore(): SavedQuote[] {
  return useSyncExternalStore(
    quotesStore.subscribe,
    quotesStore.getSnapshot,
    quotesStore.getSnapshot
  );
}
