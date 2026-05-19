interface AdContext {
  adName: string;
  adsetId: string;
  adsetName: string;
  campaignId: string;
  campaignName: string;
}

interface CacheEntry {
  data: AdContext;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const TTL_MS = 60 * 60 * 1000; // 1 hora

export async function resolveAdContext(
  adId: string,
  accessToken: string
): Promise<AdContext | null> {
  const cacheKey = `${adId}:${accessToken.slice(-8)}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  try {
    const fields = "name,adset_id,adset{name},campaign_id,campaign{name}";
    const url = `https://graph.facebook.com/v21.0/${adId}?fields=${fields}&access_token=${accessToken}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = (await res.json()) as Record<string, unknown>;

    const data: AdContext = {
      adName: (json.name as string) ?? "",
      adsetId: (json.adset_id as string) ?? "",
      adsetName: ((json.adset as Record<string, string>)?.name) ?? "",
      campaignId: (json.campaign_id as string) ?? "",
      campaignName: ((json.campaign as Record<string, string>)?.name) ?? "",
    };

    cache.set(cacheKey, { data, expiresAt: Date.now() + TTL_MS });
    return data;
  } catch {
    return null;
  }
}
