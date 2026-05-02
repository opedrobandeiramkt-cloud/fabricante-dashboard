---
title: Backlog
tags:
  - tarefas
  - backlog
  - planejamento
---

# Backlog

> Itens não priorizados. Mover para [[In Progress]] quando iniciar.

## Alta Prioridade

- [ ] Testes automatizados — unit tests para funções de domínio (alertas, date-ranges, derivação de origem)
- [ ] Testes de integração — endpoints principais com banco real
- [ ] Documentação Swagger/OpenAPI das rotas

## Média Prioridade

- [ ] Notificações em tempo real (WebSocket ou Server-Sent Events) em vez de polling a cada 30s
- [ ] Exportação de leads para CSV/Excel
- [ ] Dashboard móvel — layout responsivo para smartphones
- [ ] Filtro por vendedor no dashboard (além do filtro por loja)
- [ ] Histórico completo do lead (timeline de eventos na UI)

## Baixa Prioridade / Futuro

- [ ] Múltiplos tenants na mesma instância com seleção na UI
- [ ] Integração com outros CRMs além de Helena
- [ ] API pública com documentação completa
- [ ] Modo offline/PWA para uso sem internet
- [ ] Dashboard de análise de campanhas de marketing por origem

## Melhorias Técnicas

- [ ] Mover thresholds de alertas para configuração no banco (por tenant/loja)
- [ ] Adicionar índices de performance no PostgreSQL para queries de KPIs
- [ ] Implementar paginação cursor-based no Trackeamento (mais eficiente que offset)
- [ ] Cache Redis para KPIs (evitar queries pesadas a cada polling)
- [ ] CI/CD com GitHub Actions (lint, build, testes)

## Débitos Técnicos

- [ ] Consolidar lógica duplicada nos contexts (modo dual mock/API)
- [ ] Tipagem mais forte no `formData` de orçamentos (atualmente `Json`)
- [ ] Remover `mock-data.ts` ou documentar claramente que é apenas para dev
