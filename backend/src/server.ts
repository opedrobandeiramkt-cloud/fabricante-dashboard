import "dotenv/config";
import Fastify from "fastify";

const port = Number(process.env.PORT ?? 3333);
const host = "0.0.0.0";

process.stdout.write(`[startup] PORT=${port} NODE_ENV=${process.env.NODE_ENV}\n`);

const app = Fastify({ logger: false });

app.get("/health", async () => ({ ok: true, uptime: process.uptime(), port }));

try {
  await app.listen({ port, host });
  process.stdout.write(`[startup] ESCUTANDO em ${host}:${port}\n`);
} catch (err) {
  process.stderr.write(`[startup] CRASH: ${err}\n`);
  process.exit(1);
}
