import { createHash } from "crypto";

/**
 * Gera a chave de idempotência para um evento.
 * Garante que o mesmo evento nunca seja inserido duas vezes,
 * mesmo que o n8n reenvie ou o webhook seja chamado em duplicata.
 */
export function buildIdempotencyKey(params: {
  eventId: string;
  leadExternalId: string;
  toStage: string;
  occurredAt: string;
}): string {
  const raw = `${params.eventId}:${params.leadExternalId}:${params.toStage}:${params.occurredAt}`;
  return createHash("sha256").update(raw).digest("hex");
}
