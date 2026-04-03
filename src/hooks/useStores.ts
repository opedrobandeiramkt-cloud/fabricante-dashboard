import { useState } from "react";
import { STORES } from "@/lib/constants";
import type { Store } from "@/lib/types";

const STORAGE_KEY = "igui_stores";

function loadStores(): Store[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Store[];
  } catch {
    // ignore
  }
  return STORES;
}

function saveStores(stores: Store[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stores));
}

function generateId() {
  return `loja-${Date.now()}`;
}

export function useStores() {
  const [stores, setStores] = useState<Store[]>(loadStores);

  function persist(updated: Store[]) {
    setStores(updated);
    saveStores(updated);
  }

  function addStore(data: Omit<Store, "id" | "createdAt">) {
    const newStore: Store = {
      ...data,
      id:        generateId(),
      createdAt: new Date().toISOString(),
    };
    persist([...stores, newStore]);
    return newStore;
  }

  function updateStore(id: string, data: Partial<Omit<Store, "id" | "createdAt">>) {
    persist(stores.map((s) => (s.id === id ? { ...s, ...data } : s)));
  }

  function deleteStore(id: string) {
    persist(stores.filter((s) => s.id !== id));
  }

  function toggleActive(id: string) {
    persist(stores.map((s) => (s.id === id ? { ...s, active: !s.active } : s)));
  }

  return { stores, addStore, updateStore, deleteStore, toggleActive };
}
