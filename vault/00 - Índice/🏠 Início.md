---
title: Início — Dashboard iGUi
tags:
  - índice
  - navegação
aliases:
  - Home
  - Início
cssclasses:
  - home
---

# Dashboard Fabricante iGUi — Segundo Cérebro

> Dashboard SaaS de inteligência comercial para a **iGUi Piscinas** — fabricante de piscinas com rede de franquias brasileiras.

---

## Mapas de Conteúdo

| Área | Nota |
|------|------|
| Visão Geral | [[Visão Geral do Projeto]] |
| Arquitetura | [[Mapa da Arquitetura]] |
| Backend | [[Mapa do Backend]] |
| Frontend | [[Mapa do Frontend]] |
| Banco de Dados | [[Mapa do Banco de Dados]] |
| Integrações | [[Mapa de Integrações]] |
| Negócio | [[Mapa de Negócio]] |
| DevOps | [[Mapa de DevOps]] |

---

## Navegação Rápida

### Projeto
- [[Visão Geral do Projeto]]
- [[Roadmap]]
- [[Decisões Técnicas]]

### Técnico
- [[Stack Tecnológica]]
- [[Schema do Banco de Dados]]
- [[Rotas da API]]
- [[Sistema de Autenticação]]
- [[Componentes do Frontend]]

### Negócio
- [[Funil de Vendas]]
- [[Origens de Lead]]
- [[Sistema de Alertas]]
- [[KPIs do Dashboard]]
- [[Catálogo de Piscinas]]

### Operações
- [[Variáveis de Ambiente]]
- [[Deploy e Infraestrutura]]
- [[Integração N8N e Helena CRM]]
- [[Comandos Úteis]]

---

## Status Atual

> [!tip] Última atualização
> Ver [[09 - Diário/]] para notas recentes.

### Funcionalidades Implementadas
- [x] Autenticação JWT com roles
- [x] Dashboard com 7 KPIs + comparativo de período
- [x] Funil de vendas com 9 etapas
- [x] Rastreamento de leads paginado
- [x] Edição inline de origem do lead
- [x] Sistema de orçamentos com PDF
- [x] Gerenciamento de lojas e usuários
- [x] Webhook ingest idempotente (N8N → CRM Helena)
- [x] Controle de acesso por role
- [x] Alertas automáticos de negócio
- [x] Export de dashboard em PDF

---

## Glossário Rápido

| Termo | Significado |
|-------|-------------|
| Tenant | Instância isolada do SaaS (ex.: iGUi) |
| Lead | Contato/oportunidade de venda |
| Etapa | Fase do funil de vendas |
| Lojista | Dono ou gerente de uma loja franqueada |
| Vendedor | Consultor de vendas de uma loja |
| Fabricante | Gestor regional que acompanha múltiplas lojas |
| Ingest | Endpoint que recebe eventos do CRM via webhook |
| Splash | Linha de produtos / tipo de loja (Splash Piscinas) |
