# CLAUDE.md — fabricante-dashboard

## Project Overview

Multi-tenant SaaS CRM dashboard for franchise networks (primary use case: iGUi Piscinas pool distributors). It visualizes sales-funnel KPIs per store, ingests lead-lifecycle events via webhook, and supports role-based access for admins and franchise owners ("fabricantes").

---

## Repository Structure

```
fabricante-dashboard/
├── src/                        # React + TypeScript frontend (Vite)
│   ├── components/
│   │   ├── auth/               # LoginPage
│   │   ├── dashboard/          # KPICards, FunnelChart, TrendChart, StageTimeChart, StoreFilter, StoreRanking
│   │   ├── stores/             # StoresPage, StoreFormModal
│   │   └── users/              # UsersPage, UserFormModal
│   ├── contexts/               # AuthContext, StoresContext, UsersContext
│   ├── hooks/                  # useDashboard, useStores, useUsers
│   ├── lib/                    # types, api, constants, mock-data, export-pdf, alerts, auth-types
│   ├── assets/                 # Logo, images
│   ├── App.tsx                 # Routing + layout
│   ├── main.tsx                # Entry point with provider nesting
│   └── index.css               # Tailwind base + CSS theme variables
├── backend/                    # Node.js + Fastify API
│   ├── src/
│   │   ├── routes/             # ingest.ts, dashboard.ts
│   │   ├── lib/                # prisma.ts, date-ranges.ts, crypto.ts
│   │   ├── server.ts           # Fastify setup (CORS, Helmet, routes)
│   │   └── seed.ts             # DB initialization script
│   └── prisma/
│       └── schema.prisma       # PostgreSQL schema
├── public/                     # Static assets
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.app.json
├── eslint.config.js
├── vercel.json                 # Vercel SPA deployment
└── docker-compose.yml          # PostgreSQL 16
```

---

## Tech Stack

### Frontend
| Layer | Tool |
|-------|------|
| Framework | React 19 + TypeScript 5.9 |
| Build | Vite 8 |
| Styling | Tailwind CSS 3.4 + PostCSS |
| Charts | Recharts 3 |
| Icons | Lucide React |
| Utilities | clsx, tailwind-merge |
| Linting | ESLint 9 (typescript-eslint, react-hooks, react-refresh) |

### Backend
| Layer | Tool |
|-------|------|
| Framework | Fastify 4 |
| ORM | Prisma 5 |
| Database | PostgreSQL 16 |
| Security | @fastify/helmet, @fastify/cors |
| Logging | Pino (pino-pretty in dev) |
| Runtime | Node.js 18+, TypeScript 5.4 |

---

## Development Workflow

### Prerequisites
- Node.js 18+
- Docker (for PostgreSQL)

### Frontend
```bash
npm install
npm run dev          # Vite dev server on :5173
npm run build        # tsc + vite build
npm run lint         # ESLint
npm run preview      # Preview production build
```

### Backend
```bash
cd backend
npm install
docker-compose up -d           # Start PostgreSQL on :5432
npm run db:push                # Sync Prisma schema to DB
npm run db:seed                # Seed tenant, stores, funnel stages
npm run dev                    # tsx watch on :3333
npm run studio                 # Prisma Studio GUI
```

### Environment Variables

**Frontend (`.env` / `.env.local`):**
```
VITE_API_URL=http://localhost:3333
VITE_TENANT_SLUG=igui
VITE_USE_API=false   # Set to "true" to hit real backend; "false" uses mock data
```

**Backend (`.env`):**
```
DATABASE_URL=postgresql://user:password@localhost:5432/fabricante
WEBHOOK_SECRET=<bearer-token>
PORT=3333
HOST=0.0.0.0
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

---

## Key Conventions

### Mock Data vs Real API
- `VITE_USE_API=false` (default) — full UI works with in-memory mock data, no backend needed.
- `VITE_USE_API=true` — all hooks call the real Fastify backend.
- The toggle is in `src/lib/api.ts`. When adding a new endpoint, provide both a mock path and a real API path.

### Path Alias
- `@/*` resolves to `src/*` in both Vite and TypeScript configs.

### Styling
- Use **Tailwind utility classes** exclusively. Do not write raw CSS outside `index.css`.
- Color tokens are CSS variables (`--color-primary`, `--color-danger`, etc.) mapped to Tailwind via `tailwind.config.js`. Prefer semantic tokens over arbitrary Tailwind colors.
- Theme variables live in `src/index.css` under `:root`.

### Component Conventions
- One component per file.
- Props typed inline (no separate `Props` type file for simple components).
- Dashboard charts receive pre-processed data from hooks — no data fetching inside chart components.

### State Management
- React Context API only (no Redux/Zustand).
- Contexts live in `src/contexts/`. Each context exports a custom hook (e.g., `useAuth`).
- Dashboard data fetching is in `src/hooks/useDashboard.ts` with 30-second auto-polling.
- Stores and users are persisted to `localStorage` via their contexts.

### Authentication & Roles
- Auth is entirely frontend mock (no auth backend).
- Two roles: `admin` (full access) and `fabricante` (limited to assigned stores).
- Session stored in `sessionStorage`.
- To add protected features, check `useAuth().isAdmin`.

---

## API Reference

### Webhook Ingest
```
POST /api/ingest/event
Authorization: Bearer <WEBHOOK_SECRET>
Body: {
  event_id: string,        // idempotency key
  tenant_slug: string,
  store_external_id: string,
  lead_external_id: string,
  to_stage: string,        // one of the 10 funnel stage slugs
  occurred_at: string,     // ISO 8601
  metadata?: object
}
```
Returns `201` (created) or `200` (duplicate idempotent).

### Dashboard Endpoints
All require `?period=7d|30d|90d|12m` and optional `&storeIds=id1,id2`.

| Endpoint | Returns |
|----------|---------|
| `GET /api/dashboard/kpis` | totalLeads, conversion%, wonDeals, avgCycleDays, revenue, avgTicket (with period deltas) |
| `GET /api/dashboard/funnel` | Stage counts, conversion rates, bottleneck detection |
| `GET /api/dashboard/trend` | Time-series (day/week/month) leads and vendas |
| `GET /api/dashboard/ranking` | Store ranking: leads, conversion, wonDeals, revenue, avgTicket |
| `GET /api/dashboard/stores` | Available stores list (id, name, city, state, externalId) |
| `GET /health` | Health check |

---

## Database Schema (Prisma)

**Core models:**
- `Tenant` — top-level multi-tenant isolation
- `Store` — individual franchise location (belongs to Tenant)
- `FunnelStage` — ordered pipeline stages (10 stages)
- `Lead` — CRM lead record
- `LeadEvent` — event-sourced stage transitions (with idempotency key)
- `FailedEvent` — dead-letter queue for failed webhook ingestions

**Event sourcing:** All lead stage transitions are stored as immutable `LeadEvent` records. Dashboard queries aggregate from events, not from a mutable `Lead.currentStage` field.

---

## Sales Funnel Stages (in order)

| # | Slug | Label |
|---|------|-------|
| 1 | `lead_capturado` | Lead Capturado |
| 2 | `visita_agendada` | Visita Técnica Agendada |
| 3 | `visita_realizada` | Visita Realizada |
| 4 | `projeto_3d` | Elaboração de Projeto 3D |
| 5 | `orcamento_enviado` | Orçamento Enviado |
| 6 | `em_negociacao` | Em Negociação |
| 7 | `contrato_enviado` | Contrato Enviado |
| 8 | `aguardando_pagamento` | Aguardando Pagamento |
| 9 | `pagamento_aprovado` | Pagamento Aprovado (**won**) |
| 10 | `venda_perdida` | Venda Perdida (**lost**) |

---

## Known Gaps / TODOs

- **No test suite** — neither Vitest nor Jest is configured. When adding tests, use Vitest (consistent with Vite).
- **No CI/CD** — only Vercel auto-deploy for the frontend. A GitHub Actions workflow for lint + build is recommended.
- **Revenue / avgTicket** — currently hardcoded to `0` in both mock data and API. Not yet implemented.
- **Backend authentication** — the dashboard API has no auth layer. Production use requires JWT or session validation.
- **Stage time chart** — data is currently derived/approximated from funnel data, not computed from actual event timestamps.

---

## Deployment

### Frontend (Vercel)
Configured via `vercel.json`: builds with `npm run build`, serves from `dist/`, all routes rewritten to `index.html` for SPA routing.

### Backend
No cloud deployment config included. Runs on any Node.js 18+ host. Requires `DATABASE_URL` pointing to a live PostgreSQL instance.

### Docker (local dev only)
```bash
docker-compose up -d   # Starts postgres:16-alpine on localhost:5432
```

---

## Mock Users (Development)

| Email | Password | Role | Access |
|-------|----------|------|--------|
| `admin@igui.com.br` | `admin2024` | admin | All stores + user management |
| `sp@igui.com.br` | (see mock-users.ts) | fabricante | São Paulo stores |
| `pr@igui.com.br` | (see mock-users.ts) | fabricante | Paraná stores |
| `mg@igui.com.br` | (see mock-users.ts) | fabricante | Minas Gerais stores |
| `rj@igui.com.br` | (see mock-users.ts) | fabricante | Rio de Janeiro stores |

Passwords for fabricante users are stored in `src/lib/mock-users.ts`. User data is also persisted to `localStorage` after first login.
