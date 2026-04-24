import { type FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { requireAdmin } from "../lib/require-auth.js";

function storeToDto(store: {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  externalId: string | null;
  storeType: string;
}) {
  return {
    id:         store.id,
    name:       store.name,
    city:       store.city ?? "",
    state:      store.state ?? "",
    externalId: store.externalId ?? undefined,
    storeType:  store.storeType,
    createdAt:  new Date().toISOString(),
    active:     true,
  };
}

export async function storeRoutes(app: FastifyInstance) {
  // Todas as rotas de /api/stores exigem admin
  app.addHook("preHandler", requireAdmin);

  // POST /api/stores — cria nova loja
  app.post("/api/stores", async (req, reply) => {
    const { tenantId } = req.jwtUser!;
    const body = req.body as {
      name?: string;
      city?: string;
      state?: string;
      externalId?: string;
      storeType?: string;
    };

    if (!body.name) return reply.code(400).send({ error: "Campo obrigatório: name." });

    const store = await prisma.store.create({
      data: {
        tenantId,
        name:       body.name,
        city:       body.city       ?? null,
        state:      body.state      ?? null,
        externalId: body.externalId ?? null,
        storeType:  body.storeType  ?? "splash",
      },
    });

    return reply.code(201).send(storeToDto(store));
  });

  // PUT /api/stores/:id — atualiza loja
  app.put<{ Params: { id: string } }>("/api/stores/:id", async (req, reply) => {
    const { tenantId } = req.jwtUser!;
    const { id }       = req.params;
    const body = req.body as {
      name?: string;
      city?: string;
      state?: string;
      externalId?: string;
      storeType?: string;
    };

    const existing = await prisma.store.findFirst({ where: { id, tenantId } });
    if (!existing) return reply.code(404).send({ error: "Loja não encontrada." });

    const store = await prisma.store.update({
      where: { id },
      data:  {
        name:       body.name       ?? existing.name,
        city:       body.city       !== undefined ? (body.city || null)       : existing.city,
        state:      body.state      !== undefined ? (body.state || null)      : existing.state,
        externalId: body.externalId !== undefined ? (body.externalId || null) : existing.externalId,
        storeType:  body.storeType  ?? existing.storeType,
      },
    });

    return reply.send(storeToDto(store));
  });

  // DELETE /api/stores/:id — exclui loja
  app.delete<{ Params: { id: string } }>("/api/stores/:id", async (req, reply) => {
    const { tenantId } = req.jwtUser!;
    const { id }       = req.params;

    const existing = await prisma.store.findFirst({ where: { id, tenantId } });
    if (!existing) return reply.code(404).send({ error: "Loja não encontrada." });

    await prisma.store.delete({ where: { id } });
    return reply.send({ ok: true });
  });
}
