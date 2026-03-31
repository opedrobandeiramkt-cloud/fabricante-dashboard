import type { FunnelStage, Store } from "./types";

export const FUNNEL_STAGES: FunnelStage[] = [
  { key: "lead_capturado",       label: "Lead Capturado",         order: 1,  isWon: false, isLost: false },
  { key: "visita_agendada",      label: "Visita Técnica Agendada", order: 2, isWon: false, isLost: false },
  { key: "visita_realizada",     label: "Visita Realizada",        order: 3, isWon: false, isLost: false },
  { key: "projeto_3d",           label: "Elaboração de Projeto 3D",order: 4, isWon: false, isLost: false },
  { key: "orcamento_enviado",    label: "Orçamento Enviado",       order: 5, isWon: false, isLost: false },
  { key: "em_negociacao",        label: "Em Negociação",           order: 6, isWon: false, isLost: false },
  { key: "contrato_enviado",     label: "Contrato Enviado",        order: 7, isWon: false, isLost: false },
  { key: "aguardando_pagamento", label: "Aguardando Pagamento",    order: 8, isWon: false, isLost: false },
  { key: "pagamento_aprovado",   label: "Pagamento Aprovado",      order: 9, isWon: true,  isLost: false },
  { key: "venda_perdida",        label: "Venda Perdida",           order: 10, isWon: false, isLost: true },
];

export const STORES: Store[] = [
  { id: "loja-01", name: "iGUi São Paulo Centro",  city: "São Paulo",      state: "SP", externalId: "loja-sp-01", phone: "(11) 3000-0001", email: "sp-centro@igui.com.br",  active: true, createdAt: "2024-01-10T00:00:00Z" },
  { id: "loja-02", name: "iGUi Campinas",           city: "Campinas",       state: "SP", externalId: "loja-sp-02", phone: "(19) 3000-0002", email: "campinas@igui.com.br",    active: true, createdAt: "2024-02-15T00:00:00Z" },
  { id: "loja-03", name: "iGUi Curitiba",           city: "Curitiba",       state: "PR", externalId: "loja-pr-01", phone: "(41) 3000-0003", email: "curitiba@igui.com.br",    active: true, createdAt: "2024-03-01T00:00:00Z" },
  { id: "loja-04", name: "iGUi Belo Horizonte",     city: "Belo Horizonte", state: "MG", externalId: "loja-mg-01", phone: "(31) 3000-0004", email: "bh@igui.com.br",          active: true, createdAt: "2024-04-20T00:00:00Z" },
  { id: "loja-05", name: "iGUi Rio de Janeiro",     city: "Rio de Janeiro", state: "RJ", externalId: "loja-rj-01", phone: "(21) 3000-0005", email: "rio@igui.com.br",         active: false, createdAt: "2024-05-05T00:00:00Z" },
];

export const PERIOD_LABELS: Record<string, string> = {
  "7d":  "7 dias",
  "30d": "30 dias",
  "90d": "90 dias",
  "12m": "12 meses",
};
