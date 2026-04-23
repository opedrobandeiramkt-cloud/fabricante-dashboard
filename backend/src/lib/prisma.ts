import { PrismaClient } from "@prisma/client";

let _client: PrismaClient | undefined;

function getClient(): PrismaClient {
  if (!_client) {
    if (!process.env.DATABASE_URL) {
      console.error("[prisma] ERRO: DATABASE_URL não está definida. Configure a variável no Railway.");
    }
    _client = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
  }
  return _client;
}

// Proxy lazy: só instancia o PrismaClient quando a primeira query for feita.
// Isso evita crash no startup se DATABASE_URL não estiver configurada.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return (getClient() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
