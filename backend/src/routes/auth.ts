import { type FastifyInstance } from "fastify";
import { randomBytes } from "crypto";
import { Resend } from "resend";
import { prisma } from "../lib/prisma.js";
import { hashPassword, verifyPassword } from "../lib/crypto.js";
import { signToken } from "../lib/jwt.js";
import { requireAdminOrFabricante } from "../lib/require-auth.js";

const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5173";
const FROM_EMAIL   = process.env.FROM_EMAIL    ?? "noreply@igui.com.br";
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function userToDto(user: { id: string; name: string; email: string; role: string; storeIds: unknown; avatarInitials: string; salesGoal?: number | null; crmUserId?: string | null }) {
  return {
    id:             user.id,
    name:           user.name,
    email:          user.email,
    role:           user.role as "admin" | "fabricante" | "vendedor",
    storeIds:       (user.storeIds as string[]) ?? [],
    avatarInitials: user.avatarInitials,
    salesGoal:      user.salesGoal ?? null,
    crmUserId:      user.crmUserId ?? null,
  };
}

export async function authRoutes(app: FastifyInstance) {

  // POST /api/auth/login ──────────────────────────────────────────────────────
  app.post("/api/auth/login", {
    config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
  }, async (req, reply) => {
    const { email, password } = req.body as { email?: string; password?: string };
    const tenantSlug = req.headers["x-tenant-slug"] as string;

    if (!email || !password || !tenantSlug) {
      return reply.code(400).send({ error: "Dados inválidos." });
    }

    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) return reply.code(404).send({ error: "Tenant não encontrado." });

    const user = await prisma.user.findFirst({
      where: { tenantId: tenant.id, email: email.toLowerCase().trim() },
    });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return reply.code(401).send({ error: "E-mail ou senha incorretos." });
    }

    const token = await signToken({
      sub:        user.id,
      tenantId:   tenant.id,
      tenantSlug: tenant.slug,
      role:       user.role,
      storeIds:   (user.storeIds as string[]) ?? [],
    });

    return reply.send({ user: userToDto(user), token });
  });

  // GET /api/auth/users ───────────────────────────────────────────────────────
  app.get("/api/auth/users", {
    preHandler: requireAdminOrFabricante,
  }, async (req, reply) => {
    const { tenantId, role, storeIds } = req.jwtUser!;

    const allUsers = await prisma.user.findMany({
      where:   { tenantId },
      orderBy: { createdAt: "asc" },
    });

    const users = role === "fabricante"
      ? allUsers.filter((u) =>
          (u.storeIds as string[]).some((id) => storeIds.includes(id))
        )
      : allUsers;

    return reply.send(users.map(userToDto));
  });

  // POST /api/auth/users ──────────────────────────────────────────────────────
  app.post("/api/auth/users", {
    preHandler: requireAdminOrFabricante,
  }, async (req, reply) => {
    const { tenantId, role } = req.jwtUser!;
    const body = req.body as { name?: string; email?: string; password?: string; role?: string; storeIds?: string[]; salesGoal?: number; crmUserId?: string };

    if (role === "fabricante" && body.role !== "vendedor") {
      return reply.code(403).send({ error: "Fabricante só pode criar vendedores." });
    }

    if (!body.name || !body.email || !body.password || !body.role) {
      return reply.code(400).send({ error: "Campos obrigatórios: name, email, password, role." });
    }

    const exists = await prisma.user.findFirst({
      where: { tenantId, email: body.email.toLowerCase().trim() },
    });
    if (exists) return reply.code(409).send({ error: "E-mail já cadastrado." });

    const avatarInitials = body.name.split(" ").slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? "").join("");
    const passwordHash   = await hashPassword(body.password);

    const user = await prisma.user.create({
      data: {
        tenantId,
        email:          body.email.toLowerCase().trim(),
        passwordHash,
        name:           body.name,
        role:           body.role,
        storeIds:       body.role === "admin" ? [] : (body.storeIds ?? []),
        avatarInitials,
        salesGoal:      body.salesGoal ?? null,
        crmUserId:      body.crmUserId?.toLowerCase().trim() ?? null,
      },
    });

    return reply.code(201).send({ user: userToDto(user) });
  });

  // PUT /api/auth/users/:id ───────────────────────────────────────────────────
  app.put<{ Params: { id: string } }>("/api/auth/users/:id", {
    preHandler: requireAdminOrFabricante,
  }, async (req, reply) => {
    const { tenantId, role, storeIds } = req.jwtUser!;
    const { id } = req.params;
    const body   = req.body as { name?: string; email?: string; password?: string; role?: string; storeIds?: string[]; salesGoal?: number; crmUserId?: string };

    const existing = await prisma.user.findFirst({ where: { id, tenantId } });
    if (!existing) return reply.code(404).send({ error: "Usuário não encontrado." });

    if (role === "fabricante") {
      if (existing.role !== "vendedor") return reply.code(403).send({ error: "Acesso negado." });
      const sharedStore = (existing.storeIds as string[]).some((s) => storeIds.includes(s));
      if (!sharedStore) return reply.code(403).send({ error: "Acesso negado." });
    }

    const avatarInitials = body.name
      ? body.name.split(" ").slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? "").join("")
      : existing.avatarInitials;

    const updateData: Record<string, unknown> = {
      name:           body.name  ?? existing.name,
      email:          body.email ? body.email.toLowerCase().trim() : existing.email,
      role:           body.role  ?? existing.role,
      storeIds:       body.role === "admin" ? [] : (body.storeIds ?? existing.storeIds),
      avatarInitials,
      salesGoal:      body.salesGoal !== undefined ? (body.salesGoal ?? null) : existing.salesGoal,
      crmUserId:      body.crmUserId !== undefined ? (body.crmUserId?.toLowerCase().trim() ?? null) : existing.crmUserId,
    };

    if (body.password) {
      updateData.passwordHash = await hashPassword(body.password);
    }

    const user = await prisma.user.update({ where: { id }, data: updateData });
    return reply.send({ user: userToDto(user) });
  });

  // DELETE /api/auth/users/:id ────────────────────────────────────────────────
  app.delete<{ Params: { id: string } }>("/api/auth/users/:id", {
    preHandler: requireAdminOrFabricante,
  }, async (req, reply) => {
    const { tenantId, role, storeIds } = req.jwtUser!;
    const { id } = req.params;

    const existing = await prisma.user.findFirst({ where: { id, tenantId } });
    if (!existing) return reply.code(404).send({ error: "Usuário não encontrado." });

    if (role === "fabricante") {
      if (existing.role !== "vendedor") return reply.code(403).send({ error: "Acesso negado." });
      const sharedStore = (existing.storeIds as string[]).some((s) => storeIds.includes(s));
      if (!sharedStore) return reply.code(403).send({ error: "Acesso negado." });
    }

    if (existing.role === "admin") {
      const adminCount = await prisma.user.count({ where: { tenantId, role: "admin" } });
      if (adminCount <= 1) return reply.code(400).send({ error: "Não é possível remover o único admin." });
    }

    await prisma.user.delete({ where: { id } });
    return reply.code(200).send({ ok: true });
  });

  // POST /api/auth/forgot-password ────────────────────────────────────────────
  app.post("/api/auth/forgot-password", {
    config: { rateLimit: { max: 3, timeWindow: "5 minutes" } },
  }, async (req, reply) => {
    const { email } = req.body as { email?: string };

    if (!email || !email.includes("@")) {
      return reply.code(200).send({ ok: true });
    }

    const normalizedEmail = email.toLowerCase().trim();

    await prisma.passwordResetToken.updateMany({
      where: { email: normalizedEmail, usedAt: null },
      data:  { usedAt: new Date() },
    });

    const token     = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    await prisma.passwordResetToken.create({
      data: { email: normalizedEmail, token, expiresAt },
    });

    const resetLink = `${FRONTEND_URL}?reset=${token}`;

    try {
      const resend = getResend();
      if (!resend) {
        app.log.warn("RESEND_API_KEY não configurada — e-mail de reset não enviado");
        return reply.code(200).send({ ok: true });
      }
      await resend.emails.send({
        from:    FROM_EMAIL,
        to:      normalizedEmail,
        subject: "Redefinir senha — Dashboard iGUi",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
            <h2 style="margin:0 0 8px;font-size:20px;color:#111">Redefinir sua senha</h2>
            <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.5">
              Recebemos uma solicitação para redefinir a senha da sua conta no
              <strong>Dashboard iGUi</strong>. Clique no botão abaixo para criar uma nova senha.
            </p>
            <a href="${resetLink}"
               style="display:inline-block;padding:12px 28px;background:#d4a820;color:#000;font-weight:700;
                      border-radius:8px;text-decoration:none;font-size:15px">
              Redefinir senha
            </a>
            <p style="margin:24px 0 0;color:#999;font-size:13px">
              Este link expira em <strong>1 hora</strong>. Se você não solicitou a redefinição,
              ignore este e-mail.
            </p>
          </div>
        `,
      });
    } catch (err) {
      app.log.error(err, "Falha ao enviar email de reset");
    }

    return reply.code(200).send({ ok: true });
  });

  // POST /api/auth/reset-password ─────────────────────────────────────────────
  app.post("/api/auth/reset-password", async (req, reply) => {
    const { token, newPassword } = req.body as { token?: string; newPassword?: string };

    if (!token || !newPassword || newPassword.length < 6) {
      return reply.code(400).send({ error: "Dados inválidos." });
    }

    const record = await prisma.passwordResetToken.findUnique({ where: { token } });

    if (!record)                       return reply.code(400).send({ error: "Link inválido." });
    if (record.usedAt)                 return reply.code(400).send({ error: "Link já utilizado." });
    if (record.expiresAt < new Date()) return reply.code(400).send({ error: "Link expirado. Solicite um novo." });

    await prisma.passwordResetToken.update({
      where: { token },
      data:  { usedAt: new Date() },
    });

    const user = await prisma.user.findFirst({ where: { email: record.email } });
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data:  { passwordHash: await hashPassword(newPassword) },
      });
    }

    return reply.code(200).send({ ok: true, email: record.email });
  });
}
