---
title: Variáveis de Ambiente
tags:
  - devops
  - configuração
  - segurança
  - ambiente
aliases:
  - .env
  - Env Vars
---

# Variáveis de Ambiente

> [!warning] Segurança
> Nunca commite arquivos `.env` ou valores reais de secrets no repositório.

## Backend (Railway)

| Variável | Obrigatória | Padrão | Descrição |
|---------|------------|--------|-----------|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | — | Mínimo 32 chars para HS256 |
| `WEBHOOK_SECRET` | ✅ | — | Bearer token N8N → ingest |
| `RESEND_API_KEY` | ✅ | — | API key do Resend |
| `FRONTEND_URL` | ✅ | — | CORS origins (vírgula para múltiplos) |
| `FROM_EMAIL` | ❌ | `noreply@igui.com.br` | Remetente dos e-mails |
| `ADMIN_EMAIL` | ❌ | `admin@igui.com.br` | E-mail do admin no seed |
| `ADMIN_PASSWORD` | ❌ | `admin2024` | Senha do admin no seed |
| `ADMIN_NAME` | ❌ | `Administrador` | Nome do admin no seed |
| `PORT` | ❌ | `3333` | Porta do servidor |

## Frontend (Vercel)

| Variável | Obrigatória | Padrão | Descrição |
|---------|------------|--------|-----------|
| `VITE_API_URL` | ✅ | `http://localhost:3333` | URL base do backend |
| `VITE_TENANT_SLUG` | ✅ | `igui` | Identificador do tenant |
| `VITE_USE_API` | ❌ | `false` | `"true"` = API real, `"false"` = mock |

## Gerando Secrets Seguros

```bash
# JWT_SECRET (mínimo 32 chars)
openssl rand -base64 32

# WEBHOOK_SECRET
openssl rand -base64 32

# Ou via Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Desenvolvimento Local

Criar `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/igui_dashboard"
JWT_SECRET="dev-secret-mude-em-producao-32chars"
WEBHOOK_SECRET="dev-webhook-secret-mude-em-producao"
RESEND_API_KEY="re_sua_chave_aqui"
FRONTEND_URL="http://localhost:5173"
FROM_EMAIL="noreply@igui.com.br"
PORT=3333
```

Criar `.env` (frontend):
```env
VITE_API_URL="http://localhost:3333"
VITE_TENANT_SLUG="igui"
VITE_USE_API="true"
```
