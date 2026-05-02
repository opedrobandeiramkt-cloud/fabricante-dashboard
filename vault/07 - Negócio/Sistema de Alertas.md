---
title: Sistema de Alertas
tags:
  - negócio
  - alertas
  - monitoramento
aliases:
  - Alertas
  - AlertsPanel
---

# Sistema de Alertas

**Arquivo:** `src/lib/alerts.ts`

## Alertas Automáticos

O motor de alertas analisa os dados do dashboard e gera alertas em dois níveis:

### CRITICAL 🔴

| Condição | Mensagem |
|----------|---------|
| Taxa de conversão da loja < **8%** | "Loja X: conversão crítica de Y%" |
| Ciclo médio de vendas da loja > **60 dias** | "Loja X: ciclo médio de Y dias" |
| Loja com **0 leads** enquanto outras têm dados | "Loja X: sem leads no período" |

### WARNING 🟡

| Condição | Mensagem |
|----------|---------|
| Taxa de conversão da loja < **12%** | "Loja X: conversão de Y%" |
| Etapa identificada como gargalo | "Gargalo em: [Etapa]" |
| Conversão entre etapas < **50%** | "[Etapa]: conversão de Y%" |
| Ciclo médio de vendas > **45 dias** | "Loja X: ciclo médio de Y dias" |

## Como é Exibido

No componente `AlertsPanel`:
- Agrupado por nível: CRITICAL primeiro, depois WARNING
- Cada alerta mostra: loja afetada, métrica e valor
- Atualizado a cada 30 segundos junto com o polling do dashboard
- Visível para admin, fabricante e lojista

## Thresholds — Referência Rápida

| Métrica | WARNING | CRITICAL |
|---------|---------|---------|
| Taxa de conversão | < 12% | < 8% |
| Conversão entre etapas | — | — |
| Conversão etapa | < 50% | — |
| Ciclo médio (dias) | > 45 | > 60 |
| Loja sem leads | — | 0 leads |

## Personalização Futura

Os thresholds são constantes no arquivo `alerts.ts`. Para personalizar por tenant ou loja, seria necessário mover para a base de dados.

```typescript
// Thresholds atuais (hardcoded em alerts.ts)
const CONVERSION_CRITICAL = 0.08   // 8%
const CONVERSION_WARNING  = 0.12   // 12%
const CYCLE_CRITICAL_DAYS = 60
const CYCLE_WARNING_DAYS  = 45
const STAGE_CONVERSION_MIN = 0.50  // 50%
```
