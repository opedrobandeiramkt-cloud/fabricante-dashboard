---
title: Schema do Banco de Dados
tags:
  - banco-de-dados
  - schema
  - prisma
aliases:
  - Schema
  - Prisma Schema
---

# Schema do Banco de Dados

**Arquivo:** `backend/prisma/schema.prisma`

## Tenant

```prisma
model Tenant {
  id     String  @id @default(uuid())
  name   String
  slug   String  @unique

  stores       Store[]
  funnelStages FunnelStage[]
  users        User[]
  leads        Lead[]
  quotes       Quote[]
}
```

## Store

```prisma
model Store {
  id         String    @id @default(uuid())
  tenantId   String
  name       String
  city       String?
  state      String?
  externalId String?   // ID no CRM Helena
  storeType  String    @default("igui")  // "splash" | "igui"
  createdAt  DateTime  @default(now())

  tenant Tenant   @relation(...)
  leads  Lead[]
  quotes Quote[]
}
```

## Lead

```prisma
model Lead {
  id                   String    @id @default(uuid())
  tenantId             String
  storeId              String
  externalId           String    // ID no CRM Helena
  currentStageId       String?
  enteredAt            DateTime
  closedAt             DateTime?
  revenue              Float?
  
  // UTM attribution (first-touch)
  utmSource    String?
  utmMedium    String?
  utmCampaign  String?
  utmContent   String?
  
  // Origem manual (sobrescreve UTM)
  origemManual String?  // 'meta' | 'google' | 'instagram' | 'organico' | 'indicacao' | 'evento'
  
  // Contato
  contactName        String?
  contactPhone       String?
  salespersonCrmId   String?
  
  // Métricas calculadas
  firstResponseMinutes Float?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant       Tenant       @relation(...)
  store        Store        @relation(...)
  currentStage FunnelStage? @relation("currentStage", ...)
  events       LeadEvent[]

  @@unique([tenantId, externalId])
}
```

## LeadEvent

```prisma
model LeadEvent {
  id              String   @id @default(uuid())
  leadId          String
  fromStageId     String?
  toStageId       String
  occurredAt      DateTime
  idempotencyKey  String   @unique  // SHA-256
  rawPayload      Json?

  lead      Lead        @relation(...)
  fromStage FunnelStage? @relation("fromStage", ...)
  toStage   FunnelStage  @relation("toStage", ...)
}
```

## FunnelStage

```prisma
model FunnelStage {
  id         String  @id @default(uuid())
  tenantId   String
  key        String  // ex.: "lead_capturado"
  label      String  // ex.: "Lead Capturado"
  orderIndex Int
  isWon      Boolean @default(false)
  isLost     Boolean @default(false)

  @@unique([tenantId, key])
}
```

## User

```prisma
model User {
  id           String   @id @default(uuid())
  tenantId     String
  email        String   @unique
  passwordHash String
  name         String?
  role         UserRole  // enum
  storeIds     Json     @default("[]")  // string[]
  salesGoal    Float?
  crmUserId    String?
  createdAt    DateTime @default(now())

  quotes Quote[]
}

enum UserRole {
  admin
  fabricante
  lojista
  vendedor
  analista_crm
}
```

## Quote

```prisma
model Quote {
  id             String    @id @default(uuid())
  tenantId       String
  storeId        String
  vendedorId     String?
  clientName     String
  proposalValue  Float?
  status         String    @default("rascunho")  // rascunho | enviado | ganho | perdido
  formData       Json      // dados completos do formulário de orçamento
  wonAt          DateTime?
  lostAt         DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
}
```

## PasswordResetToken

```prisma
model PasswordResetToken {
  id        String    @id @default(uuid())
  email     String
  token     String    @unique  // hex(32)
  expiresAt DateTime              // now + 1h
  usedAt    DateTime?
  createdAt DateTime  @default(now())
}
```

## FailedEvent

```prisma
model FailedEvent {
  id        String   @id @default(uuid())
  payload   Json
  error     String
  source    String   @default("ingest")
  resolved  Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

## Etapas do Funil (Seed)

| orderIndex | key | label | isWon |
|-----------|-----|-------|-------|
| 1 | lead_capturado | Lead Capturado | false |
| 2 | visita_agendada | Visita Agendada | false |
| 3 | visita_realizada | Visita Realizada | false |
| 4 | projeto_3d | Projeto 3D | false |
| 5 | orcamento_enviado | Orçamento Enviado | false |
| 6 | negociacao | Negociação | false |
| 7 | contrato_enviado | Contrato Enviado | false |
| 8 | aguardando_pagamento | Aguardando Pagamento | false |
| 9 | pagamento_aprovado | Pagamento Aprovado | **true** |
