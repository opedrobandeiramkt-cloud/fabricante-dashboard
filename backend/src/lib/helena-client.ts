const HELENA_BASE = "https://api.helena.run";
const TIMEOUT_MS  = 10_000;
const MAX_RETRIES = 3;

// ─── Tipos de resposta ────────────────────────────────────────────────────────

export interface HelenaCard {
  id:                string;
  responsibleUserId: string | null;
  monetaryAmount:    number | null;
  value:             number | null;
}

export interface HelenaContact {
  name:                 string | null;
  phoneNumberFormatted: string | null;
  phoneNumber:          string | null;
  utm: {
    source:   string | null;
    medium:   string | null;
    campaign: string | null;
    content:  string | null;
    headline: string | null;
  } | null;
}

export interface HelenaAgent {
  userId: string;
  name:   string | null;
  email:  string | null;
}

// ─── Fetch com timeout + retry em 5xx ────────────────────────────────────────

async function helenaFetch(
  path: string,
  token: string,
  options: RequestInit = {},
  attempt = 1,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${HELENA_BASE}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept:        "application/json",
        "Content-Type": "application/json",
        ...options.headers,
      },
      signal: controller.signal,
    });

    if (res.status >= 500 && attempt < MAX_RETRIES) {
      const delay = 2 ** attempt * 300; // 600ms, 1200ms
      await new Promise((r) => setTimeout(r, delay));
      return helenaFetch(path, token, options, attempt + 1);
    }

    return res;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Métodos públicos ─────────────────────────────────────────────────────────

export async function getCard(
  panelId: string,
  contactId: string,
  token: string,
): Promise<HelenaCard | null> {
  const qs = new URLSearchParams({
    PanelId:         panelId,
    ContactId:       contactId,
    IncludeArchived: "false",
    PageSize:        "1",
  });
  const res  = await helenaFetch(`/crm/v1/panel/card?${qs}`, token);
  const body = await res.json() as { items?: HelenaCard[] };
  return body.items?.[0] ?? null;
}

export async function getContact(
  contactId: string,
  token: string,
): Promise<HelenaContact | null> {
  const res = await helenaFetch(`/core/v1/contact/${contactId}`, token);
  if (!res.ok) return null;
  return res.json() as Promise<HelenaContact>;
}

export async function listAgents(token: string): Promise<HelenaAgent[]> {
  const res = await helenaFetch("/core/v1/agent", token);
  if (!res.ok) return [];
  const body = await res.json();
  return Array.isArray(body) ? (body as HelenaAgent[]) : [];
}

export async function moveCard(
  cardId: string,
  stepId: string,
  token: string,
): Promise<void> {
  await helenaFetch(`/crm/v1/panel/card/${cardId}`, token, {
    method: "PUT",
    body:   JSON.stringify({ fields: ["stepId"], stepId }),
  });
}
