---
title: Decisões Técnicas
tags:
  - projeto
  - arquitetura
  - decisões
aliases:
  - ADRs
---

# Decisões Técnicas

## DT-001 — Event Sourcing nos Leads

**Decisão:** Cada transição de etapa de um lead é registrada como um `LeadEvent` imutável. A etapa atual é desnormalizada em `Lead.currentStageId` para performance de leitura.

**Por quê:** Permite auditoria completa do histórico de um lead, cálculo de tempo médio por etapa, e recálculo de métricas sem perda de dados históricos.

**Trade-off:** Complexidade maior no modelo; queries de histórico precisam de JOIN com `LeadEvent`.

---

## DT-002 — Idempotência por SHA-256

**Decisão:** A chave de idempotência é `SHA-256(eventId + leadExternalId + toStage + occurredAt)`. Se o webhook reenviar o mesmo evento, o `LeadEvent` não é duplicado.

**Por quê:** N8N pode reenviar webhooks em falhas. Helena CRM pode duplicar eventos. Sem idempotência, o funil ficaria distorcido.

**Trade-off:** Um pequeno overhead computacional no ingest para calcular o hash.

---

## DT-003 — Multi-tenant via Slug

**Decisão:** O frontend envia `x-tenant-slug: igui` no header de login. O backend resolve o `tenantId` e o embute no JWT. Requisições subsequentes não precisam do header.

**Por quê:** Permite múltiplos fabricantes usarem a mesma instância sem dados cruzados. Preparado para escala SaaS.

**Trade-off:** Todo dado precisa de `tenantId` nas queries — filtro obrigatório em todos os endpoints.

---

## DT-004 — Modo Dual no Frontend

**Decisão:** `VITE_USE_API=false` usa mock data + localStorage. `VITE_USE_API=true` usa a API real.

**Por quê:** Permite desenvolvimento e demonstração do frontend sem backend rodando. Contexts têm branches explícitas para os dois modos.

**Trade-off:** Duplicação de lógica nos contexts. Risco de divergência entre mock e API real.

---

## DT-005 — First-touch UTM Attribution

**Decisão:** UTMs de um lead só são escritos no primeiro evento (quando `existingLead?.utmSource == null`). Eventos subsequentes não sobrescrevem a origem.

**Por quê:** A origem de aquisição é o primeiro toque — o canal que trouxe o lead inicialmente é o mais relevante para análise de marketing.

**Trade-off:** Se o primeiro evento não tiver UTMs, o lead fica sem origem UTM para sempre (mas pode ser editado manualmente via `origemManual`).

---

## DT-006 — Raw SQL para Agregações

**Decisão:** `Prisma.$queryRaw` com `DATE_TRUNC` e window function `LEAD()` para trend e stage-time.

**Por quê:** O ORM não gera SQL eficiente para agregações com bucketing temporal e cálculo de diffs de timestamp entre eventos consecutivos.

**Trade-off:** Strings SQL sem tipagem em tempo de compilação; mais difícil de manter.

---

## DT-007 — Sem React Router

**Decisão:** Navegação por máquina de estados no `App.tsx` com `type Page = "dashboard" | "stores" | "users" | "trackeamento"`.

**Por quê:** O app tem poucas páginas e não precisa de deep linking ou navegação baseada em URL. Simplicidade foi priorizada.

**Trade-off:** Sem histórico de navegação (botão voltar do browser não funciona entre páginas). URLs não refletem a página atual.
