---
title: Integração Resend
tags:
  - integrações
  - resend
  - email
  - reset-senha
---

# Integração Resend

## Uso

Serviço de e-mail transacional usado exclusivamente para **reset de senha**.

## Variáveis de Ambiente

```
RESEND_API_KEY   # Chave de API do Resend
FROM_EMAIL       # Remetente (padrão: noreply@igui.com.br)
FRONTEND_URL     # URL do frontend (usado no link de reset)
```

## Fluxo de Reset de Senha

1. Usuário clica em "Esqueci minha senha" no login
2. Frontend faz `POST /api/auth/forgot-password { email }`
3. Backend:
   - Gera token aleatório `hex(32)` com expiração de 1 hora
   - Salva em `PasswordResetToken`
   - Envia e-mail via Resend com link: `{FRONTEND_URL}/reset-password?token=...`
4. Usuário clica no link → abre `ResetPasswordPage`
5. Usuário digita nova senha → `POST /api/auth/reset-password { token, newPassword }`
6. Backend valida token (não expirado, não usado) → atualiza senha

## Template de E-mail

E-mail enviado em texto simples (sem HTML template):
```
Assunto: Redefinição de Senha — Dashboard iGUi

Clique no link abaixo para redefinir sua senha:
{FRONTEND_URL}/reset-password?token={token}

Este link expira em 1 hora.
```

## Desenvolvimento Local

Para testar e-mails localmente, você pode:
1. Usar o Resend em modo de desenvolvimento (domínio `@resend.dev`)
2. Ou verificar o token diretamente no banco via `prisma studio`
