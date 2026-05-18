import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { requireAdmin } from "../lib/require-auth.js";
import { encryptToken, decryptToken } from "../lib/crypto-vault.js";

const META_API = "https://graph.facebook.com/v21.0";
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

// ─── Auth helper para N8N (Bearer WEBHOOK_SECRET) ─────────────────────────────

function requireWebhookSecret(authHeader: string | undefined): boolean {
  return authHeader === `Bearer ${WEBHOOK_SECRET}`;
}

export async function metaConfigRoutes(app: FastifyInstance) {

  // ── GET /api/stores/:storeId/meta-config (admin JWT) ───────────────────────
  app.get<{ Params: { storeId: string } }>(
    "/api/stores/:storeId/meta-config",
    { preHandler: requireAdmin },
    async (req, reply) => {
      const { tenantId } = req.jwtUser!;
      const { storeId }  = req.params;

      const store = await prisma.store.findFirst({ where: { id: storeId, tenantId } });
      if (!store) return reply.code(403).send({ error: "Acesso negado." });

      const config = await prisma.storeMetaConfig.findUnique({ where: { storeId } });
      if (!config) return reply.code(404).send({ error: "Configuração Meta não encontrada." });

      return reply.send({
        id:          config.id,
        adAccountId: config.adAccountId,
        pixelId:     config.pixelId,
        hasToken:    true,
        syncEnabled: config.syncEnabled,
        lastSyncAt:  config.lastSyncAt?.toISOString() ?? null,
        updatedAt:   config.updatedAt.toISOString(),
      });
    }
  );

  // ── PUT /api/stores/:storeId/meta-config (admin JWT) ───────────────────────
  app.put<{ Params: { storeId: string } }>(
    "/api/stores/:storeId/meta-config",
    { preHandler: requireAdmin },
    async (req, reply) => {
      const { tenantId } = req.jwtUser!;
      const { storeId }  = req.params;
      const body = req.body as {
        adAccountId:  string;
        accessToken?: string;
        pixelId?:     string;
        syncEnabled?: boolean;
      };

      if (!body.adAccountId) return reply.code(400).send({ error: "adAccountId é obrigatório." });

      const store = await prisma.store.findFirst({ where: { id: storeId, tenantId } });
      if (!store) return reply.code(403).send({ error: "Acesso negado." });

      const existing = await prisma.storeMetaConfig.findUnique({ where: { storeId } });

      let tokenFields: { accessTokenEnc: string; accessTokenIv: string; accessTokenTag: string };
      if (body.accessToken) {
        const enc = encryptToken(body.accessToken);
        tokenFields = { accessTokenEnc: enc.enc, accessTokenIv: enc.iv, accessTokenTag: enc.tag };
      } else if (existing) {
        tokenFields = {
          accessTokenEnc: existing.accessTokenEnc,
          accessTokenIv:  existing.accessTokenIv,
          accessTokenTag: existing.accessTokenTag,
        };
      } else {
        return reply.code(400).send({ error: "accessToken é obrigatório na criação." });
      }

      const config = await prisma.storeMetaConfig.upsert({
        where:  { storeId },
        create: {
          storeId,
          adAccountId: body.adAccountId,
          pixelId:     body.pixelId ?? null,
          syncEnabled: body.syncEnabled ?? true,
          ...tokenFields,
        },
        update: {
          adAccountId: body.adAccountId,
          pixelId:     body.pixelId !== undefined ? (body.pixelId || null) : existing?.pixelId ?? null,
          syncEnabled: body.syncEnabled ?? existing?.syncEnabled ?? true,
          ...tokenFields,
        },
      });

      return reply.send({
        id:          config.id,
        adAccountId: config.adAccountId,
        pixelId:     config.pixelId,
        hasToken:    true,
        syncEnabled: config.syncEnabled,
        updatedAt:   config.updatedAt.toISOString(),
      });
    }
  );

  // ── POST /api/stores/:storeId/meta-config/test (admin JWT) ─────────────────
  app.post<{ Params: { storeId: string } }>(
    "/api/stores/:storeId/meta-config/test",
    { preHandler: requireAdmin },
    async (req, reply) => {
      const { tenantId } = req.jwtUser!;
      const { storeId }  = req.params;

      const store = await prisma.store.findFirst({ where: { id: storeId, tenantId } });
      if (!store) return reply.code(403).send({ error: "Acesso negado." });

      const config = await prisma.storeMetaConfig.findUnique({ where: { storeId } });
      if (!config) return reply.code(404).send({ error: "Configuração não encontrada." });

      const start = Date.now();
      try {
        const token = decryptToken({
          enc: config.accessTokenEnc,
          iv:  config.accessTokenIv,
          tag: config.accessTokenTag,
        });
        const res = await fetch(
          `${META_API}/${config.adAccountId}?fields=id,name&access_token=${token}`
        );
        const latencyMs = Date.now() - start;
        if (!res.ok) {
          const body = await res.json() as { error?: { message?: string } };
          return reply.send({ ok: false, latencyMs, error: body.error?.message ?? "Erro Meta API" });
        }
        const data = await res.json() as { name?: string };
        return reply.send({ ok: true, latencyMs, accountName: data.name ?? config.adAccountId });
      } catch (err) {
        return reply.send({
          ok: false,
          latencyMs: Date.now() - start,
          error: err instanceof Error ? err.message : "Erro desconhecido",
        });
      }
    }
  );

  // ── GET /api/stores/meta-configs/all (Bearer WEBHOOK_SECRET) ──────────────
  // Usado pelo N8N para listar todas as lojas com config Meta e token descriptografado
  app.get(
    "/api/stores/meta-configs/all",
    async (req, reply) => {
      if (!requireWebhookSecret(req.headers.authorization)) {
        return reply.code(401).send({ error: "Não autorizado." });
      }
      if (!WEBHOOK_SECRET) {
        return reply.code(500).send({ error: "WEBHOOK_SECRET não configurado." });
      }

      const configs = await prisma.storeMetaConfig.findMany({
        where:   { syncEnabled: true },
        include: { store: { select: { externalId: true, tenantId: true, tenant: { select: { slug: true } } } } },
      });

      const result = configs.map((c) => {
        let accessToken: string | null = null;
        try {
          accessToken = decryptToken({ enc: c.accessTokenEnc, iv: c.accessTokenIv, tag: c.accessTokenTag });
        } catch {
          // token corrompido — skip
        }
        return {
          storeId:          c.storeId,
          storeExternalId:  c.store.externalId,
          tenantSlug:       c.store.tenant.slug,
          adAccountId:      c.adAccountId,
          pixelId:          c.pixelId,
          accessToken,
        };
      }).filter((c) => c.accessToken !== null);

      return reply.send(result);
    }
  );
}
