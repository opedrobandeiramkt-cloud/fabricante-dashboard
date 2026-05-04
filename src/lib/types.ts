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
  storeType?: "splash" | "igui"; // template de orçamento
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
  avgFirstResponseMinutes: number; // minutos até 1ª resposta
  avgFirstResponseDelta: number;
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
  avgFirstResponseMinutes: number; // minutos até 1ª resposta
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

export interface GoalData {
  wonDeals:   number;
  salesGoal:  number;
  name:       string;
  monthLabel: string;
}

// ─── Orçamentos ──────────────────────────────────────────────────────────────

export interface OrcamentoItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export type OrcamentoStatus = "rascunho" | "enviado" | "em_negociacao" | "ganho";

export interface Orcamento {
  id: string;
  numero: string;           // ORC-0001
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  storeId: string;
  vendedorId: string;
  vendedorName: string;
  items: OrcamentoItem[];
  totalValue: number;
  status: OrcamentoStatus;
  notes?: string;
  createdAt: string;        // ISO 8601
  updatedAt: string;        // ISO 8601
  wonAt?: string;           // ISO 8601 — preenchido ao marcar como ganho
}

// ─── Trackeamento / Leads ─────────────────────────────────────────────────────

export type LeadOrigem = "meta" | "google" | "instagram" | "organico" | "indicacao" | "evento";

export interface LeadRow {
  id:              string;
  contactName:     string | null;
  contactPhone:    string | null;
  origem:          LeadOrigem;
  origemManual:    LeadOrigem | null;
  utmSource:       string | null;
  utmMedium:       string | null;
  utmCampaign:     string | null;
  utmContent:      string | null;
  stageLabel:      string | null;
  stageKey:        string | null;
  estimatedValue:  number | null;
  revenue:         number | null;
  isDuplicate:     boolean;
  salespersonName: string | null;
  storeName:       string;
  enteredAt:       string;
}

export interface LeadsPage {
  data:       LeadRow[];
  total:      number;
  page:       number;
  totalPages: number;
}

// ─── CRM Config ───────────────────────────────────────────────────────────────

export interface StageMapEntry {
  tagId:    string;
  stepId:   string;
  dashKey:  string | null;
}

export interface StoreCrmConfig {
  id:            string;
  panelId:       string;
  hasToken:      boolean;
  stageMap:      StageMapEntry[];
  stagePriority: string[];
  version:       number;
  updatedBy:     string | null;
  updatedAt:     string;
}

export interface CrmTestResult {
  ok:         boolean;
  latencyMs:  number;
  agentCount?: number;
  error?:     string;
}

// ─── Filtros ──────────────────────────────────────────────────────────────────

export type Period = "7d" | "30d" | "90d" | "12m";

export interface DashboardFilters {
  storeIds:  string[]; // [] = todas
  period:    Period;
  crmUserId?: string;  // se presente, filtra por vendedor
}

// ─── Tráfego Pago ─────────────────────────────────────────────────────────────

export type AdPlatform = "google" | "meta";

export interface AdPlatformMetrics {
  investido: number;
  leads: number;
  cpl: number;
  conversao?: number;
  mensagens?: number;
  cpm?: number;
  clicks?: number;
  impressions?: number;
  temporal: Array<{ date: string; leads: number; investido: number }>;
}

export interface TrafegoFunnel {
  impressions: number; impressionsDelta: number;
  clicks: number; clicksDelta: number; ctr: number;
  leads: number; leadsDelta: number;
  cpl: number; cplDelta: number;
  atendimentos: number; mql: number;
  vendas: number; vendasDelta: number;
  ticketMedio: number; ticketMedioDelta: number;
  cps: number; cpsDelta: number;
  percentVendas: number;
}

export interface TrafegoMacro {
  investimento: number; investimentoDelta: number;
  faturamento: number; faturamentoDelta: number;
  roi: number; roiDelta: number;
}

export interface TrafegoTemporalPoint {
  date: string;
  investimento: number;
  faturamento: number;
  roi: number;
  vendas: number;
  cps: number;
}

export interface TrafegoOverview {
  funnel: TrafegoFunnel;
  macro: TrafegoMacro;
  temporal: TrafegoTemporalPoint[];
  google: AdPlatformMetrics;
  meta: AdPlatformMetrics;
}

export interface DemographicSlice {
  bucket: string;
  leads: number;
  spend: number;
}

export interface SearchTermRow {
  term: string;
  conversions: number;
  cpl: number;
  clicks: number;
  impressions: number;
}

export interface AdCreativeRow {
  name: string;
  type: string;
  subPlatform: string;
  leads: number;
  messages: number;
  spend: number;
  cpl: number;
}

export interface GeoMetricRow {
  state: string;
  leads: number;
  spend: number;
}

export interface PlatformDetalhamento {
  kpis: AdPlatformMetrics;
  demographics: {
    age: DemographicSlice[];
    gender: DemographicSlice[];
    device: DemographicSlice[];
  };
  searchTerms?: SearchTermRow[];
  geo?: GeoMetricRow[];
  topAds?: AdCreativeRow[];
  leadsBySubPlatform?: Array<{ platform: string; leads: number }>;
}

export interface TrafegoDetalhamento {
  google: PlatformDetalhamento;
  meta: PlatformDetalhamento;
}

export interface MonthlyHistoricoPoint {
  month: string;
  investimento: number;
  leads: number;
  vendas: number;
  faturamento: number;
  roi: number;
  google: number;
  meta: number;
}

export interface TrafegoKpiAnual {
  atual: number;
  anterior: number;
  goal: number | null;
}

export interface TrafegoHistorico {
  kpisAnuais: {
    investimento: TrafegoKpiAnual;
    leads: TrafegoKpiAnual;
    vendas: TrafegoKpiAnual;
    faturamento: TrafegoKpiAnual;
    roi: { atual: number; anterior: number };
  };
  mensal: MonthlyHistoricoPoint[];
  leadsPorCanal: Array<{
    month: string; google: number; meta: number; instagram: number;
    organico: number; indicacao: number; evento: number; total: number;
  }>;
}

export type TrafegoTab = "visao-geral" | "detalhamento" | "historico" | "leads";
