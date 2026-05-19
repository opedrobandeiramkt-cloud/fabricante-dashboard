import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { buildIdempotencyKey } from "../lib/crypto.js";
import { normalizeE164, hashPhone } from "../lib/phone.js";
import { sendPurchaseCapi, eventTimeNow } from "../lib/meta-capi.js";

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
        value:           { type: "number" },
        currency:        { type: "string" },
        salesperson:     { type: "string" },
        source:          { type: "string" },
        crmUserId:       { type: "string" },
        name:            { type: "string" },
        phone:           { type: "string" },
        salespersonName: { type: "string" },
        utm_source:      { type: "string" },
        utm_medium:      { type: "string" },
        utm_campaign:    { type: "string" },
        utm_content:     { type: "string" },
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
    {
      schema: { body: ingestBodySchema },
      config: { rateLimit: { max: 200, timeWindow: "1 minute" } },
    },
    async (request, reply) => {
      const body = request.body;

      // 1. Autenticação via Bearer token (WEBHOOK_SECRET obrigatório)
      const authHeader = request.headers.authorization ?? "";
      const expectedToken = process.env.WEBHOOK_SECRET;
      if (!expectedToken) {
        request.log.error("WEBHOOK_SECRET não configurado — endpoint bloqueado por segurança");
        return reply.code(503).send({ error: "Endpoint temporariamente indisponível." });
      }
      if (authHeader !== `Bearer ${expectedToken}`) {
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
          const existingLead = await tx.lead.findUnique({
            where: {
              tenantId_externalId: {
                tenantId:   tenant.id,
                externalId: body.lead_external_id,
              },
            },
          });

          const salespersonCrmId  = (body.metadata?.crmUserId       as string | undefined) ?? null;
          const revenueValue      = body.metadata?.value != null ? (body.metadata.value as number) : null;
          const revenueCurrency   = (body.metadata?.currency        as string | undefined) ?? "BRL";
          const contactName       = (body.metadata?.name            as string | undefined) ?? null;
          const contactPhone      = (body.metadata?.phone           as string | undefined) ?? null;
          const salespersonName   = (body.metadata?.salespersonName as string | undefined) ?? null;
          const utmSource         = (body.metadata?.utm_source      as string | undefined) ?? null;
          const utmMedium         = (body.metadata?.utm_medium      as string | undefined) ?? null;
          const utmCampaign       = (body.metadata?.utm_campaign    as string | undefined) ?? null;
          const utmContent        = (body.metadata?.utm_content     as string | undefined) ?? null;

          const lead = await tx.lead.upsert({
            where: {
              tenantId_externalId: {
                tenantId:   tenant.id,
                externalId: body.lead_external_id,
              },
            },
            create: {
              tenantId:         tenant.id,
              storeId:          store.id,
              externalId:       body.lead_external_id,
              currentStageId:   toStage.id,
              enteredAt:        occurredAt,
              closedAt:         toStage.isWon || toStage.isLost ? occurredAt : null,
              salespersonCrmId,
              salespersonName,
              contactName,
              contactPhone,
              metadata:         (body.metadata ?? {}) as object,
              estimatedValue:   revenueValue,
              revenue:          toStage.isWon ? revenueValue : null,
              revenueCurrency:  toStage.isWon ? revenueCurrency : null,
              revenueAt:        toStage.isWon ? occurredAt : null,
              utmSource,
              utmMedium,
              utmCampaign,
              utmContent,
            },
            update: {
              currentStageId: toStage.id,
              closedAt:       toStage.isWon || toStage.isLost ? occurredAt : null,
              ...(salespersonCrmId  ? { salespersonCrmId }  : {}),
              ...(salespersonName   ? { salespersonName }   : {}),
              ...(contactName       ? { contactName }       : {}),
              ...(contactPhone      ? { contactPhone }      : {}),
              ...(revenueValue != null ? { estimatedValue: revenueValue } : {}),
              ...(toStage.isWon && revenueValue != null ? {
                revenue:         revenueValue,
                revenueCurrency,
                revenueAt:       occurredAt,
              } : {}),
              // Atribuição first-touch: só sobrescreve UTMs se ainda não capturados
              ...(existingLead?.utmSource   == null && utmSource   ? { utmSource }   : {}),
              ...(existingLead?.utmMedium   == null && utmMedium   ? { utmMedium }   : {}),
              ...(existingLead?.utmCampaign == null && utmCampaign ? { utmCampaign } : {}),
              ...(existingLead?.utmContent  == null && utmContent  ? { utmContent }  : {}),
            },
          });

          // Se o lead já existia e from_stage não foi enviado,
          // usa o currentStageId anterior como fromStage para rastrear a jornada
          const resolvedFromStageId = fromStage?.id
            ?? (existingLead?.currentStageId && existingLead.currentStageId !== toStage.id
              ? existingLead.currentStageId
              : null);

          // Persiste o evento
          const event = await tx.leadEvent.create({
            data: {
              tenantId:      tenant.id,
              storeId:       store.id,
              leadId:        lead.id,
              fromStageId:   resolvedFromStageId,
              toStageId:     toStage.id,
              occurredAt,
              idempotencyKey,
              rawPayload:    body as object,
            },
          });

          // Calcula tempo de 1ª resposta quando o lead sai de lead_capturado pela 1ª vez
          const fromStageObj = fromStage
            ?? (resolvedFromStageId
                  ? await tx.funnelStage.findUnique({ where: { id: resolvedFromStageId } })
                  : null);

          if (
            fromStageObj?.key === "lead_capturado" &&
            existingLead !== null &&
            existingLead.firstResponseMinutes === null
          ) {
            const diffMs = occurredAt.getTime() - lead.enteredAt.getTime();
            await tx.lead.update({
              where: { id: lead.id },
              data:  { firstResponseMinutes: Math.round(diffMs / 60_000) },
            });
          }

          return {
            eventId:         event.id,
            leadId:          lead.id,
            isWon:           toStage.isWon,
            revenue:         toStage.isWon ? revenueValue : null,
            revenueCurrency: revenueCurrency,
            contactPhone:    lead.contactPhone,
            phoneHash:       lead.phoneHash,
            ctwaClid:        lead.ctwaClid,
            tenantId:        tenant.id,
            storeId:         store.id,
          };
        });

        // Dispara Purchase CAPI de forma assíncrona quando venda é confirmada
        if (result.isWon && result.contactPhone) {
          setImmediate(async () => {
            try {
              const metaConfig = await prisma.storeMetaConfig.findUnique({
                where:  { storeId: result.storeId },
                select: { pixelId: true, capiEnabled: true, accessTokenEnc: true, accessTokenIv: true, accessTokenTag: true },
              });
              if (!metaConfig?.capiEnabled || !metaConfig.pixelId) return;

              const ph = result.phoneHash ?? hashPhone(normalizeE164(result.contactPhone!));

              await sendPurchaseCapi({
                tenantId:        result.tenantId,
                storeId:         result.storeId,
                leadId:          result.leadId,
                pixelId:         metaConfig.pixelId,
                accessTokenEnc:  metaConfig.accessTokenEnc,
                accessTokenIv:   metaConfig.accessTokenIv,
                accessTokenTag:  metaConfig.accessTokenTag,
                eventTime:       eventTimeNow(),
                ctwaClid:        result.ctwaClid ?? undefined,
                userData:        { ph },
                value:           result.revenue ?? 0,
                currency:        result.revenueCurrency ?? "BRL",
              });
            } catch {
              // falha silenciosa — já registrada na tabela capi_events
            }
          });
        }

        return reply.code(201).send({ status: "created", eventId: result.eventId, leadId: result.leadId });

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

  // ── POST /api/ingest/meta-ads ─────────────────────────────────────────────────
  // Recebe dados da Meta Marketing API via N8N e faz upsert nas tabelas de ads
  app.post(
    "/api/ingest/meta-ads",
    { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } },
    async (req, reply) => {
      const authHeader   = req.headers.authorization ?? "";
      const expectedToken = process.env.WEBHOOK_SECRET;
      if (!expectedToken) return reply.code(503).send({ error: "Endpoint indisponível." });
      if (authHeader !== `Bearer ${expectedToken}`) return reply.code(401).send({ error: "Unauthorized" });

      const body = req.body as {
        tenant_slug:        string;
        store_external_id:  string;
        date:               string;  // "YYYY-MM-DD"
        metrics?: {
          spend?:       number;
          impressions?: number;
          clicks?:      number;
          leads?:       number;
          messages?:    number;
        };
        demographics?: Array<{
          dimension:   string;  // "age" | "gender" | "device"
          bucket:      string;
          spend?:      number;
          clicks?:     number;
          leads?:      number;
          impressions?: number;
        }>;
        creatives?: Array<{
          external_id:   string;
          name:          string;
          type?:         string;
          sub_platform?: string;
          spend?:        number;
          leads?:        number;
          messages?:     number;
          ctr?:          number;
          thumbnail_url?: string;
          period_start:  string;
          period_end:    string;
        }>;
        geo?: Array<{
          state:   string;
          spend?:  number;
          clicks?: number;
          leads?:  number;
        }>;
      };

      if (!body.tenant_slug || !body.store_external_id || !body.date) {
        return reply.code(400).send({ error: "Campos obrigatórios: tenant_slug, store_external_id, date." });
      }

      const date = new Date(body.date + "T00:00:00.000Z");
      if (isNaN(date.getTime())) return reply.code(400).send({ error: "date inválido. Use YYYY-MM-DD." });

      try {
        const tenant = await prisma.tenant.findUnique({ where: { slug: body.tenant_slug } });
        if (!tenant) return reply.code(404).send({ error: `Tenant não encontrado: ${body.tenant_slug}` });

        const store = await prisma.store.findFirst({
          where: { tenantId: tenant.id, externalId: body.store_external_id },
        });
        if (!store) return reply.code(404).send({ error: `Loja não encontrada: ${body.store_external_id}` });

        await prisma.$transaction(async (tx) => {
          // Métricas diárias — upsert
          if (body.metrics) {
            await tx.adMetricDaily.upsert({
              where:  { tenantId_storeId_platform_date: { tenantId: tenant.id, storeId: store.id, platform: "meta", date } },
              create: {
                tenantId:    tenant.id,
                storeId:     store.id,
                platform:    "meta",
                date,
                spend:       body.metrics.spend       ?? 0,
                impressions: body.metrics.impressions ?? 0,
                clicks:      body.metrics.clicks      ?? 0,
                leads:       body.metrics.leads       ?? 0,
                messages:    body.metrics.messages    ?? 0,
              },
              update: {
                spend:       body.metrics.spend       ?? 0,
                impressions: body.metrics.impressions ?? 0,
                clicks:      body.metrics.clicks      ?? 0,
                leads:       body.metrics.leads       ?? 0,
                messages:    body.metrics.messages    ?? 0,
              },
            });
          }

          // Demographics — deleta e recria (mais simples que upsert por bucket)
          if (body.demographics?.length) {
            await tx.adDemographic.deleteMany({
              where: { tenantId: tenant.id, storeId: store.id, platform: "meta", date },
            });
            await tx.adDemographic.createMany({
              data: body.demographics.map((d) => ({
                tenantId:    tenant.id,
                storeId:     store.id,
                platform:    "meta",
                date,
                dimension:   d.dimension,
                bucket:      d.bucket,
                spend:       d.spend       ?? 0,
                clicks:      d.clicks      ?? 0,
                leads:       d.leads       ?? 0,
                impressions: d.impressions ?? 0,
              })),
            });
          }

          // Criativos — upsert por externalId
          if (body.creatives?.length) {
            for (const c of body.creatives) {
              const pStart = new Date(c.period_start + "T00:00:00.000Z");
              const pEnd   = new Date(c.period_end   + "T00:00:00.000Z");
              // Exclui registro existente do mesmo período e insere novo
              await tx.adCreative.deleteMany({
                where: { tenantId: tenant.id, storeId: store.id, externalId: c.external_id, periodStart: pStart },
              });
              await tx.adCreative.create({
                data: {
                  tenantId:     tenant.id,
                  storeId:      store.id,
                  externalId:   c.external_id,
                  name:         c.name,
                  type:         c.type          ?? "image",
                  subPlatform:  c.sub_platform  ?? null,
                  spend:        c.spend         ?? 0,
                  leads:        c.leads         ?? 0,
                  messages:     c.messages      ?? 0,
                  ctr:          c.ctr           ?? 0,
                  thumbnailUrl: c.thumbnail_url ?? null,
                  periodStart:  pStart,
                  periodEnd:    pEnd,
                },
              });
            }
          }

          // Geo — deleta e recria por dia
          if (body.geo?.length) {
            await tx.adGeoMetric.deleteMany({
              where: { tenantId: tenant.id, storeId: store.id, platform: "meta", date },
            });
            await tx.adGeoMetric.createMany({
              data: body.geo.map((g) => ({
                tenantId: tenant.id,
                storeId:  store.id,
                platform: "meta",
                date,
                state:    g.state.toUpperCase().slice(0, 2),
                spend:    g.spend  ?? 0,
                clicks:   g.clicks ?? 0,
                leads:    g.leads  ?? 0,
              })),
            });
          }

          // Atualiza lastSyncAt na config da loja
          await tx.storeMetaConfig.updateMany({
            where: { storeId: store.id },
            data:  { lastSyncAt: new Date() },
          });
        });

        return reply.code(201).send({ ok: true, date: body.date, storeId: store.id });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro desconhecido";
        req.log.error({ err }, "Falha no ingest meta-ads");
        return reply.code(500).send({ error: message });
      }
    }
  );

  // Health check do webhook
  app.get("/api/ingest/health", async (_req, reply) => {
    return reply.send({ ok: true, timestamp: new Date().toISOString() });
  });
}
