---
title: Sistema de Permissões por Role
tags:
  - backend
  - autorização
  - roles
  - segurança
---

# Sistema de Permissões por Role

## Roles Disponíveis

| Role | Descrição |
|------|-----------|
| `admin` | Acesso total — todos os tenants e lojas |
| `fabricante` | Lojas atribuídas via `storeIds` no JWT |
| `lojista` | Suas lojas + gerencia vendedores |
| `vendedor` | Apenas seus leads e orçamentos |
| `analista_crm` | Leitura do Trackeamento |

## Matriz de Permissões

| Funcionalidade | admin | fabricante | lojista | vendedor | analista_crm |
|---------------|-------|-----------|---------|---------|-------------|
| Dashboard KPIs | ✅ Todas lojas | ✅ Lojas atribuídas | ✅ Suas lojas | ✅ Simplificado | ❌ |
| Trackeamento | ✅ | ✅ | ✅ | ❌ | ✅ Leitura |
| Gerenciar Lojas | ✅ | ❌ | ❌ | ❌ | ❌ |
| Gerenciar Usuários | ✅ | ❌ | ✅ Vendedores | ❌ | ❌ |
| Orçamentos | ✅ | ✅ | ✅ | ✅ Próprios | ❌ |
| Editar origem lead | ✅ | ✅ | ✅ | ❌ | ❌ |
| Ver meta | ✅ | ✅ | ✅ | ✅ | ❌ |

## Escopo de Dados por Role

### Admin
- Vê todos os dados do tenant sem filtro

### Fabricante
- `storeIds` no JWT define quais lojas pode ver
- Se `storeIds` vazio → vê todas as lojas do tenant

### Lojista
- Vê apenas as lojas em `storeIds`
- Pode criar/editar/deletar usuários do tipo `vendedor` em suas lojas
- Não pode deletar o último admin

### Vendedor
- `crmUserId` vincula o vendedor aos seus leads no CRM
- Vê apenas orçamentos criados por ele (`vendedorId`)
- Dashboard simplificado via `VendedorDashboard`

### Analista CRM
- Acesso de leitura ao Trackeamento
- Nenhum acesso de escrita ou configuração

## Regras de Negócio de Usuários

- **Não pode deletar o último admin** — o backend valida antes de deletar
- **Lojista cria vendedor** — o `lojista` pode criar usuários `vendedor` vinculados à sua loja
- **Admin cria qualquer role** — sem restrição de role na criação

## Frontend — Booleans de Conveniência

No `AuthContext`, booleanos derivados do role:
```typescript
isAdmin         // role === 'admin'
isFabricante    // role === 'fabricante'
isLojista       // role === 'lojista'
isVendedor      // role === 'vendedor'
isAnalistaCRM   // role === 'analista_crm'
canManageStores // admin
canManageUsers  // admin | lojista
canSeeTrackeamento // admin | fabricante | lojista | analista_crm
```
