import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { ingestRoutes } from "./routes/ingest.js";
import { dashboardRoutes } from "./routes/dashboard.js";
import { authRoutes } from "./routes/auth.js";

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

const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://localhost:5174",
  ...(process.env.FRONTEND_URL ?? "").split(",").map((u) => u.trim()).filter(Boolean),
]);

await app.register(cors, {
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.has(origin)) {
      cb(null, true);
    } else {
      cb(new Error("Not allowed by CORS"), false);
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-tenant-slug", "x-user-id"],
});

// ─── Rotas ────────────────────────────────────────────────────────────────────

await app.register(ingestRoutes);
await app.register(dashboardRoutes);
await app.register(authRoutes);

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
