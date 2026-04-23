# ── Stage 1: build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Stage 2: produção (apenas o necessário) ──────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copia artefatos do build
COPY --from=builder /app/dist ./dist
# Copia o Prisma client gerado
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
# Schema necessário para db push
COPY prisma ./prisma

EXPOSE 3333

CMD ["sh", "-c", "npx prisma db push --skip-generate 2>&1 || echo 'AVISO: db push falhou — verifique DATABASE_URL'; node dist/server.js"]
