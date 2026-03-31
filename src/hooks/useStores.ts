import { useState } from "react";
import { STORES } from "@/lib/constants";
import type { Store } from "@/lib/types";

function generateId() {
  return `loja-${Date.now()}`;
}

export function useStores() {
  const [stores, setStores] = useState<Store[]>(STORES);

  function addStore(data: Omit<Store, "id" | "createdAt">) {
    const newStore: Store = {
      ...data,
      id:        generateId(),
      createdAt: new Date().toISOString(),
    };
    setStores((prev) => [...prev, newStore]);
    return newStore;
  }

  function updateStore(id: string, data: Partial<Omit<Store, "id" | "createdAt">>) {
    setStores((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...data } : s))
    );
  }

  function deleteStore(id: string) {
    setStores((prev) => prev.filter((s) => s.id !== id));
  }

  function toggleActive(id: string) {
    setStores((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
  }

  return { stores, addStore, updateStore, deleteStore, toggleActive };
}
