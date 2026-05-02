# CLAUDE.md — Dashboard Fabricante iGUi

## Idioma

**Sempre responda em português brasileiro.** Toda comunicação, comentários de código, mensagens de commit, documentação e saídas de terminal devem estar em pt-BR.

---

## Visão Geral do Projeto

Dashboard SaaS de inteligência comercial para a **iGUi Piscinas** — fabricante de piscinas com rede de franquias. Rastreia leads no funil de vendas, visualiza KPIs e gera orçamentos em PDF.

**Stack:**
- Frontend: React 19 + TypeScript + Vite + Tailwind CSS + Recharts
- Backend: Fastify 4 + TypeScript + Prisma 5
- Banco: PostgreSQL 16
- Deploy: Vercel (frontend) + Railway (backend)
- Automação: N8N → webhook → ingest endpoint

---

## Estrutura de Pastas

```
src/
  components/
    auth/          # Login, forgot/reset password
    dashboard/     # KPIs, funil, tendência, ranking, alertas
    stores/        # Gestão de lojas
    users/         # Gestão de usuários
    trackeamento/  # Lista de leads com paginação
    orcamentos/    # Orçamentos + templates PDF
  contexts/        # AuthContext, StoresContext, UsersContext, OrcamentosContext
  hooks/           # useDashboard, useLeads, useStores, useUsers
  lib/
    api.ts         # Todas as chamadas HTTP
    types.ts       # Tipos TypeScript compartilhados
    auth-types.ts  # AppUser, UserRole, AuthState
    constants.ts   # FUNNEL_STAGES, STORES, PERIOD_LABELS
    pool-data.ts   # Catálogo de piscinas e preços
    alerts.ts      # Lógica de alertas automáticos
backend/
  src/
    routes/        # auth, dashboard, ingest, quotes, stores
    lib/           # jwt, crypto, require-auth, date-ranges, prisma
  prisma/
    schema.prisma  # Schema completo do banco
vault/             # Segundo cérebro Obsidian (este vault)
```

---

## Roles de Usuário

| Role | Acesso |
|------|--------|
| `admin` | Tudo, todos os tenants |
| `fabricante` | Lojas atribuídas |
| `lojista` | Suas lojas + gestão de vendedores |
| `vendedor` | Apenas seus leads e orçamentos |
| `analista_crm` | Leitura do Trackeamento |

---

## Variáveis de Ambiente

**Backend (Railway):**
```
DATABASE_URL        # PostgreSQL connection string
JWT_SECRET          # Mínimo 32 chars para HS256
WEBHOOK_SECRET      # Token Bearer para N8N → ingest
RESEND_API_KEY      # API de e-mail transacional
FRONTEND_URL        # CORS origins separados por vírgula
FROM_EMAIL          # Remetente (padrão: noreply@igui.com.br)
PORT                # Porta do servidor (padrão: 3333)
```

**Frontend (Vercel):**
```
VITE_API_URL        # URL base do backend
VITE_TENANT_SLUG    # Identificador do tenant (padrão: igui)
VITE_USE_API        # "true" = backend real, "false" = mock data
```

---

## Padrões de Desenvolvimento

### Commits
Formato convencional em português:
```
feat: adiciona filtro por período no dashboard
fix: corrige cálculo de taxa de conversão
refactor: extrai lógica de alertas para hook separado
docs: atualiza documentação da API de ingest
```

### Código
- Sem comentários óbvios — apenas WHY, nunca WHAT
- Funções < 50 linhas
- Arquivos < 800 linhas
- Sem `console.log` em produção
- Tratar erros explicitamente nas boundaries (input do usuário, APIs externas)

### Modo Dual
O frontend suporta dois modos via `VITE_USE_API`:
- `false` → mock data + localStorage (desenvolvimento sem backend)
- `true` → API real (produção e testes de integração)

---

## Banco de Dados

### Modelos Principais
- `Tenant` → raiz multi-tenant
- `Store` → loja/franquia (tipos: "splash" | "igui")
- `Lead` → lead individual com UTMs e atribuição de origem
- `LeadEvent` → event sourcing de transições de etapa (idempotente por SHA-256)
- `FunnelStage` → definição das 9 etapas do funil
- `User` → usuário com role + storeIds
- `Quote` → orçamento com formData JSON + status

### Etapas do Funil (ordem)
1. lead_capturado
2. visita_agendada
3. visita_realizada
4. projeto_3d
5. orcamento_enviado
6. negociacao
7. contrato_enviado
8. aguardando_pagamento
9. pagamento_aprovado *(isWon = true)*

### Origens de Lead
`meta | google | instagram | organico | indicacao | evento`

Derivação automática por UTMs; `origemManual` sobrescreve quando definido.

---

## Alertas Automáticos (Thresholds)

| Condição | Nível |
|----------|-------|
| Conversão < 8% por loja | CRITICAL |
| Conversão < 12% por loja | WARNING |
| Estágio gargalo no funil | WARNING |
| Conversão de etapa < 50% | WARNING |
| Ciclo médio > 60 dias | CRITICAL |
| Ciclo médio > 45 dias | WARNING |
| Loja com 0 leads enquanto outras têm dados | CRITICAL |

---

## Vault Obsidian

O vault em `vault/` é o segundo cérebro do projeto. Estrutura:
```
00 - Índice/       # Mapas de conteúdo e navegação
01 - Projeto/      # Visão geral, roadmap, decisões
02 - Arquitetura/  # Diagramas e decisões técnicas
03 - Backend/      # Rotas, autenticação, middleware
04 - Frontend/     # Componentes, hooks, contextos
05 - Banco de Dados/ # Schema, modelos, queries
06 - Integrações/  # N8N, Helena CRM, webhooks
07 - Negócio/      # Funil, origens, alertas, KPIs
08 - DevOps/       # Deploy, variáveis de ambiente, Docker
09 - Diário/       # Notas do dia
10 - Tarefas/      # Backlog e in-progress
```

---

## Comandos Úteis

```bash
# Desenvolvimento local
docker-compose up -d          # Sobe o PostgreSQL
cd backend && npx tsx src/seed.ts  # Seed inicial do banco
cd backend && npm run dev     # Backend (porta 3333)
npm run dev                   # Frontend (porta 5173)

# Banco de dados
cd backend && npx prisma studio       # GUI do banco
cd backend && npx prisma migrate dev  # Nova migration
cd backend && npx prisma generate     # Gera o client

# Build
npm run build                 # Build do frontend
cd backend && npm run build   # Build do backend
```

---

## Contato e Deploy

- **Frontend:** Vercel — SPA mode (todas rotas → index.html via `vercel.json`)
- **Backend:** Railway — build via `Dockerfile`, porta 3333
- **Banco:** Railway PostgreSQL ou Docker local
- **Automação:** N8N — `N8N Finalizado.json` (workflow de integração com Helena CRM)
