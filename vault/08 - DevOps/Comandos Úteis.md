---
title: Comandos Úteis
tags:
  - devops
  - comandos
  - desenvolvimento
aliases:
  - Cheatsheet
  - Comandos
---

# Comandos Úteis

## Desenvolvimento Local

### Iniciar o Ambiente

```bash
# 1. Subir o PostgreSQL local
docker-compose up -d

# 2. Rodar migrations (primeira vez)
cd backend && npx prisma migrate dev

# 3. Seed inicial do banco (primeira vez)
cd backend && npx tsx src/seed.ts

# 4. Iniciar o backend
cd backend && npm run dev
# Backend rodando em http://localhost:3333

# 5. Iniciar o frontend (outro terminal)
npm run dev
# Frontend rodando em http://localhost:5173
```

### Parar o Ambiente

```bash
docker-compose down
# Ctrl+C nos processos de dev
```

---

## Banco de Dados (Prisma)

```bash
cd backend

# Criar nova migration
npx prisma migrate dev --name descricao_da_mudanca

# Aplicar migrations em produção
npx prisma migrate deploy

# Ver estado das migrations
npx prisma migrate status

# Abrir GUI do banco (Prisma Studio)
npx prisma studio

# Regenerar client (após mudança no schema)
npx prisma generate

# Reset completo do banco (CUIDADO: apaga tudo)
npx prisma migrate reset

# Seed inicial
npx tsx src/seed.ts
```

---

## Build

```bash
# Build do frontend
npm run build
# Output em: dist/

# Build do backend
cd backend && npm run build
# Output em: backend/dist/

# Preview do build do frontend
npm run preview
```

---

## Teste do Webhook de Ingest

```bash
# Health check
curl http://localhost:3333/api/ingest/health

# Enviar evento de teste
curl -X POST http://localhost:3333/api/ingest/event \
  -H "Authorization: Bearer SEU_WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "leadExternalId": "lead-teste-001",
    "storeExternalId": "loja-ext-001",
    "toStage": "lead_capturado",
    "occurredAt": "2024-01-15T10:00:00Z",
    "eventId": "evento-teste-001",
    "contactName": "João Silva"
  }'
```

---

## Git

```bash
# Ver o que mudou
git diff

# Commit com mensagem convencional
git commit -m "feat: descreve a funcionalidade nova"
git commit -m "fix: corrige o problema X"
git commit -m "refactor: melhora a estrutura de Y"

# Ver histórico
git log --oneline -10
```

---

## Docker

```bash
# Verificar containers
docker ps

# Ver logs do PostgreSQL
docker-compose logs -f db

# Conectar ao banco via psql
docker-compose exec db psql -U postgres igui_dashboard

# Limpar volumes (CUIDADO: apaga dados)
docker-compose down -v
```

---

## Gerar Credenciais

```bash
# JWT_SECRET ou WEBHOOK_SECRET seguro
openssl rand -base64 32

# Token hex
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
