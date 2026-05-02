import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { requireAdmin } from "../lib/require-auth.js";
import { encryptToken, decryptToken } from "../lib/crypto-vault.js";
import { cacheInvalidate } from "../lib/crm-config-cache.js";
import { listAgents } from "../lib/helena-client.js";

export async function crmConfigRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAdmin);

  // ── GET /api/stores/:storeId/crm-config ──────────────────────────────────────
  app.get<{ Params: { storeId: string } }>(
    "/api/stores/:storeId/crm-config",
    async (req, reply) => {
      const { tenantId } = req.jwtUser!;
      const { storeId }  = req.params;

      const config = await prisma.storeCrmConfig.findUnique({
        where: { storeId_crmSource: { storeId, crmSource: "helena" } },
      });

      if (!config) return reply.code(404).send({ error: "Configuração não encontrada." });

      // Valida que a loja pertence ao tenant
      const store = await prisma.store.findFirst({ where: { id: storeId, tenantId } });
      if (!store) return reply.code(403).send({ error: "Acesso negado." });

      return reply.send({
        id:            config.id,
        panelId:       config.panelId,
        hasToken:      true,
        stageMap:      config.stageMap,
        stagePriority: config.stagePriority,
        version:       config.version,
        updatedBy:     config.updatedBy,
        updatedAt:     config.updatedAt.toISOString(),
      });
    }
  );

  // ── PUT /api/stores/:storeId/crm-config ──────────────────────────────────────
  app.put<{ Params: { storeId: string } }>(
    "/api/stores/:storeId/crm-config",
    async (req, reply) => {
      const { tenantId, sub: updatedBy } = req.jwtUser!;
      const { storeId }         = req.params;
      const body = req.body as {
        panelId:        string;
        helenaToken?:   string; // opcional — omitir para manter o token atual
        stageMap:       unknown;
        stagePriority:  unknown;
      };

      if (!body.panelId)       return reply.code(400).send({ error: "panelId é obrigatório." });
      if (!body.stageMap)      return reply.code(400).send({ error: "stageMap é obrigatório." });
      if (!body.stagePriority) return reply.code(400).send({ error: "stagePriority é obrigatório." });

      const store = await prisma.store.findFirst({ where: { id: storeId, tenantId } });
      if (!store) return reply.code(403).send({ error: "Acesso negado." });

      const existing = await prisma.storeCrmConfig.findUnique({
        where: { storeId_crmSource: { storeId, crmSource: "helena" } },
      });

      // Resolve token: novo se enviado, mantém anterior se não enviado
      let tokenFields: { helenaTokenEnc: string; helenaTokenIv: string; helenaTokenTag: string };
      if (body.helenaToken) {
        const enc = encryptToken(body.helenaToken);
        tokenFields = { helenaTokenEnc: enc.enc, helenaTokenIv: enc.iv, helenaTokenTag: enc.tag };
      } else if (existing) {
        tokenFields = {
          helenaTokenEnc: existing.helenaTokenEnc,
          helenaTokenIv:  existing.helenaTokenIv,
          helenaTokenTag: existing.helenaTokenTag,
        };
      } else {
        return reply.code(400).send({ error: "helenaToken é obrigatório na criação." });
      }

      const config = await prisma.$transaction(async (tx) => {
        // Snapshot para auditoria antes de alterar
        if (existing) {
          await tx.storeCrmConfigAudit.create({
            data: {
              configId:     existing.id,
              changedBy:    updatedBy ?? null,
              snapshotJson: {
                panelId:       existing.panelId,
                stageMap:      existing.stageMap,
                stagePriority: existing.stagePriority,
                version:       existing.version,
              },
            },
          });
        }

        return tx.storeCrmConfig.upsert({
          where:  { storeId_crmSource: { storeId, crmSource: "helena" } },
          create: {
            storeId,
            crmSource:     "helena",
            panelId:       body.panelId,
            ...tokenFields,
            stageMap:      body.stageMap   as object,
            stagePriority: body.stagePriority as object,
            updatedBy:     updatedBy ?? null,
          },
          update: {
            panelId:       body.panelId,
            ...tokenFields,
            stageMap:      body.stageMap   as object,
            stagePriority: body.stagePriority as object,
            version:       { increment: 1 },
            updatedBy:     updatedBy ?? null,
          },
        });
      });

      cacheInvalidate(store.externalId ?? storeId);

      return reply.send({
        id:        config.id,
        panelId:   config.panelId,
        hasToken:  true,
        version:   config.version,
        updatedAt: config.updatedAt.toISOString(),
      });
    }
  );

  // ── DELETE /api/stores/:storeId/crm-config ───────────────────────────────────
  app.delete<{ Params: { storeId: string } }>(
    "/api/stores/:storeId/crm-config",
    async (req, reply) => {
      const { tenantId } = req.jwtUser!;
      const { storeId }  = req.params;

      const store = await prisma.store.findFirst({ where: { id: storeId, tenantId } });
      if (!store) return reply.code(403).send({ error: "Acesso negado." });

      await prisma.storeCrmConfig.deleteMany({
        where: { storeId, crmSource: "helena" },
      });

      cacheInvalidate(store.externalId ?? storeId);
      return reply.send({ ok: true });
    }
  );

  // ── POST /api/stores/:storeId/crm-config/test ────────────────────────────────
  // Testa o token Helena chamando listAgents. Usado pelo admin para validar config.
  app.post<{ Params: { storeId: string } }>(
    "/api/stores/:storeId/crm-config/test",
    async (req, reply) => {
      const { tenantId } = req.jwtUser!;
      const { storeId }  = req.params;

      const store = await prisma.store.findFirst({ where: { id: storeId, tenantId } });
      if (!store) return reply.code(403).send({ error: "Acesso negado." });

      const config = await prisma.storeCrmConfig.findUnique({
        where: { storeId_crmSource: { storeId, crmSource: "helena" } },
      });
      if (!config) return reply.code(404).send({ error: "Configuração não encontrada." });

      const start = Date.now();
      try {
        const token  = decryptToken({ enc: config.helenaTokenEnc, iv: config.helenaTokenIv, tag: config.helenaTokenTag });
        const agents = await listAgents(token);
        return reply.send({ ok: true, latencyMs: Date.now() - start, agentCount: agents.length });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro desconhecido";
        return reply.send({ ok: false, latencyMs: Date.now() - start, error: message });
      }
    }
  );
}
