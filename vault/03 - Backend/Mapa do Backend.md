---
title: Mapa do Backend
tags:
  - backend
  - índice
aliases:
  - Backend
---

# Mapa do Backend

## Estrutura de Arquivos

```
backend/src/
├── server.ts          # Bootstrap, plugins, registro de rotas
├── seed.ts            # Seed: tenant, etapas do funil, admin
├── routes/
│   ├── auth.ts        # Login, CRUD de usuários, reset de senha
│   ├── dashboard.ts   # KPIs, funil, trend, ranking, leads, goal
│   ├── ingest.ts      # Webhook de eventos do CRM
│   ├── quotes.ts      # CRUD de orçamentos + won/lost
│   └── stores.ts      # CRUD de lojas (admin only)
└── lib/
    ├── jwt.ts         # jose HS256 sign/verify, 7 dias
    ├── crypto.ts      # scrypt hash de senha, SHA-256 idempotência
    ├── require-auth.ts # Fastify preHandlers de auth/role
    ├── date-ranges.ts  # Período → {start, end}, cálculo de período anterior
    └── prisma.ts      # Prisma client singleton
```

## Rotas por Módulo

- [[Rotas de Autenticação]]
- [[Rotas do Dashboard]]
- [[Rota de Ingest]]
- [[Rotas de Orçamentos]]
- [[Rotas de Lojas]]

## Sistema de Autenticação

- [[Sistema de Autenticação]]
- [[Sistema de Permissões por Role]]

## Middleware e Segurança

| Plugin | Função |
|--------|--------|
| `@fastify/cors` | Controla origens permitidas via `FRONTEND_URL` |
| `@fastify/helmet` | Headers de segurança HTTP |
| `@fastify/rate-limit` | Proteção contra abuso |
| `requireAuth` | Valida JWT e injeta `request.user` |
| `requireAdmin` | Bloqueia non-admins |
| `requireAdminOrLojista` | Permite admin + lojista |
| `requireAdminOrFabricante` | Permite admin + fabricante |

## Servidor

- **Porta:** `3333` (ou env `PORT`)
- **Health check:** `GET /health`
- **Prefixo das rotas:** `/api/*`
