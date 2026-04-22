import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { STORES as DEFAULT_STORES } from "@/lib/constants";
import type { Store } from "@/lib/types";
import { api } from "@/lib/api";

const USE_API      = import.meta.env.VITE_USE_API === "true";
const BASE_URL     = import.meta.env.VITE_API_URL ?? "http://localhost:3333";
const TENANT       = import.meta.env.VITE_TENANT_SLUG ?? "igui";
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
  addStore:     (data: Omit<Store, "id" | "createdAt">, adminId?: string) => Promise<Store>;
  updateStore:  (id: string, data: Partial<Omit<Store, "id" | "createdAt">>, adminId?: string) => Promise<void>;
  deleteStore:  (id: string, adminId?: string) => Promise<void>;
  toggleActive: (id: string) => void;
}

const StoresContext = createContext<StoresContextValue | null>(null);

export function StoresProvider({ children }: { children: ReactNode }) {
  const [stores, setStores] = useState<Store[]>(loadStores);

  // Quando usa API real, sincroniza com o banco preservando customizações locais.
  useEffect(() => {
    if (!USE_API) return;
    fetch(`${BASE_URL}/api/dashboard/stores`, {
      headers: { "x-tenant-slug": TENANT },
    })
      .then((r) => r.json())
      .then((data: { id: string; name: string; city: string; state: string; externalId?: string }[]) => {
        const localMap   = new Map(loadStores().map((s) => [s.id, s]));
        const deletedIds = loadDeletedIds();
        const apiIds     = new Set(data.map((s) => s.id));

        // Lojas vindas da API com customizações locais preservadas
        const apiStores: Store[] = data
          .filter((s) => !deletedIds.has(s.id))
          .map((s) => {
            const local = localMap.get(s.id);
            return {
              id:         s.id,
              name:       local?.name       ?? s.name,
              city:       local?.city       ?? s.city,
              state:      local?.state      ?? s.state,
              externalId: local?.externalId ?? s.externalId,
              phone:      local?.phone,      // campo apenas local (não existe no banco)
              email:      local?.email,      // campo apenas local (não existe no banco)
              active:     local?.active      ?? true,
              storeType:  local?.storeType   ?? "splash",
              createdAt:  local?.createdAt   ?? new Date().toISOString(),
            };
          });

        // Lojas criadas localmente que ainda não existem na API
        const localOnlyStores = loadStores().filter(
          (s) => !apiIds.has(s.id) && !deletedIds.has(s.id),
        );

        const allStores = [...apiStores, ...localOnlyStores];
        setStores(allStores);
        saveStores(allStores);
      })
      .catch(() => { /* mantém lojas do localStorage */ });
  }, []);

  function persist(updated: Store[]) {
    setStores(updated);
    saveStores(updated);
  }

  async function addStore(data: Omit<Store, "id" | "createdAt">, adminId?: string): Promise<Store> {
    if (USE_API && adminId) {
      try {
        const created = await api.createStore(adminId, {
          name:       data.name,
          city:       data.city,
          state:      data.state,
          externalId: data.externalId,
        });
        const newStore: Store = {
          ...data,
          id:        created.id,
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

  async function updateStore(id: string, data: Partial<Omit<Store, "id" | "createdAt">>, adminId?: string): Promise<void> {
    if (USE_API && adminId) {
      await api.updateStore(adminId, id, {
        name:       data.name,
        city:       data.city,
        state:      data.state,
        externalId: data.externalId,
      }).catch(() => { /* persiste localmente mesmo se API falhar */ });
    }
    persist(stores.map((s) => (s.id === id ? { ...s, ...data } : s)));
  }

  async function deleteStore(id: string, adminId?: string): Promise<void> {
    if (USE_API && adminId) {
      await api.deleteStore(adminId, id).catch(() => { /* continua com exclusão local */ });
    }
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
