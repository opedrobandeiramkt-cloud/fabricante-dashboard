---
title: Rotas da API
tags:
  - backend
  - api
  - rotas
aliases:
  - API
  - Endpoints
---

# Rotas da API

## Autenticação (`/api/auth/*`)

| Método | Caminho | Auth | Descrição |
|--------|---------|------|-----------|
| POST | `/api/auth/login` | Nenhuma | Login — retorna JWT + user DTO |
| GET | `/api/auth/users` | admin \| lojista | Lista usuários |
| POST | `/api/auth/users` | admin \| lojista | Cria usuário |
| PUT | `/api/auth/users/:id` | admin \| lojista | Atualiza usuário |
| DELETE | `/api/auth/users/:id` | admin \| lojista | Remove usuário |
| POST | `/api/auth/forgot-password` | Nenhuma | Envia e-mail de reset |
| POST | `/api/auth/reset-password` | Nenhuma | Valida token e troca senha |

## Dashboard (`/api/dashboard/*`) — todos requerem JWT

| Método | Caminho | Descrição |
|--------|---------|-----------|
| GET | `/api/dashboard/kpis` | 7 KPIs com deltas de período |
| GET | `/api/dashboard/funnel` | Contagem por etapa + taxas de conversão |
| GET | `/api/dashboard/trend` | Série temporal leads + vendas (dia/semana/mês) |
| GET | `/api/dashboard/ranking` | Ranking de lojas por conversão |
| GET | `/api/dashboard/stage-time` | Tempo médio por etapa + flag gargalo |
| GET | `/api/dashboard/leads` | Lista paginada de leads (50/página) |
| PATCH | `/api/dashboard/leads/:id/origem` | Sobrescreve origem manualmente |
| GET | `/api/dashboard/stores` | Lista lojas acessíveis ao usuário |
| GET | `/api/dashboard/goal` | Progresso da meta mensal do vendedor |

## Orçamentos (`/api/quotes/*`) — JWT obrigatório

| Método | Caminho | Descrição |
|--------|---------|-----------|
| GET | `/api/quotes` | Lista orçamentos (escopo por role) |
| POST | `/api/quotes` | Cria orçamento |
| PUT | `/api/quotes/:id` | Atualiza orçamento (bloqueado se ganho) |
| PATCH | `/api/quotes/:id/won` | Marca como ganho |
| PATCH | `/api/quotes/:id/lost` | Marca como perdido |

## Lojas (`/api/stores/*`) — somente admin

| Método | Caminho | Descrição |
|--------|---------|-----------|
| POST | `/api/stores` | Cria loja (com storeType) |
| PUT | `/api/stores/:id` | Atualiza loja |
| DELETE | `/api/stores/:id` | Remove loja |

## Webhook Ingest (`/api/ingest/*`) — Bearer WEBHOOK_SECRET

| Método | Caminho | Descrição |
|--------|---------|-----------|
| POST | `/api/ingest/event` | Ingere evento do CRM (idempotente) |
| GET | `/api/ingest/health` | Health check do webhook |

## Misc

| Método | Caminho | Descrição |
|--------|---------|-----------|
| GET | `/health` | Status do servidor |

---

## Parâmetros de Query Comuns

### `/api/dashboard/*`
```
period    = "7d" | "30d" | "90d" | "custom"
startDate = ISO 8601 (para period=custom)
endDate   = ISO 8601 (para period=custom)
storeId   = UUID (filtra por loja específica)
```

### `/api/dashboard/leads`
```
page     = número da página (padrão: 1)
pageSize = tamanho da página (padrão: 50)
storeId  = UUID (filtro opcional)
```
