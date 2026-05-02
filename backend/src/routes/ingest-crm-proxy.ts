import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { decryptToken } from "../lib/crypto-vault.js";
import { cacheGet, cacheSet } from "../lib/crm-config-cache.js";
import { getCard, getContact, listAgents, moveCard } from "../lib/helena-client.js";

// Autenticação via WEBHOOK_SECRET (mesmo usado pelo N8N → /api/ingest/event)
function requireWebhookSecret(req: Parameters<typeof checkSecret>[0], reply: Parameters<typeof checkSecret>[1]) {
  return checkSecret(req, reply);
}
async function checkSecret(
  req:   { headers: { authorization?: string } },
  reply: { code: (n: number) => { send: (b: unknown) => unknown } },
): Promise<boolean> {
  const expected = process.env.WEBHOOK_SECRET;
  if (!expected) {
    (reply.code(503) as { send: (b: unknown) => unknown }).send({ error: "WEBHOOK_SECRET não configurado." });
    return false;
  }
  if (req.headers.authorization !== `Bearer ${expected}`) {
    (reply.code(401) as { send: (b: unknown) => unknown }).send({ error: "Unauthorized" });
    return false;
  }
  return true;
}

// Resolve config pública da loja (sem token) — cache primeiro, banco depois
async function resolvePublicConfig(storeExternalId: string, tenantSlug: string) {
  const cached = cacheGet(storeExternalId);
  if (cached) return cached;

  const dbConfig = await fetchDbConfig(storeExternalId, tenantSlug);
  if (!dbConfig) return null;

  cacheSet(storeExternalId, {
    panelId:       dbConfig.panelId,
    stageMap:      dbConfig.stageMap,
    stagePriority: dbConfig.stagePriority,
    version:       dbConfig.version,
  });

  return cacheGet(storeExternalId);
}

// Busca config completa no banco incluindo campos criptografados do token
async function fetchDbConfig(storeExternalId: string, tenantSlug: string) {
  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
  if (!tenant) return null;

  const store = await prisma.store.findFirst({
    where: { tenantId: tenant.id, externalId: storeExternalId },
    include: { crmConfigs: { where: { crmSource: "helena" }, take: 1 } },
  });

  return store?.crmConfigs[0] ?? null;
}

export async function ingestCrmProxyRoutes(app: FastifyInstance) {

  // ── GET /api/ingest/crm-config/:storeExternalId ──────────────────────────────
  // Chamado pelo N8N para obter panelId + stageMap. Token NUNCA retorna.
  app.get<{ Params: { storeExternalId: string }; Querystring: { tenantSlug?: string } }>(
    "/api/ingest/crm-config/:storeExternalId",
    async (req, reply) => {
      if (!await checkSecret(req as Parameters<typeof checkSecret>[0], reply as Parameters<typeof checkSecret>[1])) return;

      const { storeExternalId } = req.params;
      const tenantSlug = req.query.tenantSlug ?? "igui";

      const cached = cacheGet(storeExternalId);
      if (cached) {
        return reply.send({ panelId: cached.panelId, stageMap: cached.stageMap, stagePriority: cached.stagePriority, version: cached.version });
      }

      const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
      if (!tenant) return reply.code(404).send({ error: "Tenant não encontrado." });

      const store = await prisma.store.findFirst({
        where: { tenantId: tenant.id, externalId: storeExternalId },
        include: { crmConfigs: { where: { crmSource: "helena" }, take: 1 } },
      });

      const config = store?.crmConfigs[0];
      if (!config) return reply.code(404).send({ error: "Configuração CRM não encontrada para esta loja." });

      cacheSet(storeExternalId, {
        panelId:       config.panelId,
        stageMap:      config.stageMap,
        stagePriority: config.stagePriority,
        version:       config.version,
      });

      return reply.send({
        panelId:       config.panelId,
        stageMap:      config.stageMap,
        stagePriority: config.stagePriority,
        version:       config.version,
      });
    }
  );

  // ── POST /api/ingest/helena/fetch-card-data ───────────────────────────────────
  // Chamado pelo N8N para buscar card + contato + agentes via Helena.
  // Token Helena nunca sai do backend.
  app.post<{ Body: { storeExternalId: string; contactId: string; tenantSlug?: string } }>(
    "/api/ingest/helena/fetch-card-data",
    async (req, reply) => {
      if (!await checkSecret(req as Parameters<typeof checkSecret>[0], reply as Parameters<typeof checkSecret>[1])) return;

      const { storeExternalId, contactId, tenantSlug = "igui" } = req.body;
      if (!storeExternalId || !contactId) return reply.code(400).send({ error: "storeExternalId e contactId são obrigatórios." });

      const config = await fetchDbConfig(storeExternalId, tenantSlug);
      if (!config) return reply.code(404).send({ error: "Configuração CRM não encontrada." });

      const token = decryptToken({ enc: config.helenaTokenEnc, iv: config.helenaTokenIv, tag: config.helenaTokenTag });

      const [card, contact, agents] = await Promise.all([
        getCard(config.panelId, contactId, token),
        getContact(contactId, token),
        listAgents(token),
      ]);

      const agent = card?.responsibleUserId
        ? agents.find((a) => a.userId === card.responsibleUserId) ?? null
        : null;

      return reply.send({
        cardId:        card?.id ?? null,
        monetaryAmount: card?.monetaryAmount ?? card?.value ?? null,
        contactName:   contact?.name ?? null,
        contactPhone:  contact?.phoneNumberFormatted ?? null,
        agentEmail:    agent?.email ?? null,
        agentName:     agent?.name ?? null,
        utmSource:     contact?.utm?.source   ?? null,
        utmMedium:     contact?.utm?.medium   ?? null,
        utmCampaign:   contact?.utm?.campaign ?? null,
        utmContent:    contact?.utm?.content  ?? contact?.utm?.headline ?? null,
      });
    }
  );

  // ── POST /api/ingest/helena/move-card ─────────────────────────────────────────
  // Chamado pelo N8N para mover o card no Kanban Helena.
  app.post<{ Body: { storeExternalId: string; cardId: string; stepId: string; tenantSlug?: string } }>(
    "/api/ingest/helena/move-card",
    async (req, reply) => {
      if (!await checkSecret(req as Parameters<typeof checkSecret>[0], reply as Parameters<typeof checkSecret>[1])) return;

      const { storeExternalId, cardId, stepId, tenantSlug = "igui" } = req.body;
      if (!storeExternalId || !cardId || !stepId) return reply.code(400).send({ error: "storeExternalId, cardId e stepId são obrigatórios." });

      const config = await fetchDbConfig(storeExternalId, tenantSlug);
      if (!config) return reply.code(404).send({ error: "Configuração CRM não encontrada." });

      const token = decryptToken({ enc: config.helenaTokenEnc, iv: config.helenaTokenIv, tag: config.helenaTokenTag });
      await moveCard(cardId, stepId, token);

      return reply.send({ ok: true });
    }
  );
}
