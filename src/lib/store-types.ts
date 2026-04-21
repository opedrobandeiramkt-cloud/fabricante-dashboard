export type StoreType = "splash" | "igui";

const KEY = "igui-store-types";

function load(): Record<string, StoreType> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function getStoreType(storeId: string): StoreType {
  return load()[storeId] ?? "splash";
}

export function setStoreType(storeId: string, type: StoreType) {
  const map = load();
  map[storeId] = type;
  localStorage.setItem(KEY, JSON.stringify(map));
}
