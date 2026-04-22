import { type FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";

async function resolveAdminUser(tenantId: string, userId: string) {
  const user = await prisma.user.findFirst({ where: { id: userId, tenantId } });
  if (!user || user.role !== "admin") return null;
  return user;
}

function storeToDto(store: {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  externalId: string | null;
}) {
  return {
    id:         store.id,
    name:       store.name,
    city:       store.city ?? "",
    state:      store.state ?? "",
    externalId: store.externalId ?? undefined,
    createdAt:  new Date().toISOString(),
    active:     true,
  };
}

export async function storeRoutes(app: FastifyInstance) {
  // POST /api/stores — cria nova loja (admin only)
  app.post("/api/stores", async (req, reply) => {
    const tenantSlug  = req.headers["x-tenant-slug"] as string;
    const requesterId = req.headers["x-user-id"] as string;
    const body = req.body as {
      name?: string;
      city?: string;
      state?: string;
      externalId?: string;
    };

    if (!tenantSlug) return reply.code(400).send({ error: "Header x-tenant-slug obrigatório." });

    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) return reply.code(404).send({ error: "Tenant não encontrado." });

    if (!requesterId || !(await resolveAdminUser(tenant.id, requesterId))) {
      return reply.code(403).send({ error: "Acesso negado." });
    }

    if (!body.name) return reply.code(400).send({ error: "Campo obrigatório: name." });

    const store = await prisma.store.create({
      data: {
        tenantId:   tenant.id,
        name:       body.name,
        city:       body.city   ?? null,
        state:      body.state  ?? null,
        externalId: body.externalId ?? null,
      },
    });

    return reply.code(201).send(storeToDto(store));
  });

  // PUT /api/stores/:id — atualiza loja (admin only)
  app.put<{ Params: { id: string } }>("/api/stores/:id", async (req, reply) => {
    const tenantSlug  = req.headers["x-tenant-slug"] as string;
    const requesterId = req.headers["x-user-id"] as string;
    const { id }      = req.params;
    const body = req.body as {
      name?: string;
      city?: string;
      state?: string;
      externalId?: string;
    };

    if (!tenantSlug) return reply.code(400).send({ error: "Header x-tenant-slug obrigatório." });

    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) return reply.code(404).send({ error: "Tenant não encontrado." });

    if (!requesterId || !(await resolveAdminUser(tenant.id, requesterId))) {
      return reply.code(403).send({ error: "Acesso negado." });
    }

    const existing = await prisma.store.findFirst({ where: { id, tenantId: tenant.id } });
    if (!existing) return reply.code(404).send({ error: "Loja não encontrada." });

    const store = await prisma.store.update({
      where: { id },
      data:  {
        name:       body.name       ?? existing.name,
        city:       body.city       !== undefined ? (body.city || null)       : existing.city,
        state:      body.state      !== undefined ? (body.state || null)      : existing.state,
        externalId: body.externalId !== undefined ? (body.externalId || null) : existing.externalId,
      },
    });

    return reply.send(storeToDto(store));
  });

  // DELETE /api/stores/:id — exclui loja (admin only)
  app.delete<{ Params: { id: string } }>("/api/stores/:id", async (req, reply) => {
    const tenantSlug  = req.headers["x-tenant-slug"] as string;
    const requesterId = req.headers["x-user-id"] as string;
    const { id }      = req.params;

    if (!tenantSlug) return reply.code(400).send({ error: "Header x-tenant-slug obrigatório." });

    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) return reply.code(404).send({ error: "Tenant não encontrado." });

    if (!requesterId || !(await resolveAdminUser(tenant.id, requesterId))) {
      return reply.code(403).send({ error: "Acesso negado." });
    }

    const existing = await prisma.store.findFirst({ where: { id, tenantId: tenant.id } });
    if (!existing) return reply.code(404).send({ error: "Loja não encontrada." });

    await prisma.store.delete({ where: { id } });
    return reply.send({ ok: true });
  });
}
