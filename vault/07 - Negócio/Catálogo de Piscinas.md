---
title: Catálogo de Piscinas
tags:
  - negócio
  - piscinas
  - orçamentos
  - catálogo
aliases:
  - Produtos
  - Pool Data
---

# Catálogo de Piscinas

**Arquivo:** `src/lib/pool-data.ts`

## Modelos Disponíveis

| Modelo | Linhas | Faixa de Preço |
|--------|--------|---------------|
| Navagio | Tradicional, Premium | R$ 17.900 – R$ 38.000 |
| Italiana | Tradicional, Premium | R$ 19.500 – R$ 42.000 |
| Monaco | Tradicional, Premium | R$ 21.000 – R$ 45.000 |
| Bali | Tradicional, Premium | R$ 23.000 – R$ 49.000 |
| Cancún | Tradicional, Premium | R$ 25.000 – R$ 54.000 |
| Ibiza | Tradicional, Premium | R$ 28.000 – R$ 68.000 |

## Estrutura de Dados

```typescript
interface PoolModel {
  id: string
  name: string
  line: 'Tradicional' | 'Premium'
  sizes: PoolSize[]
}

interface PoolSize {
  id: string
  label: string      // ex.: "5m x 3m"
  dimensions: string
  area: number       // m²
  price: number      // R$
}
```

## Itens das Casas de Máquina

### Dry Pump Plus
30+ itens incluídos:
- Bomba centrífuga
- Filtro de areia
- Skimmer
- Retorno de água
- Dreno de fundo
- Quadro elétrico
- Tubulação PVC
- [...]

### Standard
Versão simplificada com itens básicos.

## Opções de Aquecimento

| Opção | Preço |
|-------|-------|
| Trocador de Calor | R$ 4.500 |
| Aquecimento Solar | R$ 3.200 |

## Tipos de Template PDF

| `storeType` | Template | Marca |
|------------|---------|-------|
| `"igui"` | `IguiQuoteTemplate` | iGUi Piscinas |
| `"splash"` | `QuoteTemplate` | Splash Piscinas |

## Fluxo de Criação de Orçamento

1. Vendedor abre `OrcamentoFormModal`
2. Seleciona modelo, tamanho e opcionais
3. Sistema calcula `proposalValue` automaticamente
4. `formData` JSON armazena todos os detalhes
5. PDF gerado com `html2canvas` + `jsPDF`
6. Orçamento salvo no banco via `POST /api/quotes`
7. Quando aprovado → `PATCH /api/quotes/:id/won` → Lead avança no funil
