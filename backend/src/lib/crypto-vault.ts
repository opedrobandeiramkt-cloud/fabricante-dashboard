import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const hex = process.env.CRM_TOKEN_KEY;
  if (!hex) throw new Error("CRM_TOKEN_KEY não configurada");
  const key = Buffer.from(hex, "hex");
  if (key.length !== 32) throw new Error("CRM_TOKEN_KEY deve ter exatamente 32 bytes (64 chars hex)");
  return key;
}

export interface EncryptedToken {
  enc: string; // ciphertext (hex)
  iv:  string; // 12 bytes (hex)
  tag: string; // 16 bytes (hex)
}

export function encryptToken(plaintext: string): EncryptedToken {
  const key = getKey();
  const iv  = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return {
    enc: enc.toString("hex"),
    iv:  iv.toString("hex"),
    tag: cipher.getAuthTag().toString("hex"),
  };
}

export function decryptToken(token: EncryptedToken): string {
  const key     = getKey();
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(token.iv, "hex"));
  decipher.setAuthTag(Buffer.from(token.tag, "hex"));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(token.enc, "hex")),
    decipher.final(),
  ]);
  return dec.toString("utf8");
}
