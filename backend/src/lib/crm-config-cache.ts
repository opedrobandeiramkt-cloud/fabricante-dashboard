const TTL_MS = 5 * 60 * 1000; // 5 minutos

export interface CrmConfigCacheEntry {
  panelId:       string;
  stageMap:      unknown;
  stagePriority: unknown;
  version:       number;
  expiresAt:     number;
}

const cache = new Map<string, CrmConfigCacheEntry>();

export function cacheGet(storeExternalId: string): CrmConfigCacheEntry | null {
  const entry = cache.get(storeExternalId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(storeExternalId);
    return null;
  }
  return entry;
}

export function cacheSet(
  storeExternalId: string,
  data: Omit<CrmConfigCacheEntry, "expiresAt">,
): void {
  cache.set(storeExternalId, { ...data, expiresAt: Date.now() + TTL_MS });
}

export function cacheInvalidate(storeExternalId: string): void {
  cache.delete(storeExternalId);
}
