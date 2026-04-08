import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { STORES as DEFAULT_STORES } from "@/lib/constants";
import type { Store } from "@/lib/types";

const USE_API      = import.meta.env.VITE_USE_API === "true";
const BASE_URL     = import.meta.env.VITE_API_URL ?? "http://localhost:3333";
const STORAGE_KEY  = "igui_stores";
const DELETED_KEY  = "igui_deleted_stores"; // IDs permanentemente excluídos

function loadDeletedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch { /* ignore */ }
  return new Set();
}

function saveDeletedId(id: string) {
  const ids = loadDeletedIds();
  ids.add(id);
  localStorage.setItem(DELETED_KEY, JSON.stringify([...ids]));
}

function loadStores(): Store[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Store[];
  } catch { /* ignore */ }
  return DEFAULT_STORES;
}

function saveStores(stores: Store[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stores));
}

interface StoresContextValue {
  stores:       Store[];
  addStore:     (data: Omit<Store, "id" | "createdAt">) => Store;
  updateStore:  (id: string, data: Partial<Omit<Store, "id" | "createdAt">>) => void;
  deleteStore:  (id: string) => void;
  toggleActive: (id: string) => void;
}

const StoresContext = createContext<StoresContextValue | null>(null);

export function StoresProvider({ children }: { children: ReactNode }) {
  const [stores, setStores] = useState<Store[]>(loadStores);

  // Quando usa API real, sempre sincroniza com o banco para garantir IDs corretos.
  // Preserva o status `active` e customizações locais de nome/cidade.
  useEffect(() => {
    if (!USE_API) return;
    fetch(`${BASE_URL}/api/dashboard/stores`, {
      headers: { "x-tenant-slug": "igui" },
    })
      .then((r) => r.json())
      .then((data: { id: string; name: string; city: string; state: string; externalId?: string }[]) => {
        const localMap   = new Map(loadStores().map((s) => [s.id, s]));
        const deletedIds = loadDeletedIds();
        const apiStores: Store[] = data
          .filter((s) => !deletedIds.has(s.id))
          .map((s) => {
            const local = localMap.get(s.id);
            return {
              id:         s.id,
              name:       local?.name       ?? s.name,
              city:       local?.city       ?? s.city,
              state:      local?.state      ?? s.state,
              externalId: s.externalId,
              active:     local?.active     ?? true,
              createdAt:  local?.createdAt  ?? new Date().toISOString(),
            };
          });
        setStores(apiStores);
        saveStores(apiStores);
      })
      .catch(() => { /* mantém lojas do localStorage */ });
  }, []);

  function persist(updated: Store[]) {
    setStores(updated);
    saveStores(updated);
  }

  function addStore(data: Omit<Store, "id" | "createdAt">): Store {
    const newStore: Store = {
      ...data,
      id:        `loja-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    persist([...stores, newStore]);
    return newStore;
  }

  function updateStore(id: string, data: Partial<Omit<Store, "id" | "createdAt">>) {
    persist(stores.map((s) => (s.id === id ? { ...s, ...data } : s)));
  }

  function deleteStore(id: string) {
    saveDeletedId(id);
    persist(stores.filter((s) => s.id !== id));
  }

  function toggleActive(id: string) {
    persist(stores.map((s) => (s.id === id ? { ...s, active: !s.active } : s)));
  }

  return (
    <StoresContext.Provider value={{ stores, addStore, updateStore, deleteStore, toggleActive }}>
      {children}
    </StoresContext.Provider>
  );
}

export function useStores() {
  const ctx = useContext(StoresContext);
  if (!ctx) throw new Error("useStores must be used within StoresProvider");
  return ctx;
}
