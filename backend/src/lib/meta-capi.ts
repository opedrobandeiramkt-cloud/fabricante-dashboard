import { createHash, randomBytes } from "node:crypto";
import { prisma } from "./prisma.js";
import { decryptToken } from "./crypto-vault.js";

export function eventTimeNow(): bigint {
  return BigInt(Math.floor(Date.now() / 1000));
}

export function buildCapiEventId(parts: string[]): string {
  return createHash("sha256").update(parts.join("|")).digest("hex");
}

interface CapiUserData {
  ph?: string;     // SHA-256 do telefone E.164
  client_ip_address?: string;
  client_user_agent?: string;
  fbc?: string;    // _fbc cookie
  fbp?: string;    // _fbp cookie
}

interface SendLeadCapiParams {
  tenantId: string;
  storeId: string;
  leadId: string;
  pixelId: string;
  accessTokenEnc: string;
  accessTokenIv: string;
  accessTokenTag: string;
  eventTime: bigint;
  ctwaClid?: string;
  userData: CapiUserData;
  customData?: Record<string, unknown>;
}

interface SendPurchaseCapiParams extends SendLeadCapiParams {
  value: number;
  currency?: string;
}

async function sendCapiEvent(
  eventName: string,
  pixelId: string,
  accessToken: string,
  payload: Record<string, unknown>,
  tenantId: string,
  storeId: string,
  leadId: string | null,
  eventId: string,
  eventTime: bigint
): Promise<void> {
  const body = {
    data: [
      {
        event_name: eventName,
        event_time: Number(eventTime),
        event_id: eventId,
        action_source: "other",
        ...payload,
      },
    ],
  };

  let statusCode: number | null = null;
  let success = false;
  let errorMsg: string | null = null;

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    statusCode = res.status;
    success = res.ok;
    if (!res.ok) {
      const err = await res.text();
      errorMsg = err.slice(0, 500);
    }
  } catch (e: unknown) {
    errorMsg = e instanceof Error ? e.message : String(e);
  }

  await prisma.capiEvent.create({
    data: {
      tenantId,
      storeId,
      leadId: leadId ?? undefined,
      eventName,
      eventId,
      eventTime,
      payload: body as object,
      statusCode,
      success,
      errorMsg,
    },
  });
}

export async function sendLeadCapi(params: SendLeadCapiParams): Promise<void> {
  const accessToken = decryptToken({
    enc: params.accessTokenEnc,
    iv: params.accessTokenIv,
    tag: params.accessTokenTag,
  });

  const eventId = buildCapiEventId([
    "Lead",
    params.leadId,
    String(params.eventTime),
  ]);

  const userData: Record<string, unknown> = { ...params.userData };
  if (params.ctwaClid) userData.ctwa_clid = params.ctwaClid;

  await sendCapiEvent(
    "Lead",
    params.pixelId,
    accessToken,
    { user_data: userData, custom_data: params.customData ?? {} },
    params.tenantId,
    params.storeId,
    params.leadId,
    eventId,
    params.eventTime
  );
}

export async function sendPurchaseCapi(
  params: SendPurchaseCapiParams
): Promise<void> {
  const accessToken = decryptToken({
    enc: params.accessTokenEnc,
    iv: params.accessTokenIv,
    tag: params.accessTokenTag,
  });

  const eventId = buildCapiEventId([
    "Purchase",
    params.leadId,
    String(params.eventTime),
  ]);

  const userData: Record<string, unknown> = { ...params.userData };
  if (params.ctwaClid) userData.ctwa_clid = params.ctwaClid;

  await sendCapiEvent(
    "Purchase",
    params.pixelId,
    accessToken,
    {
      user_data: userData,
      custom_data: {
        value: params.value,
        currency: params.currency ?? "BRL",
        ...params.customData,
      },
    },
    params.tenantId,
    params.storeId,
    params.leadId,
    eventId,
    params.eventTime
  );
}
