import "dotenv/config";
import { execFile } from "child_process";
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { ingestRoutes } from "./routes/ingest.js";
import { dashboardRoutes } from "./routes/dashboard.js";
import { authRoutes } from "./routes/auth.js";
import { storeRoutes } from "./routes/stores.js";
import { quoteRoutes } from "./routes/quotes.js";

const port = Number(process.env.PORT ?? 3333);
const host = process.env.HOST ?? "0.0.0.0";

console.log(`[startup] NODE_ENV=${process.env.NODE_ENV} PORT=${port} HOST=${host}`);
console.log(`[startup] DATABASE_URL=${process.env.DATABASE_URL ? "definida" : "NÃO DEFINIDA"}`);

const app = Fastify({ logger: false });

try {
  console.log("[startup] registrando plugins...");
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(rateLimit, { global: true, max: 100, timeWindow: "1 minute" });

  const allowedOrigins = new Set([
    "http://localhost:5173",
    "http://localhost:5174",
    ...(process.env.FRONTEND_URL ?? "").split(",").map((u) => u.trim().replace(/\/$/, "")).filter(Boolean),
  ]);

  await app.register(cors, {
    origin: (origin, cb) => {
      const o = origin?.replace(/\/$/, "");
      cb(null, !o || allowedOrigins.has(o));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-tenant-slug", "x-user-id"],
  });

  app.setErrorHandler((error, _request, reply) => {
    console.error("[error]", error.message);
    const statusCode = error.statusCode ?? 500;
    return reply.code(statusCode).send({
      error: statusCode >= 500 ? "Erro interno do servidor." : error.message,
    });
  });

  console.log("[startup] registrando rotas...");
  await app.register(ingestRoutes);
  await app.register(dashboardRoutes);
  await app.register(authRoutes);
  await app.register(storeRoutes);
  await app.register(quoteRoutes);

  app.get("/health", async () => ({ ok: true, uptime: process.uptime(), port }));

  console.log(`[startup] chamando app.listen(${port}, ${host})...`);
  await app.listen({ port, host });
  console.log(`[startup] ✅ servidor escutando em http://${host}:${port}`);

  const dbPush = execFile(
    "node_modules/.bin/prisma",
    ["db", "push", "--skip-generate", "--accept-data-loss"],
    { timeout: 45_000, cwd: process.cwd() },
    (err, stdout) => {
      if (err) console.error("[prisma] db push erro:", err.message);
      else { console.log("[prisma] db push ok"); if (stdout) console.log(stdout); }
    }
  );
  dbPush.on("error", (e) => console.error("[prisma] falha ao iniciar:", e.message));
} catch (err) {
  console.error("[startup] CRASH:", err);
  process.exit(1);
}
