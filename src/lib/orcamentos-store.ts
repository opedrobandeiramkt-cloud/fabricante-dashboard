import { useSyncExternalStore } from "react";
import type { Orcamento, OrcamentoStatus } from "./types";

const KEY = "igui-orcamentos-v1";

interface State {
  orcamentos: Orcamento[];
  nextNum: number;
}

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);

const initialState = (): State => ({ orcamentos: [], nextNum: 1 });

let state: State = load();
const listeners = new Set<() => void>();

function load(): State {
  if (typeof window === "undefined") return initialState();
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as State) : initialState();
  } catch {
    return initialState();
  }
}

function persist() {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  }
  listeners.forEach((l) => l());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useOrcamentosStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(state),
  );
}

export const orcamentosStore = {
  get: () => state,

  add(
    o: Omit<Orcamento, "id" | "numero" | "createdAt" | "updatedAt" | "wonAt">,
  ): Orcamento {
    const num = state.nextNum;
    const now = new Date().toISOString();
    const orcamento: Orcamento = {
      ...o,
      id: uid(),
      numero: `ORC-${String(num).padStart(4, "0")}`,
      createdAt: now,
      updatedAt: now,
    };
    state = {
      orcamentos: [...state.orcamentos, orcamento],
      nextNum: num + 1,
    };
    persist();
    return orcamento;
  },

  update(
    id: string,
    changes: Partial<
      Omit<Orcamento, "id" | "numero" | "createdAt" | "vendedorId" | "vendedorName" | "wonAt">
    >,
  ) {
    state = {
      ...state,
      orcamentos: state.orcamentos.map((o) => {
        if (o.id !== id || o.status === "ganho") return o;
        const updated: Orcamento = {
          ...o,
          ...changes,
          updatedAt: new Date().toISOString(),
        };
        if (changes.status === "ganho") {
          updated.wonAt = new Date().toISOString();
        }
        return updated;
      }),
    };
    persist();
  },

  markAsWon(id: string) {
    const now = new Date().toISOString();
    state = {
      ...state,
      orcamentos: state.orcamentos.map((o) => {
        if (o.id !== id || o.status === "ganho") return o;
        return { ...o, status: "ganho" as OrcamentoStatus, wonAt: now, updatedAt: now };
      }),
    };
    persist();
  },
};
