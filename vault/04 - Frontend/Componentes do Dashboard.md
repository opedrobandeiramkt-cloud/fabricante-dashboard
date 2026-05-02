---
title: Componentes do Dashboard
tags:
  - frontend
  - componentes
  - dashboard
---

# Componentes do Dashboard

**Pasta:** `src/components/dashboard/`

## KPICards

**Arquivo:** `KPICards.tsx`

Grid de 7 cards de KPI com indicadores de tendência (↑/↓/→).

| KPI | Descrição |
|-----|-----------|
| Total de Leads | + delta % |
| Taxa de Conversão | % + delta pp |
| Negócios Ganhos | + delta % |
| Receita Total | R$ + delta % |
| Ticket Médio | R$ + delta % |
| Ciclo Médio de Vendas | dias |
| Tempo Médio 1ª Resposta | minutos/horas |

## FunnelChart

**Arquivo:** `FunnelChart.tsx`

Visualização do funil de vendas com as 9 etapas. Exibe:
- Contagem de leads em cada etapa
- Taxa de conversão entre etapas
- Destaque visual para gargalos

## TrendChart

**Arquivo:** `TrendChart.tsx`

Série temporal de leads vs. vendas usando `Recharts LineChart`.
- Período: 7d / 30d / 90d / custom
- Buckets: dia / semana / mês (auto-ajustados ao período)
- Duas linhas: `leads` (azul) + `vendas` (verde)

## StoreRanking

**Arquivo:** `StoreRanking.tsx`

Tabela de lojas ordenada por taxa de conversão.
- Colunas: loja, leads, conversão, receita, ticket médio
- Destaque para melhores e piores performers

## StageTimeChart

**Arquivo:** `StageTimeChart.tsx`

Tempo médio (dias) em cada etapa do funil.
- Bar chart horizontal
- Flag visual na etapa identificada como gargalo
- Calculado via window function SQL (`LEAD()`)

## StoreFilter

**Arquivo:** `StoreFilter.tsx`

Dropdown multi-seleção de lojas.
- Visível para admin/fabricante
- Propaga filtros para o `useDashboard` hook
- Lojista vê apenas suas lojas

## SalesGoalProgress

**Arquivo:** `SalesGoalProgress.tsx`

Barra de progresso da meta mensal do vendedor.
- Visível apenas para role `vendedor`
- Mostra: alcançado vs. meta + percentual
- Dados de `GET /api/dashboard/goal`

## VendedorDashboard

**Arquivo:** `VendedorDashboard.tsx`

Visão simplificada para vendedores. Exibe apenas:
- Seus leads atuais
- Progresso da meta
- Orçamentos em aberto

Substitui o dashboard completo quando role = `vendedor`.

## AlertsPanel

**Arquivo:** `AlertsPanel.tsx`

Painel de alertas automáticos gerados pelo `src/lib/alerts.ts`.
- Agrupa por nível: CRITICAL → WARNING
- Exibe loja, métrica afetada e valor
- Atualizado a cada polling do dashboard (30s)

## Fluxo de Dados

```
App.tsx (filters state)
  └─ useDashboard(filters) hook
       └─ Promise.allSettled([kpis, funnel, trend, ranking, stageTime])
            └─ Cada componente recebe sua slice dos dados
```

Polling automático: `setInterval` a cada 30 segundos.
