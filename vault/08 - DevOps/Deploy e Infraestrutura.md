---
title: Deploy e Infraestrutura
tags:
  - devops
  - deploy
  - vercel
  - railway
aliases:
  - Deploy
  - Infraestrutura
---

# Deploy e Infraestrutura

## Frontend — Vercel

### Configuração

**Arquivo:** `vercel.json`
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

SPA mode: todas as rotas são redirecionadas para `index.html`.

### Deploy

- **Trigger:** Push para `main` → deploy automático
- **Build command:** `npm run build` (Vite)
- **Output directory:** `dist/`
- **Node version:** 20

### Variáveis de Ambiente (Vercel)

```
VITE_API_URL      = https://seu-backend.railway.app
VITE_TENANT_SLUG  = igui
VITE_USE_API      = true
```

---

## Backend — Railway

### Configuração

**Arquivo:** `backend/railway.toml`
**Dockerfile:** `backend/Dockerfile` (multi-stage, Node 20 Alpine)

```dockerfile
# Multi-stage build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3333
CMD ["node", "dist/server.js"]
```

### Deploy

- **Trigger:** Push para `main` → build Dockerfile
- **Porta exposta:** 3333
- **Health check:** `GET /health`

### Variáveis de Ambiente (Railway)

```
DATABASE_URL       = postgresql://...@railway.internal/railway
JWT_SECRET         = (gerar: openssl rand -base64 32)
WEBHOOK_SECRET     = (gerar: openssl rand -base64 32)
RESEND_API_KEY     = re_...
FRONTEND_URL       = https://seu-dashboard.vercel.app
FROM_EMAIL         = noreply@igui.com.br
PORT               = 3333
```

---

## Banco de Dados — Railway PostgreSQL

- Criado como plugin no projeto Railway
- `DATABASE_URL` injetada automaticamente
- Backups automáticos pelo Railway

### Primeira Instalação

```bash
# Após o deploy do backend
railway run npx prisma migrate deploy
railway run npx tsx src/seed.ts
```

---

## Desenvolvimento Local

Ver [[Docker e Banco Local]] para setup completo.

---

## Monitoramento

- **Backend health:** `GET /health` → `{ status: "ok", uptime: ... }`
- **Webhook health:** `GET /api/ingest/health`
- **Logs Railway:** Dashboard do Railway → Deployments → Logs
- **Logs Vercel:** Dashboard Vercel → Deployments → Functions
