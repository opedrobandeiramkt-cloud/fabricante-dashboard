import type { FastifyRequest, FastifyReply } from "fastify";
import { verifyToken, type JwtPayload } from "./jwt.js";

declare module "fastify" {
  interface FastifyRequest {
    jwtUser?: JwtPayload;
  }
}

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const auth = request.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return void reply.code(401).send({ error: "Token de autenticação obrigatório." });
  }
  try {
    request.jwtUser = await verifyToken(auth.slice(7));
  } catch {
    return void reply.code(401).send({ error: "Token inválido ou expirado." });
  }
}

export async function requireAdminOrFabricante(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  await requireAuth(request, reply);
  if (reply.sent) return;
  const { role } = request.jwtUser!;
  if (role !== "admin" && role !== "fabricante") {
    return void reply.code(403).send({ error: "Acesso negado." });
  }
}

export async function requireAdminOrLojista(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  await requireAuth(request, reply);
  if (reply.sent) return;
  const { role } = request.jwtUser!;
  if (role !== "admin" && role !== "lojista") {
    return void reply.code(403).send({ error: "Acesso negado." });
  }
}

export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  await requireAuth(request, reply);
  if (reply.sent) return;
  if (request.jwtUser!.role !== "admin") {
    return void reply.code(403).send({ error: "Acesso negado." });
  }
}
