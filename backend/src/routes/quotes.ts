import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../lib/require-auth.js";

export async function quoteRoutes(app: FastifyInstance) {
  // Todas as rotas de orçamentos exigem JWT
  app.addHook("preHandler", requireAuth);

  // GET /api/quotes — lista orçamentos acessíveis ao usuário
  app.get("/api/quotes", async (request, reply) => {
    const { tenantId, role, storeIds, sub: userId } = request.jwtUser!;

    const where: Record<string, unknown> = { tenantId };

    if (role === "vendedor") {
      // Vendedor só vê seus próprios orçamentos nas suas lojas
      where.vendedorId = userId;
      if (storeIds.length > 0) where.storeId = { in: storeIds };
    } else if (role === "fabricante") {
      if (storeIds.length > 0) where.storeId = { in: storeIds };
    }
    // admin vê tudo no tenant

    const quotes = await prisma.quote.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return reply.send(quotes.map(quoteToDto));
  });

  // POST /api/quotes — cria orçamento
  app.post("/api/quotes", async (request, reply) => {
    const { tenantId, storeIds, role, sub: userId } = request.jwtUser!;
    const body = request.body as {
      clientName:    string;
      proposalValue: number;
      status?:       string;
      formData:      Record<string, unknown>;
      vendedorId:    string;
      vendedorName:  string;
      storeId:       string;
    };

    if (!body.clientName || !body.storeId || body.proposalValue == null) {
      return reply.code(400).send({ error: "Campos obrigatórios: clientName, storeId, proposalValue." });
    }

    // Garante que o usuário só cria orçamentos em lojas que tem acesso
    if (role !== "admin" && storeIds.length > 0 && !storeIds.includes(body.storeId)) {
      return reply.code(403).send({ error: "Acesso negado para esta loja." });
    }

    const quote = await prisma.quote.create({
      data: {
        tenantId,
        storeId:       body.storeId,
        vendedorId:    body.vendedorId || userId,
        vendedorName:  body.vendedorName || "",
        clientName:    body.clientName,
        proposalValue: body.proposalValue,
        status:        body.status ?? "pendente",
        formData:      (body.formData ?? {}) as object,
      },
    });

    return reply.code(201).send(quoteToDto(quote));
  });

  // PUT /api/quotes/:id — atualiza orçamento
  app.put<{ Params: { id: string } }>("/api/quotes/:id", async (request, reply) => {
    const { tenantId, role, storeIds, sub: userId } = request.jwtUser!;
    const { id } = request.params;
    const body = request.body as Partial<{
      clientName:    string;
      proposalValue: number;
      formData:      Record<string, unknown>;
      vendedorName:  string;
    }>;

    const existing = await prisma.quote.findFirst({ where: { id, tenantId } });
    if (!existing) return reply.code(404).send({ error: "Orçamento não encontrado." });
    if (existing.status === "ganho") return reply.code(400).send({ error: "Orçamento ganho não pode ser editado." });

    // Vendedor só edita os próprios
    if (role === "vendedor" && existing.vendedorId !== userId) {
      return reply.code(403).send({ error: "Acesso negado." });
    }
    if (role === "fabricante" && storeIds.length > 0 && !storeIds.includes(existing.storeId)) {
      return reply.code(403).send({ error: "Acesso negado." });
    }

    const quote = await prisma.quote.update({
      where: { id },
      data: {
        ...(body.clientName    != null ? { clientName:    body.clientName }    : {}),
        ...(body.proposalValue != null ? { proposalValue: body.proposalValue } : {}),
        ...(body.formData      != null ? { formData:      body.formData as object } : {}),
        ...(body.vendedorName  != null ? { vendedorName:  body.vendedorName }  : {}),
      },
    });

    return reply.send(quoteToDto(quote));
  });

  // PATCH /api/quotes/:id/won — marca como ganho
  app.patch<{ Params: { id: string } }>("/api/quotes/:id/won", async (request, reply) => {
    const { tenantId, role, sub: userId } = request.jwtUser!;
    const { id } = request.params;

    const existing = await prisma.quote.findFirst({ where: { id, tenantId } });
    if (!existing) return reply.code(404).send({ error: "Orçamento não encontrado." });
    if (role === "vendedor" && existing.vendedorId !== userId) {
      return reply.code(403).send({ error: "Acesso negado." });
    }

    const quote = await prisma.quote.update({
      where: { id },
      data:  { status: "ganho", wonAt: new Date() },
    });

    return reply.send(quoteToDto(quote));
  });

  // PATCH /api/quotes/:id/lost — marca como perdido
  app.patch<{ Params: { id: string } }>("/api/quotes/:id/lost", async (request, reply) => {
    const { tenantId, role, sub: userId } = request.jwtUser!;
    const { id } = request.params;

    const existing = await prisma.quote.findFirst({ where: { id, tenantId } });
    if (!existing) return reply.code(404).send({ error: "Orçamento não encontrado." });
    if (existing.status === "ganho") return reply.code(400).send({ error: "Orçamento ganho não pode ser marcado como perdido." });
    if (role === "vendedor" && existing.vendedorId !== userId) {
      return reply.code(403).send({ error: "Acesso negado." });
    }

    const quote = await prisma.quote.update({
      where: { id },
      data:  { status: "perdido", lostAt: new Date() },
    });

    return reply.send(quoteToDto(quote));
  });
}

function quoteToDto(q: {
  id:            string;
  clientName:    string;
  proposalValue: number;
  status:        string;
  formData:      unknown;
  vendedorId:    string | null;
  vendedorName:  string;
  storeId:       string;
  createdAt:     Date;
  wonAt:         Date | null;
  lostAt:        Date | null;
}) {
  return {
    id:            q.id,
    clientName:    q.clientName,
    date:          q.createdAt.toISOString(),
    proposalValue: q.proposalValue,
    status:        q.status as "pendente" | "ganho" | "perdido",
    formData:      q.formData,
    vendedorId:    q.vendedorId ?? "",
    vendedorName:  q.vendedorName,
    storeId:       q.storeId,
    wonAt:         q.wonAt?.toISOString(),
  };
}
