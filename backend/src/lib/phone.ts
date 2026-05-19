import { createHash } from "node:crypto";

export function normalizeE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  // Sem DDI → assume Brasil (+55)
  if (!digits.startsWith("55") && digits.length <= 11) {
    return `+55${digits}`;
  }
  return `+${digits}`;
}

export function hashPhone(e164: string): string {
  return createHash("sha256").update(e164).digest("hex");
}
