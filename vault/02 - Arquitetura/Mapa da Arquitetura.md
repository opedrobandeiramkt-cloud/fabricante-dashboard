---
title: Mapa da Arquitetura
tags:
  - arquitetura
  - índice
aliases:
  - Arquitetura
---

# Mapa da Arquitetura

## Visão de Alto Nível

```mermaid
graph TB
    subgraph "CRM Helena"
        H[Helena CRM]
    end

    subgraph "Automação"
        N[N8N Workflow]
    end

    subgraph "Backend — Railway"
        API[Fastify API :3333]
        DB[(PostgreSQL)]
        API --> DB
    end

    subgraph "Frontend — Vercel"
        UI[React App]
    end

    subgraph "Serviços Externos"
        R[Resend — E-mail]
    end

    H -->|Webhook| N
    N -->|POST /api/ingest/event| API
    UI -->|HTTP + JWT| API
    API -->|SMTP via SDK| R
    R -->|E-mail| USER[Usuário]
```

## Camadas

| Camada | Tecnologia | Responsabilidade |
|--------|-----------|-----------------|
| Apresentação | React + Tailwind | UI, gráficos, formulários |
| Estado | React Context + hooks | Cache local, sincronização |
| HTTP Client | `src/lib/api.ts` | Todas as chamadas ao backend |
| API | Fastify routes | Validação, autorização, lógica |
| Domínio | Services internos | KPIs, funil, alertas, ingest |
| Persistência | Prisma + PostgreSQL | Armazenamento de dados |
| Infraestrutura | Railway + Vercel | Deploy, TLS, scaling |

## Notas Relacionadas

- [[Sistema de Autenticação]]
- [[Rotas da API]]
- [[Schema do Banco de Dados]]
- [[Componentes do Frontend]]
- [[Integração N8N e Helena CRM]]
