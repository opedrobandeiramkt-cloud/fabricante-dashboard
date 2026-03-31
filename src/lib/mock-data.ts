import { FUNNEL_STAGES, STORES } from "./constants";
import type {
  DashboardFilters,
  FunnelStageData,
  KPIData,
  StageKey,
  StageTimeData,
  StoreRankingRow,
  TrendPoint,
} from "./types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Retorna multiplicador por período para simular volume */
function periodMultiplier(period: string): number {
  return period === "7d" ? 0.23 : period === "30d" ? 1 : period === "90d" ? 2.8 : 11;
}

/** Simula volume base por loja */
const STORE_BASE: Record<string, number> = {
  "loja-01": 180,
  "loja-02": 130,
  "loja-03": 115,
  "loja-04": 95,
  "loja-05": 140,
};

/** Ticket médio base por loja (R$) — iGUi: piscinas de alto valor */
const STORE_AVG_TICKET: Record<string, number> = {
  "loja-01": 68000,
  "loja-02": 54000,
  "loja-03": 61000,
  "loja-04": 49000,
  "loja-05": 72000,
};

/** Taxa de passagem por etapa (probabilidade acumulada de chegar) */
const STAGE_PASS_RATE: Record<StageKey, number> = {
  lead_capturado:       1.00,
  visita_agendada:      0.72,
  visita_realizada:     0.58,
  projeto_3d:           0.45,
  orcamento_enviado:    0.38,
  em_negociacao:        0.28,
  contrato_enviado:     0.20,
  aguardando_pagamento: 0.16,
  pagamento_aprovado:   0.13,
  venda_perdida:        0.12,
};

/** Tempo médio em dias por etapa */
const STAGE_AVG_DAYS: Record<StageKey, number> = {
  lead_capturado:       1,
  visita_agendada:      3,
  visita_realizada:     2,
  projeto_3d:           8,   // gargalo
  orcamento_enviado:    5,
  em_negociacao:        12,  // gargalo
  contrato_enviado:     4,
  aguardando_pagamento: 6,
  pagamento_aprovado:   1,
  venda_perdida:        0,
};

function storeBase(storeIds: string[]): number {
  const ids = storeIds.length > 0 ? storeIds : STORES.map((s) => s.id);
  return ids.reduce((sum, id) => sum + (STORE_BASE[id] ?? 100), 0);
}

// ─── KPIs ─────────────────────────────────────────────────────────────────────

export function getKPIs(filters: DashboardFilters): KPIData {
  const ids        = filters.storeIds.length > 0 ? filters.storeIds : STORES.map((s) => s.id);
  const base       = storeBase(filters.storeIds) * periodMultiplier(filters.period);
  const totalLeads = Math.round(base + rand(-20, 20));
  const wonDeals   = Math.round(totalLeads * 0.13 + rand(-3, 3));

  // Ticket médio ponderado pelas lojas selecionadas
  const avgTicketBase = Math.round(
    ids.reduce((sum, id) => sum + (STORE_AVG_TICKET[id] ?? 55000), 0) / ids.length
  );
  const avgTicket   = avgTicketBase + rand(-3000, 5000);
  const totalRevenue = wonDeals * avgTicket;

  return {
    totalLeads,
    totalLeadsDelta:      rand(-18, 32),
    totalConversion:      parseFloat(((wonDeals / totalLeads) * 100).toFixed(1)),
    totalConversionDelta: parseFloat((rand(-5, 8) / 10).toFixed(1)),
    avgCycleDays:         rand(28, 45),
    avgCycleDelta:        rand(-6, 10),
    wonDeals,
    wonDealsDelta:        rand(-15, 25),
    totalRevenue,
    totalRevenueDelta:    rand(-20, 35),
    avgTicket,
    avgTicketDelta:       rand(-8, 12),
  };
}

// ─── Funil ────────────────────────────────────────────────────────────────────

export function getFunnelData(filters: DashboardFilters): FunnelStageData[] {
  const base  = storeBase(filters.storeIds) * periodMultiplier(filters.period);
  const entry = Math.round(base + rand(-15, 15));

  // Médias de tempo para identificar gargalos (etapas acima do P75)
  const avgTimes = Object.values(STAGE_AVG_DAYS);
  const p75 = avgTimes.sort((a, b) => a - b)[Math.floor(avgTimes.length * 0.75)];

  return FUNNEL_STAGES.map((stage, i) => {
    const count = Math.round(entry * STAGE_PASS_RATE[stage.key] + rand(-5, 5));
    const prevStage = i > 0 ? FUNNEL_STAGES[i - 1] : null;
    const prevCount = prevStage
      ? Math.round(entry * STAGE_PASS_RATE[prevStage.key])
      : null;

    const conversionFromPrev =
      prevCount && prevCount > 0
        ? parseFloat(((count / prevCount) * 100).toFixed(1))
        : null;

    const avgDays = STAGE_AVG_DAYS[stage.key];
    const isBottleneck =
      !stage.isWon &&
      !stage.isLost &&
      avgDays >= p75 &&
      (conversionFromPrev ?? 100) < 70;

    return {
      key: stage.key,
      label: stage.label,
      order: stage.order,
      count,
      conversionFromPrev,
      isBottleneck,
      isWon: stage.isWon,
      isLost: stage.isLost,
    };
  });
}

// ─── Tendência ────────────────────────────────────────────────────────────────

export function getTrendData(filters: DashboardFilters): TrendPoint[] {
  const points =
    filters.period === "7d"  ? 7  :
    filters.period === "30d" ? 30 :
    filters.period === "90d" ? 12 : 12;

  const label =
    filters.period === "7d"  ? "dia" :
    filters.period === "30d" ? "dia" :
    filters.period === "90d" ? "semana" : "mês";

  const base = storeBase(filters.storeIds);

  return Array.from({ length: points }, (_, i) => {
    const leads  = Math.round((base / (label === "mês" ? 1 : 30)) * periodMultiplier(filters.period) / points + rand(-8, 8));
    const vendas = Math.round(leads * (0.1 + rand(0, 5) / 100));

    const now = new Date();
    const offset = (points - 1 - i);
    const d = new Date(now);

    if (label === "semana") d.setDate(d.getDate() - offset * 7);
    else if (label === "mês") d.setMonth(d.getMonth() - offset);
    else d.setDate(d.getDate() - offset);

    const dateStr =
      label === "mês"
        ? d.toLocaleDateString("pt-BR", { month: "short" })
        : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

    return { date: dateStr, leads, vendas };
  });
}

// ─── Ranking de Lojas ─────────────────────────────────────────────────────────

export function getStoreRanking(filters: DashboardFilters): StoreRankingRow[] {
  const ids = filters.storeIds.length > 0 ? filters.storeIds : STORES.map((s) => s.id);
  const mult = periodMultiplier(filters.period);

  return STORES.filter((s) => ids.includes(s.id))
    .map((store) => {
      const base      = (STORE_BASE[store.id] ?? 100) * mult;
      const leads     = Math.round(base + rand(-10, 10));
      const won       = Math.round(leads * (0.10 + rand(0, 6) / 100));
      const conv      = parseFloat(((won / leads) * 100).toFixed(1));
      const avgTicket = (STORE_AVG_TICKET[store.id] ?? 55000) + rand(-4000, 6000);
      const revenue   = won * avgTicket;
      const trend     = Array.from({ length: 7 }, () => rand(5, 30));

      return {
        store,
        leads,
        conversion:   conv,
        wonDeals:     won,
        revenue,
        avgTicket,
        avgCycleDays: rand(28, 48),
        trend,
      };
    })
    .sort((a, b) => b.conversion - a.conversion);
}

// ─── Tempo por Etapa ─────────────────────────────────────────────────────────

export function getStageTimeData(_filters: DashboardFilters): StageTimeData[] {
  const stages = FUNNEL_STAGES.filter((s) => !s.isLost);
  const times  = stages.map((s) => STAGE_AVG_DAYS[s.key]);
  const p75    = [...times].sort((a, b) => a - b)[Math.floor(times.length * 0.75)];

  return stages.map((stage) => {
    const avgDays = STAGE_AVG_DAYS[stage.key] + rand(-1, 2);
    return {
      label:       stage.label,
      avgDays,
      isBottleneck: avgDays >= p75 && !stage.isWon,
    };
  });
}
