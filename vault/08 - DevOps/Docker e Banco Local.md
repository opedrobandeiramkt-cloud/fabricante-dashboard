---
title: Docker e Banco Local
tags:
  - devops
  - docker
  - banco-de-dados
  - desenvolvimento
aliases:
  - Docker
  - PostgreSQL Local
---

# Docker e Banco Local

## docker-compose.yml

```yaml
version: '3.8'
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: igui_dashboard
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

## Connection String Local

```
postgresql://postgres:postgres@localhost:5432/igui_dashboard
```

## Comandos

```bash
# Subir
docker-compose up -d

# Verificar se está rodando
docker-compose ps

# Parar (mantém dados)
docker-compose stop

# Parar e remover (mantém dados no volume)
docker-compose down

# Parar e apagar dados (CUIDADO!)
docker-compose down -v
```

## Acesso Direto ao Banco

```bash
# Via docker-compose
docker-compose exec db psql -U postgres igui_dashboard

# Via psql local (se instalado)
psql postgresql://postgres:postgres@localhost:5432/igui_dashboard
```

## Queries Úteis para Debug

```sql
-- Ver todos os leads
SELECT id, "externalId", "currentStageId", "createdAt" 
FROM "Lead" 
ORDER BY "createdAt" DESC 
LIMIT 20;

-- Ver eventos de um lead
SELECT le.*, 
  fs1.key as from_stage,
  fs2.key as to_stage
FROM "LeadEvent" le
LEFT JOIN "FunnelStage" fs1 ON le."fromStageId" = fs1.id
LEFT JOIN "FunnelStage" fs2 ON le."toStageId" = fs2.id
WHERE le."leadId" = 'UUID_DO_LEAD'
ORDER BY le."occurredAt";

-- Ver usuários do tenant
SELECT id, email, role, "storeIds"
FROM "User"
WHERE "tenantId" = 'UUID_DO_TENANT';

-- Ver eventos com falha
SELECT * FROM "FailedEvent" WHERE resolved = false;
```
