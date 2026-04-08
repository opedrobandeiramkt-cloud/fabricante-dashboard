import { createHash, scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const hashBuffer = Buffer.from(hash, "hex");
  const derivedHash = (await scryptAsync(password, salt, 64)) as Buffer;
  return timingSafeEqual(hashBuffer, derivedHash);
}

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
