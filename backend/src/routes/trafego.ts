import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { getPeriodRange, getPreviousPeriodRange } from "../lib/date-ranges.js";
import { requireAuth } from "../lib/require-auth.js";

// ─── Tipos auxiliares ─────────────────────────────────────────────────────────

type TrafegoQuery = {
  period?: string;
  storeIds?: string;
  startDate?: string;
  endDate?: string;
};

type HistoricoQuery = {
  year?: string;
  storeIds?: string;
};

type GoalParams = { storeId: string };

type GoalBody = {
  year: number;
  investmentGoal: number;
  leadsGoal: number;
  salesGoal: number;
  revenueGoal: number;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

type LeadOrigem = "meta" | "google" | "instagram" | "organico";

function deriveOrigem(utmSource: string | null, utmMedium: string | null): LeadOrigem {
  const src = (utmSource ?? "").toLowerCase();
  const med = (utmMedium  ?? "").toLowerCase();
  if (!src && !med) return "organico";
  if (src.includes("instagram") || med === "link_in_bio" || med === "instagram") return "instagram";
  if (src.includes("facebook") || src === "fb" || src.includes("meta")) return "meta";
  if (src.includes("google")) return "google";
  if (med === "cpc" || med === "paid" || med === "paidsocial") return "meta";
  return "organico";
}

function delta(current: number, previous: number): number {
  if (previous === 0) return 0;
  return parseFloat(((current - previous) / previous * 100).toFixed(1));
}

function resolvePeriodDates(query: TrafegoQuery): { start: Date; end: Date } {
  if (query.period === "custom" && query.startDate && query.endDate) {
    return {
      start: new Date(query.startDate),
      end:   new Date(query.endDate),
    };
  }
  const validPeriods = new Set(["7d", "30d", "90d"]);
  const period = validPeriods.has(query.period ?? "") ? (query.period as "7d" | "30d" | "90d") : "30d";
  return getPeriodRange(period);
}

function resolvePreviousDates(query: TrafegoQuery): { start: Date; end: Date } {
  if (query.period === "custom" && query.startDate && query.endDate) {
    const start = new Date(query.startDate);
    const end   = new Date(query.endDate);
    const durationMs = end.getTime() - start.getTime();
    return {
      start: new Date(start.getTime() - durationMs),
      end:   new Date(start.getTime()),
    };
  }
  const validPeriods = new Set(["7d", "30d", "90d"]);
  const period = validPeriods.has(query.period ?? "") ? (query.period as "7d" | "30d" | "90d") : "30d";
  return getPreviousPeriodRange(period);
}

function parseStoreIds(raw: string | undefined): string[] {
  return (raw ?? "").split(",").map((s) => s.trim()).filter(Boolean);
}

function buildStoreFilter(storeIds: string[]) {
  return storeIds.length > 0 ? { storeId: { in: storeIds } } : {};
}

async function resolveEffectiveStoreIds(
  tenantId: string,
  requestedIds: string[],
): Promise<string[]> {
  if (requestedIds.length > 0) return requestedIds;
  const stores = await prisma.store.findMany({
    where:  { tenantId },
    select: { id: true },
  });
  return stores.map((s) => s.id);
}

// ─── Plugin ───────────────────────────────────────────────────────────────────

export async function trafegoRoutes(app: FastifyInstance): Promise<void> {

  app.addHook("preHandler", async (request, reply) => {
    await requireAuth(request, reply);
    if (reply.sent) return;
    const { tenantId } = request.jwtUser!;
    (request as unknown as Record<string, unknown>).tenant = { id: tenantId };
  });

  // ── GET /api/trafego/overview ─────────────────────────────────────────────

  app.get<{ Querystring: TrafegoQuery }>("/api/trafego/overview", async (request, reply) => {
    const tenant   = (request as unknown as Record<string, unknown>).tenant as { id: string };
    const query    = request.query;

    const requestedIds  = parseStoreIds(query.storeIds);
    const { role, storeIds: allowedIds } = request.jwtUser!;
    const filteredIds = role === "admin"
      ? requestedIds
      : requestedIds.filter((id) => allowedIds.includes(id));
    const storeIds = await resolveEffectiveStoreIds(tenant.id, filteredIds);

    const { start, end }     = resolvePeriodDates(query);
    const { start: ps, end: pe } = resolvePreviousDates(query);

    const storeFilter = buildStoreFilter(storeIds);

    // Métricas de ads no período
    const [adsCurrent, adsPrevious] = await Promise.all([
      prisma.adMetricDaily.findMany({
        where: { tenantId: tenant.id, ...storeFilter, date: { gte: start, lte: end } },
        select: { platform: true, spend: true, impressions: true, clicks: true, leads: true, sales: true, revenue: true, date: true },
      }),
      prisma.adMetricDaily.findMany({
        where: { tenantId: tenant.id, ...storeFilter, date: { gte: ps, lte: pe } },
        select: { spend: true, impressions: true, clicks: true, leads: true, sales: true, revenue: true },
      }),
    ]);

    const sumCurrent = adsCurrent.reduce(
      (acc, r) => ({
        spend:       acc.spend + r.spend,
        impressions: acc.impressions + r.impressions,
        clicks:      acc.clicks + r.clicks,
        leads:       acc.leads + r.leads,
        sales:       acc.sales + r.sales,
        revenue:     acc.revenue + r.revenue,
      }),
      { spend: 0, impressions: 0, clicks: 0, leads: 0, sales: 0, revenue: 0 },
    );

    const sumPrev = adsPrevious.reduce(
      (acc, r) => ({
        spend:       acc.spend + r.spend,
        impressions: acc.impressions + r.impressions,
        clicks:      acc.clicks + r.clicks,
        leads:       acc.leads + r.leads,
        sales:       acc.sales + r.sales,
        revenue:     acc.revenue + r.revenue,
      }),
      { spend: 0, impressions: 0, clicks: 0, leads: 0, sales: 0, revenue: 0 },
    );

    // Leads CRM que avançaram além de lead_capturado
    const firstStage = await prisma.funnelStage.findFirst({
      where:   { tenantId: tenant.id, orderIndex: 1 },
      select:  { id: true },
    });

    const wonStages = await prisma.funnelStage.findMany({
      where:  { tenantId: tenant.id, isWon: true },
      select: { id: true },
    });
    const wonStageIds = wonStages.map((s) => s.id);

    const [atendimentosRows, mqlRows] = await Promise.all([
      firstStage
        ? prisma.leadEvent.findMany({
            where: {
              tenantId:   tenant.id,
              ...storeFilter,
              occurredAt: { gte: start, lte: end },
              fromStageId: firstStage.id,
            },
            distinct: ["leadId"],
            select:   { leadId: true },
          })
        : Promise.resolve([]),
      prisma.funnelStage.findMany({
        where:  { tenantId: tenant.id, orderIndex: { gte: 2 } },
        select: { id: true },
      }).then((stages) =>
        prisma.leadEvent.findMany({
          where: {
            tenantId:   tenant.id,
            ...storeFilter,
            occurredAt: { gte: start, lte: end },
            toStageId:  { in: stages.map((s) => s.id) },
          },
          distinct: ["leadId"],
          select:   { leadId: true },
        })
      ),
    ]);

    // Revenue CRM período
    const [revenueLeads, prevRevenueLeads] = await Promise.all([
      prisma.lead.findMany({
        where: { tenantId: tenant.id, ...storeFilter, revenueAt: { gte: start, lte: end }, revenue: { not: null } },
        select: { revenue: true },
      }),
      prisma.lead.findMany({
        where: { tenantId: tenant.id, ...storeFilter, revenueAt: { gte: ps, lte: pe }, revenue: { not: null } },
        select: { revenue: true },
      }),
    ]);

    const faturamento     = revenueLeads.reduce((s, l) => s + (l.revenue ?? 0), 0);
    const prevFaturamento = prevRevenueLeads.reduce((s, l) => s + (l.revenue ?? 0), 0);
    const ticketMedio     = revenueLeads.length > 0 ? Math.round(faturamento / revenueLeads.length) : 0;
    const prevTicket      = prevRevenueLeads.length > 0 ? Math.round(prevFaturamento / prevRevenueLeads.length) : 0;

    const vendas     = sumCurrent.sales;
    const prevVendas = sumPrev.sales;

    const ctr = sumCurrent.impressions > 0
      ? parseFloat(((sumCurrent.clicks / sumCurrent.impressions) * 100).toFixed(2))
      : 0;

    const cpl     = sumCurrent.leads > 0 ? Math.round(sumCurrent.spend / sumCurrent.leads * 100) / 100 : 0;
    const prevCpl = sumPrev.leads > 0 ? Math.round(sumPrev.spend / sumPrev.leads * 100) / 100 : 0;

    const cps     = vendas > 0 ? Math.round(sumCurrent.spend / vendas * 100) / 100 : 0;
    const prevCps = prevVendas > 0 ? Math.round(sumPrev.spend / prevVendas * 100) / 100 : 0;

    const mql = sumCurrent.leads > 0
      ? parseFloat(((mqlRows.length / sumCurrent.leads) * 100).toFixed(1))
      : 0;

    const roi     = sumCurrent.spend > 0 ? parseFloat(((faturamento / sumCurrent.spend) * 100).toFixed(1)) : 0;
    const prevRoi = sumPrev.spend > 0 ? parseFloat(((prevFaturamento / sumPrev.spend) * 100).toFixed(1)) : 0;

    // Série temporal diária
    const dateMap = new Map<string, { investimento: number; faturamento: number; vendas: number; spend: number }>();

    for (const r of adsCurrent) {
      const key = r.date.toISOString().substring(0, 10);
      const existing = dateMap.get(key) ?? { investimento: 0, faturamento: 0, vendas: 0, spend: 0 };
      dateMap.set(key, {
        investimento: existing.investimento + r.spend,
        faturamento:  existing.faturamento + r.revenue,
        vendas:       existing.vendas + r.sales,
        spend:        existing.spend + r.spend,
      });
    }

    const temporal = Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({
        date,
        investimento: Math.round(v.investimento * 100) / 100,
        faturamento:  Math.round(v.faturamento * 100) / 100,
        roi:          v.spend > 0 ? parseFloat(((v.faturamento / v.spend) * 100).toFixed(1)) : 0,
        vendas:       v.vendas,
        cps:          v.vendas > 0 ? Math.round(v.spend / v.vendas * 100) / 100 : 0,
      }));

    // Por plataforma
    const googleRows = adsCurrent.filter((r) => r.platform === "google");
    const metaRows   = adsCurrent.filter((r) => r.platform === "meta");

    const googleSpend  = googleRows.reduce((s, r) => s + r.spend, 0);
    const googleLeads  = googleRows.reduce((s, r) => s + r.leads, 0);
    const metaSpend    = metaRows.reduce((s, r) => s + r.spend, 0);
    const metaLeads    = metaRows.reduce((s, r) => s + r.leads, 0);
    const metaClicks   = metaRows.reduce((s, r) => s + r.clicks, 0);
    const metaImpressions = metaRows.reduce((s, r) => s + r.impressions, 0);

    const googleDateMap = new Map<string, { leads: number; investido: number }>();
    const metaDateMap   = new Map<string, { leads: number; investido: number }>();

    for (const r of adsCurrent) {
      const key = r.date.toISOString().substring(0, 10);
      const map = r.platform === "google" ? googleDateMap : metaDateMap;
      const ex  = map.get(key) ?? { leads: 0, investido: 0 };
      map.set(key, { leads: ex.leads + r.leads, investido: ex.investido + r.spend });
    }

    const toTemporalArray = (m: Map<string, { leads: number; investido: number }>) =>
      Array.from(m.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, v]) => ({ date, leads: v.leads, investido: Math.round(v.investido * 100) / 100 }));

    const metaCtr = metaImpressions > 0
      ? parseFloat(((metaClicks / metaImpressions) * 100).toFixed(2))
      : 0;

    return reply.send({
      funnel: {
        impressions:       sumCurrent.impressions,
        impressionsDelta:  delta(sumCurrent.impressions, sumPrev.impressions),
        clicks:            sumCurrent.clicks,
        clicksDelta:       delta(sumCurrent.clicks, sumPrev.clicks),
        ctr,
        leads:             sumCurrent.leads,
        leadsDelta:        delta(sumCurrent.leads, sumPrev.leads),
        cpl,
        cplDelta:          delta(cpl, prevCpl),
        atendimentos:      atendimentosRows.length,
        mql,
        vendas,
        vendasDelta:       delta(vendas, prevVendas),
        ticketMedio,
        ticketMedioDelta:  delta(ticketMedio, prevTicket),
        cps,
        cpsDelta:          delta(cps, prevCps),
        percentVendas:     sumCurrent.leads > 0
          ? parseFloat(((vendas / sumCurrent.leads) * 100).toFixed(1))
          : 0,
      },
      macro: {
        investimento:      Math.round(sumCurrent.spend * 100) / 100,
        investimentoDelta: delta(sumCurrent.spend, sumPrev.spend),
        faturamento:       Math.round(faturamento * 100) / 100,
        faturamentoDelta:  delta(faturamento, prevFaturamento),
        roi,
        roiDelta:          delta(roi, prevRoi),
      },
      temporal,
      google: {
        investido: Math.round(googleSpend * 100) / 100,
        leads:     googleLeads,
        cpl:       googleLeads > 0 ? Math.round(googleSpend / googleLeads * 100) / 100 : 0,
        temporal:  toTemporalArray(googleDateMap),
      },
      meta: {
        investido:  Math.round(metaSpend * 100) / 100,
        leads:      metaLeads,
        cpl:        metaLeads > 0 ? Math.round(metaSpend / metaLeads * 100) / 100 : 0,
        conversao:  metaCtr,
        temporal:   toTemporalArray(metaDateMap),
      },
    });
  });

  // ── GET /api/trafego/detalhamento ────────────────────────────────────────────

  app.get<{ Querystring: TrafegoQuery }>("/api/trafego/detalhamento", async (request, reply) => {
    const tenant = (request as unknown as Record<string, unknown>).tenant as { id: string };
    const query  = request.query;

    const requestedIds = parseStoreIds(query.storeIds);
    const { role, storeIds: allowedIds } = request.jwtUser!;
    const filteredIds = role === "admin"
      ? requestedIds
      : requestedIds.filter((id) => allowedIds.includes(id));
    const storeIds = await resolveEffectiveStoreIds(tenant.id, filteredIds);

    const { start, end } = resolvePeriodDates(query);
    const storeFilter    = buildStoreFilter(storeIds);

    const [adMetrics, demographics, searchTerms, geoMetrics, creatives] = await Promise.all([
      prisma.adMetricDaily.findMany({
        where:  { tenantId: tenant.id, ...storeFilter, date: { gte: start, lte: end } },
        select: { platform: true, spend: true, impressions: true, clicks: true, leads: true, messages: true },
      }),
      prisma.adDemographic.findMany({
        where:  { tenantId: tenant.id, ...storeFilter, date: { gte: start, lte: end } },
        select: { platform: true, dimension: true, bucket: true, leads: true, spend: true },
      }),
      prisma.adSearchTerm.findMany({
        where:   { tenantId: tenant.id, ...storeFilter, periodStart: { gte: start } },
        select:  { term: true, impressions: true, clicks: true, conversions: true, cost: true },
        orderBy: { conversions: "desc" },
        take:    50,
      }),
      prisma.adGeoMetric.findMany({
        where:  { tenantId: tenant.id, ...storeFilter, date: { gte: start, lte: end } },
        select: { platform: true, state: true, leads: true, spend: true },
      }),
      prisma.adCreative.findMany({
        where:   { tenantId: tenant.id, ...storeFilter, periodStart: { gte: start } },
        select:  { name: true, type: true, subPlatform: true, leads: true, messages: true, spend: true },
        orderBy: { leads: "desc" },
        take:    20,
      }),
    ]);

    // Google KPIs
    const googleAds = adMetrics.filter((r) => r.platform === "google");
    const gKpis = googleAds.reduce(
      (acc, r) => ({
        investido:   acc.investido + r.spend,
        leads:       acc.leads + r.leads,
        clicks:      acc.clicks + r.clicks,
        impressions: acc.impressions + r.impressions,
      }),
      { investido: 0, leads: 0, clicks: 0, impressions: 0 },
    );

    // Meta KPIs
    const metaAds = adMetrics.filter((r) => r.platform === "meta");
    const mKpis = metaAds.reduce(
      (acc, r) => ({
        investido:   acc.investido + r.spend,
        leads:       acc.leads + r.leads,
        clicks:      acc.clicks + r.clicks,
        impressions: acc.impressions + r.impressions,
        mensagens:   acc.mensagens + r.messages,
      }),
      { investido: 0, leads: 0, clicks: 0, impressions: 0, mensagens: 0 },
    );

    // Demographics por plataforma
    const buildDemoGroups = (platform: string) => {
      const rows = demographics.filter((r) => r.platform === platform);
      const grouped = new Map<string, Map<string, { leads: number; spend: number }>>();

      for (const r of rows) {
        if (!grouped.has(r.dimension)) grouped.set(r.dimension, new Map());
        const dim = grouped.get(r.dimension)!;
        const existing = dim.get(r.bucket) ?? { leads: 0, spend: 0 };
        dim.set(r.bucket, { leads: existing.leads + r.leads, spend: existing.spend + r.spend });
      }

      const toArray = (dim: string) =>
        Array.from(grouped.get(dim)?.entries() ?? []).map(([bucket, v]) => ({
          bucket,
          leads: v.leads,
          spend: Math.round(v.spend * 100) / 100,
        }));

      return {
        age:    toArray("age"),
        gender: toArray("gender"),
        device: toArray("device"),
      };
    };

    // Search terms Google
    const termMap = new Map<string, { impressions: number; clicks: number; conversions: number; cost: number }>();
    for (const t of searchTerms) {
      const existing = termMap.get(t.term) ?? { impressions: 0, clicks: 0, conversions: 0, cost: 0 };
      termMap.set(t.term, {
        impressions: existing.impressions + t.impressions,
        clicks:      existing.clicks + t.clicks,
        conversions: existing.conversions + t.conversions,
        cost:        existing.cost + t.cost,
      });
    }
    const topSearchTerms = Array.from(termMap.entries())
      .map(([term, v]) => ({
        term,
        conversions: v.conversions,
        cpl:         v.conversions > 0 ? Math.round(v.cost / v.conversions * 100) / 100 : 0,
        clicks:      v.clicks,
        impressions: v.impressions,
      }))
      .sort((a, b) => b.conversions - a.conversions)
      .slice(0, 20);

    // Geo por plataforma
    const buildGeo = (platform: string) => {
      const stateMap = new Map<string, { leads: number; spend: number }>();
      for (const r of geoMetrics.filter((g) => g.platform === platform)) {
        const existing = stateMap.get(r.state) ?? { leads: 0, spend: 0 };
        stateMap.set(r.state, { leads: existing.leads + r.leads, spend: existing.spend + r.spend });
      }
      return Array.from(stateMap.entries())
        .map(([state, v]) => ({ state, leads: v.leads, spend: Math.round(v.spend * 100) / 100 }))
        .sort((a, b) => b.leads - a.leads);
    };

    // Top ads Meta
    const topAds = creatives.map((c) => ({
      name:        c.name,
      type:        c.type,
      subPlatform: c.subPlatform ?? "",
      leads:       c.leads,
      messages:    c.messages,
      spend:       Math.round(c.spend * 100) / 100,
      cpl:         c.leads > 0 ? Math.round(c.spend / c.leads * 100) / 100 : 0,
    }));

    // Leads por sub-plataforma Meta (via criativos)
    const subPlatformMap = new Map<string, number>();
    for (const c of creatives) {
      const key = c.subPlatform ?? "outros";
      subPlatformMap.set(key, (subPlatformMap.get(key) ?? 0) + c.leads);
    }
    const leadsBySubPlatform = Array.from(subPlatformMap.entries())
      .map(([platform, leads]) => ({ platform, leads }))
      .sort((a, b) => b.leads - a.leads);

    return reply.send({
      google: {
        kpis: {
          investido:   Math.round(gKpis.investido * 100) / 100,
          leads:       gKpis.leads,
          cpl:         gKpis.leads > 0 ? Math.round(gKpis.investido / gKpis.leads * 100) / 100 : 0,
          clicks:      gKpis.clicks,
          impressions: gKpis.impressions,
        },
        demographics: buildDemoGroups("google"),
        searchTerms:  topSearchTerms,
        geo:          buildGeo("google"),
      },
      meta: {
        kpis: {
          investido:  Math.round(mKpis.investido * 100) / 100,
          leads:      mKpis.leads,
          cpl:        mKpis.leads > 0 ? Math.round(mKpis.investido / mKpis.leads * 100) / 100 : 0,
          conversao:  mKpis.impressions > 0
            ? parseFloat(((mKpis.clicks / mKpis.impressions) * 100).toFixed(2))
            : 0,
          mensagens:  mKpis.mensagens,
          cpm:        mKpis.impressions > 0
            ? Math.round((mKpis.investido / mKpis.impressions) * 1000 * 100) / 100
            : 0,
        },
        demographics:       buildDemoGroups("meta"),
        topAds,
        leadsBySubPlatform,
      },
    });
  });

  // ── GET /api/trafego/historico ────────────────────────────────────────────────

  app.get<{ Querystring: HistoricoQuery }>("/api/trafego/historico", async (request, reply) => {
    const tenant = (request as unknown as Record<string, unknown>).tenant as { id: string };
    const query  = request.query;

    const currentYear = new Date().getFullYear();
    const year = parseInt(query.year ?? String(currentYear), 10);
    if (isNaN(year)) return reply.code(400).send({ error: "Parâmetro year inválido." });

    const requestedIds = parseStoreIds(query.storeIds);
    const { role, storeIds: allowedIds } = request.jwtUser!;
    const filteredIds = role === "admin"
      ? requestedIds
      : requestedIds.filter((id) => allowedIds.includes(id));
    const storeIds = await resolveEffectiveStoreIds(tenant.id, filteredIds);
    const storeFilter = buildStoreFilter(storeIds);

    const yearStart = new Date(year, 0, 1);
    const yearEnd   = new Date(year, 11, 31, 23, 59, 59, 999);
    const prevYearStart = new Date(year - 1, 0, 1);
    const prevYearEnd   = new Date(year - 1, 11, 31, 23, 59, 59, 999);

    // Métricas de ads anuais e anterior
    const [adsYear, adsPrevYear] = await Promise.all([
      prisma.adMetricDaily.findMany({
        where:  { tenantId: tenant.id, ...storeFilter, date: { gte: yearStart, lte: yearEnd } },
        select: { platform: true, spend: true, leads: true, sales: true, revenue: true, date: true },
      }),
      prisma.adMetricDaily.findMany({
        where:  { tenantId: tenant.id, ...storeFilter, date: { gte: prevYearStart, lte: prevYearEnd } },
        select: { spend: true, leads: true, sales: true, revenue: true },
      }),
    ]);

    // Revenue CRM anual
    const [revenueYear, revenuePrevYear] = await Promise.all([
      prisma.lead.findMany({
        where:  { tenantId: tenant.id, ...storeFilter, revenueAt: { gte: yearStart, lte: yearEnd }, revenue: { not: null } },
        select: { revenue: true, revenueAt: true },
      }),
      prisma.lead.findMany({
        where:  { tenantId: tenant.id, ...storeFilter, revenueAt: { gte: prevYearStart, lte: prevYearEnd }, revenue: { not: null } },
        select: { revenue: true },
      }),
    ]);

    // Metas
    const goals = await prisma.trafficGoal.findMany({
      where:  { tenantId: tenant.id, ...storeFilter, year },
      select: { investmentGoal: true, leadsGoal: true, salesGoal: true, revenueGoal: true },
    });

    const totalGoal = goals.reduce(
      (acc, g) => ({
        investmentGoal: acc.investmentGoal + g.investmentGoal,
        leadsGoal:      acc.leadsGoal + g.leadsGoal,
        salesGoal:      acc.salesGoal + g.salesGoal,
        revenueGoal:    acc.revenueGoal + g.revenueGoal,
      }),
      { investmentGoal: 0, leadsGoal: 0, salesGoal: 0, revenueGoal: 0 },
    );

    type AdSumRow = { spend: number; leads: number; sales: number; revenue: number };
    const sum = (rows: AdSumRow[]) =>
      rows.reduce((acc, r) => ({
        spend:   acc.spend + r.spend,
        leads:   acc.leads + r.leads,
        sales:   acc.sales + r.sales,
        revenue: acc.revenue + r.revenue,
      }), { spend: 0, leads: 0, sales: 0, revenue: 0 });

    const cur  = sum(adsYear);
    const prev = sum(adsPrevYear);

    const faturamentoYear     = revenueYear.reduce((s, l) => s + (l.revenue ?? 0), 0);
    const faturamentoPrevYear = revenuePrevYear.reduce((s, l) => s + (l.revenue ?? 0), 0);

    const roi     = cur.spend > 0 ? parseFloat(((faturamentoYear / cur.spend) * 100).toFixed(1)) : 0;
    const prevRoi = prev.spend > 0 ? parseFloat(((faturamentoPrevYear / prev.spend) * 100).toFixed(1)) : 0;

    // Mensal
    const monthlyAdMap = new Map<string, { spend: number; leads: number; sales: number; google: number; meta: number }>();

    for (const r of adsYear) {
      const key = `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, "0")}`;
      const ex  = monthlyAdMap.get(key) ?? { spend: 0, leads: 0, sales: 0, google: 0, meta: 0 };
      monthlyAdMap.set(key, {
        spend:  ex.spend + r.spend,
        leads:  ex.leads + r.leads,
        sales:  ex.sales + r.sales,
        google: ex.google + (r.platform === "google" ? r.leads : 0),
        meta:   ex.meta   + (r.platform === "meta"   ? r.leads : 0),
      });
    }

    const monthlyRevenueMap = new Map<string, number>();
    for (const l of revenueYear) {
      if (!l.revenueAt) continue;
      const key = `${l.revenueAt.getFullYear()}-${String(l.revenueAt.getMonth() + 1).padStart(2, "0")}`;
      monthlyRevenueMap.set(key, (monthlyRevenueMap.get(key) ?? 0) + (l.revenue ?? 0));
    }

    // Gera todos os meses do ano
    const mensal = Array.from({ length: 12 }, (_, i) => {
      const month = `${year}-${String(i + 1).padStart(2, "0")}`;
      const ads   = monthlyAdMap.get(month) ?? { spend: 0, leads: 0, sales: 0, google: 0, meta: 0 };
      const fat   = monthlyRevenueMap.get(month) ?? 0;
      return {
        month,
        investimento: Math.round(ads.spend * 100) / 100,
        leads:        ads.leads,
        vendas:       ads.sales,
        faturamento:  Math.round(fat * 100) / 100,
        roi:          ads.spend > 0 ? parseFloat(((fat / ads.spend) * 100).toFixed(1)) : 0,
        google:       ads.google,
        meta:         ads.meta,
      };
    });

    // Leads por canal (CRM)
    const crmLeads = await prisma.lead.findMany({
      where:  { tenantId: tenant.id, ...storeFilter, enteredAt: { gte: yearStart, lte: yearEnd } },
      select: { enteredAt: true, utmSource: true, utmMedium: true, origemManual: true },
    });

    const VALID_ORIGINS = new Set(["meta", "google", "instagram", "organico", "indicacao", "evento"]);
    const channelMap = new Map<string, { google: number; meta: number; instagram: number; organico: number; indicacao: number; evento: number; total: number }>();

    const emptyChannels = () => ({ google: 0, meta: 0, instagram: 0, organico: 0, indicacao: 0, evento: 0, total: 0 });

    for (const lead of crmLeads) {
      const mKey = `${lead.enteredAt.getFullYear()}-${String(lead.enteredAt.getMonth() + 1).padStart(2, "0")}`;
      const row  = channelMap.get(mKey) ?? emptyChannels();
      const manual = lead.origemManual && VALID_ORIGINS.has(lead.origemManual) ? lead.origemManual : null;
      const origem = manual ?? deriveOrigem(lead.utmSource, lead.utmMedium);

      if (origem in row) {
        (row as Record<string, number>)[origem]++;
      }
      row.total++;
      channelMap.set(mKey, row);
    }

    const leadsPorCanal = Array.from({ length: 12 }, (_, i) => {
      const month = `${year}-${String(i + 1).padStart(2, "0")}`;
      return { month, ...(channelMap.get(month) ?? emptyChannels()) };
    });

    return reply.send({
      kpisAnuais: {
        investimento: {
          atual:    Math.round(cur.spend * 100) / 100,
          anterior: Math.round(prev.spend * 100) / 100,
          goal:     goals.length > 0 ? totalGoal.investmentGoal : null,
        },
        leads: {
          atual:    cur.leads,
          anterior: prev.leads,
          goal:     goals.length > 0 ? totalGoal.leadsGoal : null,
        },
        vendas: {
          atual:    cur.sales,
          anterior: prev.sales,
          goal:     goals.length > 0 ? totalGoal.salesGoal : null,
        },
        faturamento: {
          atual:    Math.round(faturamentoYear * 100) / 100,
          anterior: Math.round(faturamentoPrevYear * 100) / 100,
          goal:     goals.length > 0 ? totalGoal.revenueGoal : null,
        },
        roi: {
          atual:    roi,
          anterior: prevRoi,
        },
      },
      mensal,
      leadsPorCanal,
    });
  });

  // ── GET /api/trafego/goals/:storeId ──────────────────────────────────────────

  app.get<{ Params: GoalParams }>("/api/trafego/goals/:storeId", async (request, reply) => {
    const tenant  = (request as unknown as Record<string, unknown>).tenant as { id: string };
    const { storeId } = request.params;
    const year = new Date().getFullYear();

    const goal = await prisma.trafficGoal.findUnique({
      where: { tenantId_storeId_year: { tenantId: tenant.id, storeId, year } },
    });

    if (!goal) return reply.code(404).send({ error: "Meta não encontrada para esta loja no ano atual." });

    return reply.send(goal);
  });

  // ── PUT /api/trafego/goals/:storeId ──────────────────────────────────────────

  app.put<{ Params: GoalParams; Body: GoalBody }>("/api/trafego/goals/:storeId", async (request, reply) => {
    const tenant  = (request as unknown as Record<string, unknown>).tenant as { id: string };
    const { storeId } = request.params;
    const body = request.body;

    if (!body.year || typeof body.year !== "number") {
      return reply.code(400).send({ error: "Campo year é obrigatório e deve ser um número." });
    }

    const store = await prisma.store.findFirst({ where: { id: storeId, tenantId: tenant.id } });
    if (!store) return reply.code(404).send({ error: "Loja não encontrada." });

    const goal = await prisma.trafficGoal.upsert({
      where: {
        tenantId_storeId_year: { tenantId: tenant.id, storeId, year: body.year },
      },
      update: {
        investmentGoal: body.investmentGoal ?? 0,
        leadsGoal:      body.leadsGoal ?? 0,
        salesGoal:      body.salesGoal ?? 0,
        revenueGoal:    body.revenueGoal ?? 0,
      },
      create: {
        tenantId:      tenant.id,
        storeId,
        year:          body.year,
        investmentGoal: body.investmentGoal ?? 0,
        leadsGoal:      body.leadsGoal ?? 0,
        salesGoal:      body.salesGoal ?? 0,
        revenueGoal:    body.revenueGoal ?? 0,
      },
    });

    return reply.send(goal);
  });
}
