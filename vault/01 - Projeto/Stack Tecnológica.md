---
title: Stack Tecnológica
tags:
  - projeto
  - tecnologia
  - stack
---

# Stack Tecnológica

## Frontend

| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| React | 19 | UI framework |
| TypeScript | 5.9 | Tipagem estática |
| Vite | 8 | Build tool e dev server |
| Tailwind CSS | 3.4 | Estilização (dark theme via CSS vars) |
| Recharts | 3.8 | Gráficos (BarChart, LineChart) |
| Lucide React | — | Ícones |
| html2canvas + jsPDF | — | Export de PDF |
| clsx + tailwind-merge | — | Utilitários de className |

> [!note] Sem React Router
> A navegação é feita por máquina de estados no `App.tsx`:
> `type Page = "dashboard" | "stores" | "users" | "trackeamento"`

## Backend

| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| Fastify | 4 | Framework HTTP |
| TypeScript | 5 | Tipagem estática |
| Prisma | 5 | ORM |
| PostgreSQL | 16 | Banco de dados |
| jose | — | JWT (HS256, 7 dias) |
| @fastify/cors | — | CORS |
| @fastify/helmet | — | Headers de segurança |
| @fastify/rate-limit | — | Rate limiting |
| Resend | — | E-mail transacional (reset de senha) |
| tsx | — | Dev watch mode |

## Banco de Dados

- **PostgreSQL 16** — banco principal
- **Prisma ORM** — migrations, tipagem, client singleton
- **Raw SQL** via `$queryRaw` para agregações complexas (trend, stage-time)
- **Docker** para desenvolvimento local (`docker-compose.yml`)

## Infraestrutura

| Serviço | Plataforma | Detalhes |
|---------|-----------|---------|
| Frontend | Vercel | SPA mode — todas rotas → `index.html` |
| Backend | Railway | Dockerfile multi-stage, Node 20 Alpine |
| Banco | Railway PostgreSQL | Ou Docker local (porta 5432) |
| Automação | N8N | Self-hosted — workflow `N8N Finalizado.json` |
| E-mail | Resend | Reset de senha |
| CRM | Helena | Fonte dos eventos de lead |

## Decisões de Arquitetura

- [[Decisão - Event Sourcing nos Leads]]
- [[Decisão - Idempotência por SHA-256]]
- [[Decisão - Multi-tenant via Slug]]
- [[Decisão - Modo Dual no Frontend]]
