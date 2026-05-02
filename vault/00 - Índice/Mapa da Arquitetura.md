---
title: Mapa da Arquitetura
tags:
  - índice
  - arquitetura
---

# Mapa da Arquitetura — Índice

Este índice serve como ponto de entrada para toda a documentação de arquitetura do projeto.

## Notas de Arquitetura

- [[02 - Arquitetura/Mapa da Arquitetura|Arquitetura Geral]]
- [[03 - Backend/Mapa do Backend|Backend]]
- [[04 - Frontend/Mapa do Frontend|Frontend]]
- [[05 - Banco de Dados/Mapa do Banco de Dados|Banco de Dados]]
- [[06 - Integrações/Mapa de Integrações|Integrações]]

## Decisões Técnicas

- [[01 - Projeto/Decisões Técnicas|Todas as Decisões]]
- [[01 - Projeto/Stack Tecnológica|Stack Tecnológica]]

## Diagramas Rápidos

### Fluxo de Dados

```
Helena CRM → N8N → /api/ingest/event → PostgreSQL → Dashboard React
```

### Hierarquia de Autenticação

```
JWT (HS256, 7d)
  └── tenantId (isolamento multi-tenant)
  └── role (controle de acesso)
  └── storeIds (filtro de lojas)
```
