// ─── Funil ───────────────────────────────────────────────────────────────────

export type StageKey =
  | "lead_capturado"
  | "visita_agendada"
  | "visita_realizada"
  | "projeto_3d"
  | "orcamento_enviado"
  | "em_negociacao"
  | "contrato_enviado"
  | "aguardando_pagamento"
  | "pagamento_aprovado"
  | "venda_perdida";

export interface FunnelStage {
  key: StageKey;
  label: string;
  order: number;
  isWon: boolean;
  isLost: boolean;
}

// ─── Lojas ───────────────────────────────────────────────────────────────────

export interface Store {
  id: string;
  name: string;
  city: string;
  state: string;
  externalId?: string; // ID da loja no CRM (Chatwoot / Helena)
  phone?: string;
  email?: string;
  active: boolean;
  createdAt: string; // ISO 8601
}

// ─── Eventos ─────────────────────────────────────────────────────────────────

export interface LeadEvent {
  id: string;
  storeId: string;
  leadId: string;
  fromStage: StageKey | null;
  toStage: StageKey;
  occurredAt: string; // ISO 8601
}

// ─── Métricas ─────────────────────────────────────────────────────────────────

export interface KPIData {
  totalLeads: number;
  totalLeadsDelta: number; // % vs período anterior
  totalConversion: number; // %
  totalConversionDelta: number;
  avgCycleDays: number;
  avgCycleDelta: number;
  wonDeals: number;
  wonDealsDelta: number;
  totalRevenue: number;    // R$ total faturado
  totalRevenueDelta: number;
  avgTicket: number;       // R$ ticket médio por venda
  avgTicketDelta: number;
}

export interface FunnelStageData {
  key: StageKey;
  label: string;
  order: number;
  count: number;
  conversionFromPrev: number | null; // % de conversão da etapa anterior para esta
  isBottleneck: boolean;
  isWon: boolean;
  isLost: boolean;
}

export interface StoreRankingRow {
  store: Store;
  leads: number;
  conversion: number; // %
  wonDeals: number;
  revenue: number;     // R$ faturado no período
  avgTicket: number;   // R$ ticket médio
  avgCycleDays: number;
  trend: number[]; // últimos 7 pontos para sparkline
}

export interface TrendPoint {
  date: string; // "DD/MM"
  leads: number;
  vendas: number;
}

export interface StageTimeData {
  label: string;
  avgDays: number;
  isBottleneck: boolean;
}

// ─── Filtros ──────────────────────────────────────────────────────────────────

export type Period = "7d" | "30d" | "90d" | "12m";

export interface DashboardFilters {
  storeIds: string[]; // [] = todas
  period: Period;
}
