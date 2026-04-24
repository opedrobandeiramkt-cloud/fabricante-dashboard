import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { STORES as DEFAULT_STORES } from "@/lib/constants";
import type { Store } from "@/lib/types";
import { api } from "@/lib/api";

const USE_API = import.meta.env.VITE_USE_API === "true";

const STORAGE_KEY = "igui_stores";

function loadStores(): Store[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const stores: Store[] = raw ? (JSON.parse(raw) as Store[]) : DEFAULT_STORES;

    // Migração: storeType era salvo em chave separada antes do commit 0836713.
    const oldRaw = localStorage.getItem("igui-store-types");
    if (oldRaw) {
      const oldTypes = JSON.parse(oldRaw) as Record<string, "splash" | "igui">;
      let migrated = false;
      const upgraded = stores.map((s) => {
        if (!s.storeType && oldTypes[s.id]) {
          migrated = true;
          return { ...s, storeType: oldTypes[s.id] };
        }
        return s;
      });
      if (migrated) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(upgraded));
        return upgraded;
      }
    }

    return stores;
  } catch { /* ignore */ }
  return DEFAULT_STORES;
}

function saveStores(stores: Store[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stores));
}

interface StoresContextValue {
  stores:       Store[];
  addStore:     (data: Omit<Store, "id" | "createdAt">, adminId?: string) => Promise<Store>;
  updateStore:  (id: string, data: Partial<Omit<Store, "id" | "createdAt">>, adminId?: string) => Promise<void>;
  deleteStore:  (id: string, adminId?: string) => Promise<void>;
  toggleActive: (id: string) => void;
}

const StoresContext = createContext<StoresContextValue | null>(null);

export function StoresProvider({ children }: { children: ReactNode }) {
  const [stores, setStores] = useState<Store[]>(loadStores);

  // Sincroniza com a API ao montar (após login o token já está disponível)
  useEffect(() => {
    if (!USE_API) return;
    api.stores()
      .then((data) => {
        const allStores: Store[] = data.map((s) => ({
          id:         s.id,
          name:       s.name,
          city:       s.city ?? "",
          state:      s.state ?? "",
          externalId: s.externalId,
          storeType:  (s.storeType as "splash" | "igui") ?? "splash",
          active:     true,
          createdAt:  new Date().toISOString(),
        }));
        setStores(allStores);
        saveStores(allStores);
      })
      .catch(() => { /* mantém lojas do localStorage se API falhar */ });
  }, []);

  function persist(updated: Store[]) {
    setStores(updated);
    saveStores(updated);
  }

  async function addStore(data: Omit<Store, "id" | "createdAt">, _adminId?: string): Promise<Store> {
    if (USE_API) {
      try {
        const created = await api.createStore({
          name:       data.name,
          city:       data.city,
          state:      data.state,
          externalId: data.externalId,
          storeType:  data.storeType,
        });
        const newStore: Store = {
          ...data,
          id:        created.id,
          storeType: (created.storeType as "splash" | "igui") ?? data.storeType ?? "splash",
          createdAt: new Date().toISOString(),
        };
        persist([...stores, newStore]);
        return newStore;
      } catch { /* fallback local */ }
    }
    const newStore: Store = {
      ...data,
      id:        `loja-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    persist([...stores, newStore]);
    return newStore;
  }

  async function updateStore(id: string, data: Partial<Omit<Store, "id" | "createdAt">>, _adminId?: string): Promise<void> {
    if (USE_API) {
      await api.updateStore(id, {
        name:       data.name,
        city:       data.city,
        state:      data.state,
        externalId: data.externalId,
        storeType:  data.storeType,
      }).catch(() => { /* persiste localmente mesmo se API falhar */ });
    }
    persist(stores.map((s) => (s.id === id ? { ...s, ...data } : s)));
  }

  async function deleteStore(id: string, _adminId?: string): Promise<void> {
    if (USE_API) {
      await api.deleteStore(id).catch(() => { /* continua com exclusão local */ });
    }
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
