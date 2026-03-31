import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { buildIdempotencyKey } from "../lib/crypto.js";

// ─── Schema de validação do payload ──────────────────────────────────────────

const ingestBodySchema = {
  type: "object",
  required: ["event_id", "tenant_slug", "store_external_id", "lead_external_id", "to_stage", "occurred_at"],
  properties: {
    event_id:          { type: "string", minLength: 1 },
    crm_source:        { type: "string" },          // "chatwoot" | "helena"
    tenant_slug:       { type: "string" },
    store_external_id: { type: "string" },
    lead_external_id:  { type: "string" },
    from_stage:        { type: "string" },          // null = entrada no funil
    to_stage:          { type: "string", minLength: 1 },
    occurred_at:       { type: "string", minLength: 1 }, // ISO 8601
    metadata: {
      type: "object",
      properties: {
        value:       { type: "number" },
        currency:    { type: "string" },
        salesperson: { type: "string" },
        source:      { type: "string" },
      },
      additionalProperties: true,
    },
  },
} as const;

type IngestBody = {
  event_id: string;
  crm_source?: string;
  tenant_slug: string;
  store_external_id: string;
  lead_external_id: string;
  from_stage?: string;
  to_stage: string;
  occurred_at: string;
  metadata?: Record<string, unknown>;
};

// ─── Rota ─────────────────────────────────────────────────────────────────────

export async function ingestRoutes(app: FastifyInstance) {
  app.post<{ Body: IngestBody }>(
    "/api/ingest/event",
    { schema: { body: ingestBodySchema } },
    async (request, reply) => {
      const body = request.body;

      // 1. Autenticação simples via Bearer token
      const authHeader = request.headers.authorization ?? "";
      const expectedToken = process.env.WEBHOOK_SECRET;
      if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
        return reply.code(401).send({ error: "Unauthorized" });
      }

      // 2. Gera chave de idempotência
      const idempotencyKey = buildIdempotencyKey({
        eventId:       body.event_id,
        leadExternalId: body.lead_external_id,
        toStage:       body.to_stage,
        occurredAt:    body.occurred_at,
      });

      // 3. Verifica duplicata (retorna 200 silenciosamente)
      const existing = await prisma.leadEvent.findUnique({
        where: { idempotencyKey },
        select: { id: true },
      });
      if (existing) {
        return reply.code(200).send({ status: "duplicate", id: existing.id });
      }

      // 4. Valida e parseia o timestamp
      const occurredAt = new Date(body.occurred_at);
      if (isNaN(occurredAt.getTime())) {
        return reply.code(422).send({ error: "Campo occurred_at inválido. Use ISO 8601." });
      }

      try {
        // 5. Tudo em uma transação para garantir consistência
        const result = await prisma.$transaction(async (tx) => {

          // Resolve tenant
          const tenant = await tx.tenant.findUnique({
            where: { slug: body.tenant_slug },
          });
          if (!tenant) {
            throw new Error(`Tenant não encontrado: ${body.tenant_slug}`);
          }

          // Resolve ou cria loja
          const store = await tx.store.upsert({
            where: {
              tenantId_externalId: {
                tenantId:   tenant.id,
                externalId: body.store_external_id,
              },
            },
            create: {
              tenantId:   tenant.id,
              externalId: body.store_external_id,
              name:       `Loja ${body.store_external_id}`,
            },
            update: {},
          });

          // Resolve etapa destino
          const toStage = await tx.funnelStage.findUnique({
            where: {
              tenantId_key: {
                tenantId: tenant.id,
                key:      body.to_stage,
              },
            },
          });
          if (!toStage) {
            throw new Error(`Etapa não encontrada: ${body.to_stage}`);
          }

          // Resolve etapa origem (opcional)
          let fromStage = null;
          if (body.from_stage) {
            fromStage = await tx.funnelStage.findUnique({
              where: {
                tenantId_key: {
                  tenantId: tenant.id,
                  key:      body.from_stage,
                },
              },
            });
          }

          // Resolve ou cria lead
          const lead = await tx.lead.upsert({
            where: {
              tenantId_externalId: {
                tenantId:   tenant.id,
                externalId: body.lead_external_id,
              },
            },
            create: {
              tenantId:      tenant.id,
              storeId:       store.id,
              externalId:    body.lead_external_id,
              currentStageId: toStage.id,
              enteredAt:     occurredAt,
              closedAt:      toStage.isWon || toStage.isLost ? occurredAt : null,
              metadata:      body.metadata ?? {},
            },
            update: {
              currentStageId: toStage.id,
              closedAt:       toStage.isWon || toStage.isLost ? occurredAt : null,
            },
          });

          // Persiste o evento
          const event = await tx.leadEvent.create({
            data: {
              tenantId:      tenant.id,
              storeId:       store.id,
              leadId:        lead.id,
              fromStageId:   fromStage?.id ?? null,
              toStageId:     toStage.id,
              occurredAt,
              idempotencyKey,
              rawPayload:    body as object,
            },
          });

          return { eventId: event.id, leadId: lead.id };
        });

        return reply.code(201).send({ status: "created", ...result });

      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro desconhecido";

        // Persiste falha para reprocessamento
        await prisma.failedEvent.create({
          data: {
            payload: body as object,
            error:   message,
            source:  "webhook",
          },
        }).catch(() => {}); // não falha se isso também falhar

        request.log.error({ err, body }, "Falha na ingestão do evento");
        return reply.code(422).send({ error: message });
      }
    }
  );

  // Health check do webhook
  app.get("/api/ingest/health", async (_req, reply) => {
    return reply.send({ ok: true, timestamp: new Date().toISOString() });
  });
}
