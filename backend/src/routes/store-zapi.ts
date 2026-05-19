import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { requireAdmin } from "../lib/require-auth.js";
import { encryptToken, decryptToken } from "../lib/crypto-vault.js";

interface ZapiConfigBody {
  instanceId: string;
  clientToken: string;        // plaintext — encriptado antes de salvar
  securityToken?: string;
  whatsappNumber: string;     // E.164, ex: +5541999998888
  syncEnabled?: boolean;
}

export async function storeZapiRoutes(app: FastifyInstance) {

  // GET /api/stores/:storeId/zapi-config
  app.get<{ Params: { storeId: string } }>(
    "/api/stores/:storeId/zapi-config",
    { preHandler: requireAdmin },
    async (request, reply) => {
      const config = await prisma.storeZapiConfig.findUnique({
        where:  { storeId: request.params.storeId },
        select: {
          id:            true,
          instanceId:    true,
          whatsappNumber: true,
          syncEnabled:   true,
          updatedAt:     true,
          // não expõe clientToken (encriptado)
        },
      });
      if (!config) return reply.code(404).send({ error: "Configuração não encontrada." });
      return reply.send(config);
    }
  );

  // PUT /api/stores/:storeId/zapi-config
  app.put<{ Params: { storeId: string }; Body: ZapiConfigBody }>(
    "/api/stores/:storeId/zapi-config",
    { preHandler: requireAdmin },
    async (request, reply) => {
      const { storeId } = request.params;
      const { instanceId, clientToken, securityToken, whatsappNumber, syncEnabled } = request.body;

      const enc = encryptToken(clientToken);

      const config = await prisma.storeZapiConfig.upsert({
        where:  { storeId },
        create: {
          storeId,
          instanceId,
          clientTokenEnc: enc.enc,
          clientTokenIv:  enc.iv,
          clientTokenTag: enc.tag,
          securityToken:  securityToken ?? null,
          whatsappNumber,
          syncEnabled:    syncEnabled ?? true,
        },
        update: {
          instanceId,
          clientTokenEnc: enc.enc,
          clientTokenIv:  enc.iv,
          clientTokenTag: enc.tag,
          securityToken:  securityToken ?? null,
          whatsappNumber,
          ...(syncEnabled !== undefined ? { syncEnabled } : {}),
        },
        select: { id: true, instanceId: true, whatsappNumber: true, syncEnabled: true, updatedAt: true },
      });

      return reply.code(200).send(config);
    }
  );
}
