---
title: Roadmap
tags:
  - projeto
  - roadmap
  - planejamento
---

# Roadmap

## Concluído ✅

### Fase 1 — Fundação
- [x] Setup Fastify + Prisma + PostgreSQL
- [x] Schema multi-tenant (Tenant, Store, Lead, LeadEvent, FunnelStage)
- [x] Autenticação JWT com roles
- [x] Seed inicial do banco

### Fase 2 — Core Dashboard
- [x] Endpoint de KPIs com comparativo de período
- [x] Funil de vendas com 9 etapas
- [x] Gráfico de tendência (leads vs. vendas)
- [x] Ranking de lojas por conversão
- [x] Tempo médio por etapa + detecção de gargalos

### Fase 3 — Integração CRM
- [x] Webhook ingest idempotente (SHA-256)
- [x] Workflow N8N → Helena CRM
- [x] First-touch UTM attribution
- [x] Cálculo automático de first response time

### Fase 4 — Orçamentos
- [x] CRUD de orçamentos
- [x] Template PDF Splash
- [x] Template PDF iGUi
- [x] Status: ganho / perdido

### Fase 5 — Trackeamento
- [x] Lista de leads paginada (50/página)
- [x] Edição inline de origem do lead
- [x] Origens: meta, google, instagram, organico, indicacao, evento
- [x] Controle de acesso por role (admin/analista_crm)

### Fase 6 — UX e Segurança
- [x] Rate limiting
- [x] Helmet (headers de segurança)
- [x] Reset de senha via Resend
- [x] Alertas automáticos de negócio
- [x] Export de dashboard em PDF
- [x] Dashboard do Vendedor (visão simplificada)

---

## Em Aberto / Próximos Passos

> [!todo] Backlog
> Ver [[10 - Tarefas/Backlog]] para itens detalhados.

### Melhorias Potenciais
- [ ] Notificações em tempo real (WebSocket ou SSE)
- [ ] Relatórios exportáveis (CSV/Excel)
- [ ] Dashboard móvel responsivo
- [ ] Múltiplos tenants ativos na UI
- [ ] Integração com outros CRMs além de Helena
- [ ] API pública com documentação Swagger
- [ ] Testes automatizados (unit + e2e)
