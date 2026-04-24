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

const app = Fastify({ logger: false });

try {
  await app.register(helmet, {
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        "default-src":     ["'none'"],
        "frame-ancestors": ["'none'"],
      },
    },
  });
  await app.register(rateLimit, { global: true, max: 100, timeWindow: "1 minute" });

  const allowedOrigins = new Set([
    "http://localhost:5173",
    "http://localhost:5174",
    ...(process.env.FRONTEND_URL ?? "").split(",").map((u) => u.trim().replace(/\/$/, "")).filter(Boolean),
  ]);
  console.log(`[cors] FRONTEND_URL="${process.env.FRONTEND_URL ?? ""}"`);
  console.log(`[cors] origens permitidas: ${[...allowedOrigins].join(" | ")}`);

  await app.register(cors, {
    origin: (origin, cb) => {
      const o = origin?.replace(/\/$/, "");
      const allowed = !o || allowedOrigins.has(o);
      if (!allowed) console.warn(`[cors] bloqueado: ${o}`);
      cb(null, allowed);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-tenant-slug"],
  });

  app.setErrorHandler((error, _request, reply) => {
    const statusCode = error.statusCode ?? 500;
    return reply.code(statusCode).send({
      error: statusCode >= 500 ? "Erro interno do servidor." : error.message,
    });
  });

  await app.register(ingestRoutes);
  await app.register(dashboardRoutes);
  await app.register(authRoutes);
  await app.register(storeRoutes);
  await app.register(quoteRoutes);

  app.get("/health", async () => ({ ok: true, uptime: process.uptime() }));

  await app.listen({ port, host });
  console.log(`🚀 Backend rodando em http://${host}:${port}`);

  // Aplica schema e seed em background — não bloqueia o healthcheck
  const runSetup = () => {
    const dbPush = execFile(
      "node_modules/.bin/prisma",
      ["db", "push", "--skip-generate", "--accept-data-loss"],
      { timeout: 60_000, cwd: process.cwd() },
      (err, stdout) => {
        if (err) { console.error("[prisma] db push erro:", err.message); return; }
        console.log("[prisma] db push ok");
        if (stdout) console.log(stdout);

        // Roda seed após db push concluir (idempotente — usa upsert)
        const seed = execFile(
          "node",
          ["dist/seed.js"],
          { timeout: 30_000, cwd: process.cwd(), env: process.env },
          (e2, out) => {
            if (e2) console.error("[seed] erro:", e2.message);
            else { console.log("[seed] ok"); if (out) console.log(out); }
          }
        );
        seed.on("error", (e) => console.error("[seed] erro ao iniciar:", e.message));
      }
    );
    dbPush.on("error", (e) => console.error("[prisma] erro ao iniciar db push:", e.message));
  };
  runSetup();
} catch (err) {
  console.error("[startup] CRASH:", err);
  process.exit(1);
}
