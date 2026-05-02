---
title: Contexts e Hooks
tags:
  - frontend
  - contextos
  - hooks
  - estado
---

# Contexts e Hooks

## AuthContext

**Arquivo:** `src/contexts/AuthContext.tsx`

Gerencia o estado de autenticação global.

**Expõe:**
```typescript
user: AppUser | null
token: string | null
isAdmin: boolean
isFabricante: boolean
isLojista: boolean
isVendedor: boolean
isAnalistaCRM: boolean
canManageStores: boolean
canManageUsers: boolean
canSeeTrackeamento: boolean
allowedStoreIds: string[]
login(email, password): Promise<void>
logout(): void
```

**Persistência:** `sessionStorage` (apagado ao fechar browser)

---

## StoresContext

**Arquivo:** `src/contexts/StoresContext.tsx`

Lista e CRUD de lojas.

- Modo `VITE_USE_API=false` → `localStorage` + mock
- Modo `VITE_USE_API=true` → API real
- Filtra lojas por `allowedStoreIds` do usuário logado

---

## UsersContext

**Arquivo:** `src/contexts/UsersContext.tsx`

Lista e CRUD de usuários. Sempre usa a API real (sem mock).

---

## OrcamentosContext

**Arquivo:** `src/contexts/OrcamentosContext.tsx`

Lista e CRUD de orçamentos + `markWon` / `markLost`.

- Migração automática de localStorage → API ao mudar para modo API
- Status: `rascunho | enviado | ganho | perdido`

---

## useDashboard

**Arquivo:** `src/hooks/useDashboard.ts`

Hook principal do dashboard. Busca todos os dados em paralelo.

```typescript
const { kpis, funnel, trend, ranking, stageTime, loading, error } 
  = useDashboard({ period, storeId, startDate, endDate })
```

- `Promise.allSettled` → falha parcial não quebra o dashboard
- Polling a cada 30 segundos
- Fallback para mock data se API falhar

---

## useLeads

**Arquivo:** `src/hooks/useLeads.ts`

Leads paginados para o Trackeamento.

```typescript
const { leads, total, page, setPage, loading } = useLeads({ storeId })
```

- 50 leads por página
- Recarrega ao mudar página ou filtros

---

## useStores / useUsers

Wrappers para consumir `StoresContext` e `UsersContext` com verificação de contexto.
