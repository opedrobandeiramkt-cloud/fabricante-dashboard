---
title: Mapa do Frontend
tags:
  - frontend
  - índice
  - componentes
aliases:
  - Frontend
---

# Mapa do Frontend

## Estrutura

```
src/
├── App.tsx              # Raiz — routing por estado, sidebar
├── main.tsx             # Entry point — árvore de providers
├── index.css            # Tailwind + variáveis CSS (dark theme)
├── assets/logo.svg
├── components/
│   ├── auth/
│   ├── dashboard/
│   ├── stores/
│   ├── users/
│   ├── trackeamento/
│   └── orcamentos/
├── contexts/
├── hooks/
└── lib/
```

## Navegação

Sem React Router. Máquina de estados no `App.tsx`:
```typescript
type Page = "dashboard" | "stores" | "users" | "trackeamento"
```

A sidebar define os itens visíveis por role. Páginas são renderizadas condicionalmente.

## Árvore de Providers

```
main.tsx
  └─ UsersProvider
       └─ AuthProvider
            └─ StoresProvider
                 └─ OrcamentosProvider
                      └─ App
```

## Modo Dual

`VITE_USE_API=true` → API real
`VITE_USE_API=false` → mock data + localStorage

Todos os contexts têm branches explícitas.

## Notas Relacionadas

- [[Componentes do Dashboard]]
- [[Componentes de Orçamentos]]
- [[Contexts e Hooks]]
- [[Lib — Utilitários do Frontend]]
