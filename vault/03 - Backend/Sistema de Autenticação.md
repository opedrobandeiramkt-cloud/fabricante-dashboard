---
title: Sistema de Autenticação
tags:
  - backend
  - autenticação
  - segurança
aliases:
  - Auth
  - JWT
---

# Sistema de Autenticação

## Fluxo de Login

```mermaid
sequenceDiagram
    participant UI as Frontend
    participant API as Backend
    participant DB as PostgreSQL

    UI->>API: POST /api/auth/login {email, password, x-tenant-slug}
    API->>DB: SELECT tenant WHERE slug = ?
    DB-->>API: Tenant {id, ...}
    API->>DB: SELECT user WHERE email = ? AND tenantId = ?
    DB-->>API: User {id, passwordHash, role, ...}
    API->>API: scrypt verify(password, passwordHash)
    API->>API: JWT sign({sub, tenantId, role, storeIds})
    API-->>UI: {token, user}
    UI->>UI: sessionStorage.setItem('igui_auth_token', token)
```

## JWT

| Campo | Valor |
|-------|-------|
| Algoritmo | HS256 |
| Expiração | 7 dias |
| Library | `jose` |
| Segredo | `JWT_SECRET` (mín. 32 chars) |

**Payload:**
```json
{
  "sub": "userId (UUID)",
  "tenantId": "UUID",
  "tenantSlug": "igui",
  "role": "admin | fabricante | lojista | vendedor | analista_crm",
  "storeIds": ["UUID", "..."]
}
```

## Armazenamento no Frontend

| Chave | Valor |
|-------|-------|
| `igui_auth_token` | JWT token |
| `igui_auth_user` | User DTO serializado |

**Armazenamento:** `sessionStorage` (apagado ao fechar o browser)

## Headers

```
Authorization: Bearer <token>
x-tenant-slug: igui
```

O `x-tenant-slug` é obrigatório apenas no login. Após o login, o `tenantId` vem do JWT.

## Hashing de Senha

- Algoritmo: Node.js `crypto.scrypt`
- Formato armazenado: `salt:hash` (hex, 64 bytes)
- Comparação: timing-safe via `crypto.timingSafeEqual`

## Reset de Senha

```mermaid
sequenceDiagram
    participant UI as Frontend
    participant API as Backend
    participant Email as Resend

    UI->>API: POST /api/auth/forgot-password {email}
    API->>API: Gera token hex(32) + expiry em 1h
    API->>DB: INSERT PasswordResetToken
    API->>Email: Envia e-mail com link
    Email-->>User: Link de reset
    User->>UI: Acessa /reset-password?token=...
    UI->>API: POST /api/auth/reset-password {token, newPassword}
    API->>DB: Valida token (não expirado, não usado)
    API->>DB: UPDATE User SET passwordHash = ?
    API->>DB: UPDATE PasswordResetToken SET usedAt = NOW()
```

## Middleware de Autorização

```typescript
// Hierarquia de acesso
requireAdmin          // somente role = admin
requireAdminOrLojista // admin | lojista
requireAdminOrFabricante // admin | fabricante
requireAuth           // qualquer role autenticado
```

## Sistema de Permissões por Role

- [[Sistema de Permissões por Role]]
