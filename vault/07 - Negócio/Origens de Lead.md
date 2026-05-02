---
title: Origens de Lead
tags:
  - negócio
  - leads
  - marketing
  - utm
aliases:
  - Origem
  - UTM Attribution
---

# Origens de Lead

## Origens Válidas

| Origem | Descrição |
|--------|-----------|
| `meta` | Facebook Ads / Meta Ads |
| `google` | Google Ads |
| `instagram` | Instagram orgânico ou link in bio |
| `organico` | Tráfego orgânico / sem UTM |
| `indicacao` | Indicação de outro cliente |
| `evento` | Feiras, eventos, ações presenciais |

## Dois Modos de Definição

### 1. Derivação Automática por UTM

O backend infere a origem a partir dos UTMs do lead:

| Condição | Origem |
|----------|--------|
| Sem UTMs | `organico` |
| `utmSource` contém "instagram" OU `utmMedium` = "link_in_bio" / "instagram" | `instagram` |
| `utmSource` contém "facebook" / "fb" / "meta" | `meta` |
| `utmSource` contém "google" | `google` |
| `utmMedium` = "cpc" / "paid" / "paidsocial" | `meta` (fallback) |

### 2. Override Manual (origemManual)

O usuário pode sobrescrever a origem derivada no Trackeamento:
- Edição inline na `LeadsTable`
- `PATCH /api/dashboard/leads/:id/origem { origemManual: "indicacao" }`
- `origemManual` tem prioridade sobre UTM quando definido

## First-touch Attribution

UTMs são capturados **apenas no primeiro evento** do lead:
```typescript
// backend/src/routes/ingest.ts
if (!existingLead?.utmSource) {
  data.utmSource = payload.utmSource
  // ...
}
```

Garante que a origem de aquisição seja o canal inicial, não o canal de conversão.

## Visualização no Dashboard

Os KPIs de **Conversão por Origem** permitem comparar qual canal gera leads de maior qualidade (maior taxa de fechamento).

## Controle de Acesso na Edição

Quem pode editar `origemManual`:
- admin ✅
- fabricante ✅
- lojista ✅
- vendedor ❌
- analista_crm ❌
