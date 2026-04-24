import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { ingestRoutes } from "./routes/ingest.js";
import { dashboardRoutes } from "./routes/dashboard.js";
import { authRoutes } from "./routes/auth.js";
import { storeRoutes } from "./routes/stores.js";

const app = Fastify({
  logger: {
    transport:
      process.env.NODE_ENV === "development"
        ? { target: "pino-pretty", options: { colorize: true } }
        : undefined,
  },
});

// ─── Plugins ─────────────────────────────────────────────────────────────────

await app.register(helmet, { contentSecurityPolicy: false });

await app.register(rateLimit, {
  global: false, // aplica apenas onde config: { rateLimit: ... } for definido
});

const allowedOrigins = new Set(
  [
    "http://localhost:5173",
    "http://localhost:5174",
    ...(process.env.FRONTEND_URL ?? "").split(",").map((u) => u.trim().replace(/\/$/, "")).filter(Boolean),
  ]
);

await app.register(cors, {
  origin: (origin, cb) => {
    const normalizedOrigin = origin?.replace(/\/$/, "");
    if (!normalizedOrigin || allowedOrigins.has(normalizedOrigin)) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-tenant-slug", "x-user-id"],
});

// ─── Error handler global (evita vazar stack trace) ──────────────────────────

app.setErrorHandler((error, _request, reply) => {
  app.log.error(error);
  const statusCode = error.statusCode ?? 500;
  if (statusCode >= 500) {
    return reply.code(statusCode).send({ error: "Erro interno do servidor." });
  }
  return reply.code(statusCode).send({ error: error.message });
});

// ─── Rotas ────────────────────────────────────────────────────────────────────

await app.register(ingestRoutes);
await app.register(dashboardRoutes);
await app.register(authRoutes);
await app.register(storeRoutes);

// Health check global
app.get("/health", async () => ({ ok: true, uptime: process.uptime() }));

// ─── Inicialização ────────────────────────────────────────────────────────────

const port = Number(process.env.PORT ?? 3333);
const host = process.env.HOST ?? "0.0.0.0";

try {
  await app.listen({ port, host });
  console.log(`\n🚀 Backend rodando em http://localhost:${port}\n`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
