import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { normalizeE164, hashPhone } from "../lib/phone.js";
import { decryptToken } from "../lib/crypto-vault.js";
import { resolveAdContext } from "../lib/meta-ads-resolver.js";
import { sendLeadCapi, eventTimeNow } from "../lib/meta-capi.js";

// Payload enviado pelo Z-API via N8N quando uma mensagem chega
interface ZApiLeadBody {
  connectedPhone: string;          // número WhatsApp da loja (identifica a store)
  phone: string;                   // número do lead
  name?: string;                   // nome do contato (opcional)
  ctwaClid?: string;               // click-to-WhatsApp click ID (Meta atribuição)
  adId?: string;                   // ID do anúncio (optional, para resolver contexto)
  tenantSlug: string;              // tenant da loja
}

export async function ingestWhatsappRoutes(app: FastifyInstance) {
  app.post<{ Body: ZApiLeadBody }>(
    "/api/ingest/whatsapp-lead",
    { config: { rateLimit: { max: 300, timeWindow: "1 minute" } } },
    async (request, reply) => {

      // 1. Auth Bearer WEBHOOK_SECRET
      const expectedToken = process.env.WEBHOOK_SECRET;
      if (!expectedToken) return reply.code(503).send({ error: "Endpoint indisponível." });
      if (request.headers.authorization !== `Bearer ${expectedToken}`) {
        return reply.code(401).send({ error: "Unauthorized" });
      }

      const body = request.body;

      // 2. Só processa leads de WhatsApp Ads (ctwaClid obrigatório)
      if (!body.ctwaClid) {
        return reply.code(200).send({ status: "skipped", reason: "no_ctwa_clid" });
      }

      try {
        // 3. Resolve tenant
        const tenant = await prisma.tenant.findUnique({
          where: { slug: body.tenantSlug },
        });
        if (!tenant) return reply.code(422).send({ error: `Tenant não encontrado: ${body.tenantSlug}` });

        // 4. Resolve loja pelo número WhatsApp conectado
        const zapiConfig = await prisma.storeZapiConfig.findUnique({
          where: { whatsappNumber: body.connectedPhone },
          include: { store: { include: { metaConfig: true } } },
        });
        if (!zapiConfig?.syncEnabled) {
          return reply.code(200).send({ status: "skipped", reason: "store_not_found_or_disabled" });
        }
        const { store } = zapiConfig;

        // 5. Normaliza e faz hash do telefone para dedup
        const phoneE164 = normalizeE164(body.phone);
        const phoneHash = hashPhone(phoneE164);

        // 6. Dedup: evita duplicar se já criamos lead para este telefone nesta loja
        const existing = await prisma.lead.findFirst({
          where: { tenantId: tenant.id, storeId: store.id, phoneHash },
          select: { id: true },
        });
        if (existing) {
          return reply.code(200).send({ status: "duplicate", leadId: existing.id });
        }

        // 7. Resolve etapa inicial do funil
        const firstStage = await prisma.funnelStage.findFirst({
          where:   { tenantId: tenant.id },
          orderBy: { orderIndex: "asc" },
        });
        if (!firstStage) return reply.code(422).send({ error: "Funil não configurado." });

        // 8. Resolve contexto do anúncio via Graph API (com cache LRU)
        let adContext = null;
        if (body.adId && store.metaConfig) {
          const accessToken = decryptToken({
            enc: store.metaConfig.accessTokenEnc,
            iv:  store.metaConfig.accessTokenIv,
            tag: store.metaConfig.accessTokenTag,
          });
          adContext = await resolveAdContext(body.adId, accessToken);
        }

        // 9. Cria o lead
        const lead = await prisma.lead.create({
          data: {
            tenantId:        tenant.id,
            storeId:         store.id,
            externalId:      `wa_${phoneHash.slice(0, 16)}_${Date.now()}`,
            currentStageId:  firstStage.id,
            enteredAt:       new Date(),
            contactPhone:    phoneE164,
            contactName:     body.name ?? null,
            phoneHash,
            ctwaClid:        body.ctwaClid,
            metaAdId:        body.adId ?? null,
            metaAdsetId:     adContext?.adsetId ?? null,
            metaCampaignId:  adContext?.campaignId ?? null,
            metaAdName:      adContext?.adName ?? null,
            metaAdsetName:   adContext?.adsetName ?? null,
            metaCampaignName: adContext?.campaignName ?? null,
            origemManual:    "meta",
            utmSource:       "meta",
            utmMedium:       "cpc",
            utmCampaign:     adContext?.campaignName ?? null,
            metadata:        {},
          },
        });

        // 10. Cria o evento inicial do funil
        await prisma.leadEvent.create({
          data: {
            tenantId:      tenant.id,
            storeId:       store.id,
            leadId:        lead.id,
            toStageId:     firstStage.id,
            occurredAt:    new Date(),
            idempotencyKey: `wa_${phoneHash.slice(0, 16)}_${firstStage.id}`,
          },
        });

        // 11. CAPI Lead event (assíncrono)
        if (store.metaConfig?.capiEnabled && store.metaConfig.pixelId) {
          setImmediate(async () => {
            try {
              await sendLeadCapi({
                tenantId:        tenant.id,
                storeId:         store.id,
                leadId:          lead.id,
                pixelId:         store.metaConfig!.pixelId!,
                accessTokenEnc:  store.metaConfig!.accessTokenEnc,
                accessTokenIv:   store.metaConfig!.accessTokenIv,
                accessTokenTag:  store.metaConfig!.accessTokenTag,
                eventTime:       eventTimeNow(),
                ctwaClid:        body.ctwaClid,
                userData:        { ph: phoneHash },
              });
            } catch {
              // silencioso — registrado em capi_events
            }
          });
        }

        return reply.code(201).send({ status: "created", leadId: lead.id });

      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro desconhecido";
        request.log.error({ err, body }, "Falha no ingest WhatsApp lead");
        return reply.code(422).send({ error: message });
      }
    }
  );
}
