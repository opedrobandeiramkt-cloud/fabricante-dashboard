---
title: KPIs do Dashboard
tags:
  - negócio
  - kpis
  - métricas
  - dashboard
aliases:
  - KPIs
  - Métricas
---

# KPIs do Dashboard

## Os 7 KPIs

### 1. Total de Leads
- **O que é:** Quantidade de leads que entraram no funil no período
- **Comparativo:** Delta % vs. período anterior
- **Endpoint:** `GET /api/dashboard/kpis`

### 2. Taxa de Conversão
- **O que é:** % de leads que chegaram a `pagamento_aprovado` (isWon=true)
- **Comparativo:** Delta em pontos percentuais (pp)
- **Threshold de alerta:** < 12% → WARNING, < 8% → CRITICAL

### 3. Negócios Ganhos
- **O que é:** Quantidade de leads com status ganho no período
- **Comparativo:** Delta %

### 4. Receita Total
- **O que é:** Soma do `revenue` dos leads ganhos (R$)
- **Comparativo:** Delta %

### 5. Ticket Médio
- **O que é:** Receita Total ÷ Negócios Ganhos (R$)
- **Comparativo:** Delta %

### 6. Ciclo Médio de Vendas
- **O que é:** Tempo médio em dias de `lead_capturado` → `pagamento_aprovado`
- **Sem comparativo de delta**
- **Threshold de alerta:** > 45 dias → WARNING, > 60 dias → CRITICAL

### 7. Tempo Médio de 1ª Resposta
- **O que é:** Tempo médio entre entrada e primeira transição de etapa
- **Exibição:** Em minutos (< 60) ou horas (≥ 60)
- **Objetivo:** < 24 horas

## Cálculo de Período Anterior

O backend calcula automaticamente o período anterior do mesmo tamanho para comparação:
- Período atual: últimos 30 dias
- Período anterior: 30 dias antes disso

**Arquivo:** `backend/src/lib/date-ranges.ts`

## Granularidade da Trend

| Período | Bucket |
|---------|--------|
| 7d | Dia |
| 30d | Dia |
| 90d | Semana |
| Custom > 60d | Mês |
| Custom ≤ 60d | Dia |

## Filtros Disponíveis

- **Período:** 7d / 30d / 90d / custom (com datas)
- **Loja:** Todas ou uma loja específica (para admin/fabricante)

## Visão do Vendedor

O `VendedorDashboard` exibe uma versão simplificada com apenas:
- Seus leads ativos e etapas
- Progresso da meta mensal
- Orçamentos em aberto
