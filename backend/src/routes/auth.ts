import { type FastifyInstance } from "fastify";
import { randomBytes } from "crypto";
import { Resend } from "resend";
import { prisma } from "../lib/prisma.js";

const resend      = new Resend(process.env.RESEND_API_KEY);
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5173";
const FROM_EMAIL   = process.env.FROM_EMAIL    ?? "noreply@igui.com.br";
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

export async function authRoutes(app: FastifyInstance) {

  // POST /api/auth/forgot-password
  app.post("/api/auth/forgot-password", async (req, reply) => {
    const { email } = req.body as { email?: string };

    // Sempre retorna 200 para não revelar se o email existe
    if (!email || !email.includes("@")) {
      return reply.code(200).send({ ok: true });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Invalida tokens anteriores deste email
    await prisma.passwordResetToken.updateMany({
      where: { email: normalizedEmail, usedAt: null },
      data:  { usedAt: new Date() },
    });

    // Cria novo token
    const token     = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    await prisma.passwordResetToken.create({
      data: { email: normalizedEmail, token, expiresAt },
    });

    const resetLink = `${FRONTEND_URL}?reset=${token}`;

    try {
      await resend.emails.send({
        from:    FROM_EMAIL,
        to:      normalizedEmail,
        subject: "Redefinir senha — Dashboard iGUi",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
            <img src="https://fabricante-dashboard.vercel.app/logo.svg" alt="iGUi" height="40" style="margin-bottom:24px" />
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
              ignore este e-mail — sua senha permanece a mesma.
            </p>
          </div>
        `,
      });
    } catch (err) {
      app.log.error(err, "Falha ao enviar email de reset");
    }

    return reply.code(200).send({ ok: true });
  });

  // POST /api/auth/reset-password
  app.post("/api/auth/reset-password", async (req, reply) => {
    const { token, newPassword } = req.body as { token?: string; newPassword?: string };

    if (!token || !newPassword || newPassword.length < 6) {
      return reply.code(400).send({ error: "Dados inválidos." });
    }

    const record = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!record)                              return reply.code(400).send({ error: "Link inválido." });
    if (record.usedAt)                        return reply.code(400).send({ error: "Link já utilizado." });
    if (record.expiresAt < new Date())        return reply.code(400).send({ error: "Link expirado. Solicite um novo." });

    // Marca token como usado
    await prisma.passwordResetToken.update({
      where: { token },
      data:  { usedAt: new Date() },
    });

    // Retorna o email para o frontend atualizar o localStorage
    return reply.code(200).send({ ok: true, email: record.email });
  });
}
