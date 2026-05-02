---
title: Mapa de DevOps
tags:
  - devops
  - índice
  - deploy
  - infraestrutura
aliases:
  - DevOps
  - Infraestrutura
---

# Mapa de DevOps

## Notas de DevOps

- [[Deploy e Infraestrutura]]
- [[Variáveis de Ambiente]]
- [[Comandos Úteis]]
- [[Docker e Banco Local]]

## Ambientes

| Ambiente | Frontend | Backend | Banco |
|---------|---------|---------|-------|
| Produção | Vercel | Railway | Railway PostgreSQL |
| Desenvolvimento | localhost:5173 | localhost:3333 | Docker localhost:5432 |

## Pipelines

| Serviço | Trigger | Ação |
|---------|---------|------|
| Vercel | Push para `main` | Build + Deploy frontend |
| Railway | Push para `main` | Build Dockerfile + Deploy |

## Diagrama de Infraestrutura

```mermaid
graph TB
    subgraph "Usuário"
        B[Browser]
    end

    subgraph "Vercel (CDN Global)"
        FE[React SPA]
    end

    subgraph "Railway"
        BE[Fastify API :3333]
        DB[(PostgreSQL 16)]
        BE --- DB
    end

    subgraph "Externo"
        N[N8N Self-hosted]
        H[Helena CRM]
        R[Resend Email]
    end

    B --> FE
    FE -->|HTTPS + JWT| BE
    H -->|Webhook| N
    N -->|Bearer Token| BE
    BE -->|SDK| R
```
