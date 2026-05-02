---
title: Lib — Utilitários do Frontend
tags:
  - frontend
  - lib
  - utilitários
---

# Lib — Utilitários do Frontend

**Pasta:** `src/lib/`

## api.ts

Todas as chamadas HTTP ao backend. Cada função corresponde a um endpoint.

- Adiciona `Authorization: Bearer <token>` e `x-tenant-slug` automaticamente
- Lança erros com mensagens em português
- Sem lógica de negócio — apenas HTTP

## types.ts

Todos os tipos TypeScript compartilhados entre frontend e backend.

Principais tipos:
```typescript
Lead, LeadEvent, Store, User, Quote
KPIData, FunnelData, TrendData, RankingData, StageTimeData
DashboardFilters, Period
LeadOrigem  // 'meta' | 'google' | 'instagram' | 'organico' | 'indicacao' | 'evento'
```

## auth-types.ts

```typescript
type UserRole = 'admin' | 'fabricante' | 'lojista' | 'vendedor' | 'analista_crm'
interface AppUser { id, name, email, role, storeIds, tenantId, ... }
interface AuthState { user, token, isAuthenticated }
```

## auth-token.ts

Helpers para sessionStorage:
```typescript
getToken(): string | null
setToken(token: string): void
clearToken(): void
getUser(): AppUser | null
setUser(user: AppUser): void
```

## constants.ts

```typescript
FUNNEL_STAGES  // Array das 9 etapas com key, label, ordem
STORES         // Lista estática de lojas (dev/mock)
PERIOD_LABELS  // { '7d': 'Últimos 7 dias', ... }
```

## mock-data.ts

Dados fictícios para desenvolvimento sem backend. Espelha a estrutura real da API.

## pool-data.ts

Catálogo completo de piscinas:
- **Modelos:** Navagio, Italiana, Monaco, Bali, Cancún, Ibiza
- **Linhas:** Tradicional / Premium
- **Tamanhos:** dimensões, área, preço (R$17.900 – R$68.000)
- **Casas de máquina:** Dry Pump Plus / Standard (30+ itens)
- **Aquecimento:** Trocador de Calor (R$4.500), Solar (R$3.200)

## quotes-store.ts

Persistência de orçamentos em localStorage (modo mock/offline).

## alerts.ts

Motor de alertas automáticos. Recebe dados do dashboard e retorna alertas com nível (CRITICAL/WARNING).

Ver [[Sistema de Alertas]] para thresholds.

## export-pdf.ts

Export do dashboard em PDF via `html2canvas` + `window.print()`.
- Abre janela de impressão com layout otimizado
- Captura gráficos como imagens

## Valores de Storeidade do Tipo de Loja

```typescript
type StoreType = "splash" | "igui"
```

Determina qual template PDF usar nos orçamentos:
- `"splash"` → `QuoteTemplate` (marca Splash Piscinas)
- `"igui"` → `IguiQuoteTemplate` (marca iGUi)
