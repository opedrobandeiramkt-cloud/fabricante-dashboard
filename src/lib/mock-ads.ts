import type {
  TrafegoOverview,
  TrafegoDetalhamento,
  TrafegoHistorico,
  AdPlatformMetrics,
  DemographicSlice,
  SearchTermRow,
  AdCreativeRow,
  GeoMetricRow,
  DashboardFilters,
} from "./types";

function seed(filters: DashboardFilters, offset = 0): number {
  const str = filters.period + filters.storeIds.join("") + offset;
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h) / 2147483647;
}

function lerp(min: number, max: number, t: number): number {
  return Math.round(min + (max - min) * t);
}

function lerpF(min: number, max: number, t: number): number {
  return min + (max - min) * t;
}

function makeTemporal(
  days: number,
  baseLeads: number,
  baseInvestido: number,
  s: (offset: number) => number
): Array<{ date: string; leads: number; investido: number }> {
  const today = new Date(2026, 4, 2);
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (days - 1 - i));
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const noise = 0.6 + s(i + 100) * 0.8;
    return {
      date: `${dd}/${mm}`,
      leads: Math.max(1, Math.round(baseLeads * noise)),
      investido: Math.round(baseInvestido * noise),
    };
  });
}

function makePlatformMetrics(
  filters: DashboardFilters,
  platform: "google" | "meta",
  baseFraction: number
): AdPlatformMetrics {
  const off = platform === "google" ? 0 : 50;
  const s = (o: number) => seed(filters, off + o);

  const investido = lerp(4000, 14000, s(1)) * baseFraction;
  const leads = lerp(60, 180, s(2));
  const cpl = Math.round(investido / leads);
  const clicks = lerp(400, 1800, s(3));
  const impressions = lerp(20000, 120000, s(4));
  const cpm = Math.round((investido / impressions) * 1000);
  const mensagens = platform === "meta" ? lerp(30, 120, s(5)) : undefined;
  const conversao = lerpF(2, 8, s(6));
  const days = filters.period === "7d" ? 7 : filters.period === "30d" ? 30 : filters.period === "90d" ? 90 : 30;
  const temporal = makeTemporal(Math.min(days, 30), leads / 30, investido / 30, (o) => seed(filters, off + o + 200));

  return {
    investido: Math.round(investido),
    leads,
    cpl,
    conversao: parseFloat(conversao.toFixed(1)),
    mensagens,
    cpm,
    clicks,
    impressions,
    temporal,
  };
}

export function getMockTrafegoOverview(filters: DashboardFilters): TrafegoOverview {
  const s = (o: number) => seed(filters, o);

  const investimento = lerp(8000, 25000, s(1));
  const leads = lerp(120, 300, s(2));
  const vendas = lerp(8, 30, s(3));
  const ticketMedio = lerp(35000, 80000, s(4));
  const faturamento = vendas * ticketMedio;
  const roi = parseFloat(((faturamento / investimento) * 100).toFixed(1));
  const impressions = lerp(80000, 300000, s(5));
  const clicks = lerp(1500, 6000, s(6));
  const ctr = parseFloat(((clicks / impressions) * 100).toFixed(2));
  const cpl = Math.round(investimento / leads);
  const cps = Math.round(investimento / Math.max(vendas, 1));
  const atendimentos = lerp(60, 200, s(7));
  const mql = Math.round(atendimentos * lerpF(0.4, 0.75, s(8)));

  const funnel = {
    impressions,
    impressionsDelta: lerp(-15, 35, s(10)),
    clicks,
    clicksDelta: lerp(-10, 25, s(11)),
    ctr,
    leads,
    leadsDelta: lerp(-12, 28, s(12)),
    cpl,
    cplDelta: lerp(-20, 15, s(13)),
    atendimentos,
    mql,
    vendas,
    vendasDelta: lerp(-10, 40, s(14)),
    ticketMedio,
    ticketMedioDelta: lerp(-8, 20, s(15)),
    cps,
    cpsDelta: lerp(-18, 10, s(16)),
    percentVendas: parseFloat(((vendas / leads) * 100).toFixed(1)),
  };

  const macro = {
    investimento,
    investimentoDelta: lerp(-10, 30, s(20)),
    faturamento,
    faturamentoDelta: lerp(-5, 45, s(21)),
    roi,
    roiDelta: lerp(-8, 25, s(22)),
  };

  const days = filters.period === "7d" ? 7 : filters.period === "30d" ? 30 : filters.period === "90d" ? 90 : 30;
  const numPoints = Math.min(days, 30);
  const today = new Date(2026, 4, 2);

  const temporal = Array.from({ length: numPoints }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (numPoints - 1 - i));
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const noise = 0.5 + seed(filters, i + 300) * 1.0;
    const inv = Math.round((investimento / numPoints) * noise);
    const fat = Math.round((faturamento / numPoints) * noise);
    const v = Math.max(0, Math.round((vendas / numPoints) * noise));
    const r = parseFloat(((fat / Math.max(inv, 1)) * 100).toFixed(1));
    return {
      date: `${dd}/${mm}`,
      investimento: inv,
      faturamento: fat,
      roi: r,
      vendas: v,
      cps: v > 0 ? Math.round(inv / v) : 0,
    };
  });

  const googleFrac = lerpF(0.45, 0.65, s(30));
  const google = makePlatformMetrics(filters, "google", googleFrac);
  const meta = makePlatformMetrics(filters, "meta", 1 - googleFrac);

  return { funnel, macro, temporal, google, meta };
}

export function getMockTrafegoDetalhamento(filters: DashboardFilters): TrafegoDetalhamento {
  const s = (o: number) => seed(filters, o);

  const ageGroups = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"];
  const ageWeightsG = [0.08, 0.28, 0.32, 0.18, 0.10, 0.04];
  const ageWeightsM = [0.12, 0.30, 0.28, 0.16, 0.10, 0.04];

  function makeAgeDemo(weights: number[], baseLeads: number, baseSpend: number): DemographicSlice[] {
    return ageGroups.map((bucket, i) => ({
      bucket,
      leads: Math.round(baseLeads * weights[i]),
      spend: Math.round(baseSpend * weights[i]),
    }));
  }

  const googleLeads = lerp(60, 160, s(1));
  const googleSpend = lerp(4000, 13000, s(2));
  const metaLeads = lerp(50, 140, s(51));
  const metaSpend = lerp(3000, 12000, s(52));

  const searchTerms: SearchTermRow[] = [
    "piscina de fibra", "piscina preço", "piscina igui", "piscina residencial",
    "piscina de vinil", "piscina splash", "instalar piscina", "piscina pequena",
    "piscina grande", "piscina com aquecimento", "piscina sob medida",
    "piscina de alvenaria", "piscina ecológica", "piscina semi olímpica",
    "manutenção piscina", "piscina spa", "piscina de concreto", "piscina polipropileno",
    "piscina retangular", "piscina redonda",
  ].map((term, i) => {
    const t = s(i + 400);
    const conversions = lerp(1, 25, t);
    const cpl = lerp(80, 400, seed(filters, i + 420));
    const clicks = lerp(20, 300, seed(filters, i + 440));
    const impressions = lerp(500, 8000, seed(filters, i + 460));
    return { term, conversions, cpl, clicks, impressions };
  }).sort((a, b) => b.conversions - a.conversions);

  const adNames = [
    "Piscina Fibra - Promoção", "Verão 2026 - Fibra", "Antes e Depois - Residencial",
    "Piscina Splash - Video", "iGUi Premium - Carrossel", "Família na Piscina",
    "Financiamento 60x - Meta", "Google Search - Brand",
  ];
  const adTypes = ["image", "video", "carousel", "image", "carousel", "video", "image", "image"];
  const adSubPlatforms = ["instagram", "facebook", "instagram", "reels", "facebook", "instagram", "facebook", "google"];

  const topAds: AdCreativeRow[] = adNames.map((name, i) => {
    const t = seed(filters, i + 500);
    const leads = lerp(5, 45, t);
    const messages = adSubPlatforms[i] !== "google" ? lerp(3, 30, seed(filters, i + 520)) : 0;
    const spend = lerp(300, 2500, seed(filters, i + 540));
    return {
      name,
      type: adTypes[i],
      subPlatform: adSubPlatforms[i],
      leads,
      messages,
      spend,
      cpl: Math.round(spend / Math.max(leads, 1)),
    };
  });

  const states = ["SP", "RJ", "MG", "PR", "SC", "RS", "BA", "GO", "PE", "CE", "ES", "MT", "MS", "DF", "AM"];
  const stateWeights = [0.32, 0.18, 0.12, 0.09, 0.07, 0.06, 0.04, 0.03, 0.03, 0.02, 0.02, 0.01, 0.01, 0.01, 0.01];

  const googleGeo: GeoMetricRow[] = states.map((state, i) => ({
    state,
    leads: Math.round(googleLeads * stateWeights[i]),
    spend: Math.round(googleSpend * stateWeights[i]),
  })).filter(r => r.leads > 0);

  const metaGeo: GeoMetricRow[] = states.map((state, i) => ({
    state,
    leads: Math.round(metaLeads * stateWeights[i]),
    spend: Math.round(metaSpend * stateWeights[i]),
  })).filter(r => r.leads > 0);

  const googleKpis = makePlatformMetrics(filters, "google", lerpF(0.45, 0.65, s(30)));
  const metaKpis = makePlatformMetrics(filters, "meta", 1 - lerpF(0.45, 0.65, s(30)));

  const googleMaleFrac = lerpF(0.40, 0.55, s(60));
  const metaMaleFrac = lerpF(0.35, 0.50, s(61));

  return {
    google: {
      kpis: googleKpis,
      demographics: {
        age: makeAgeDemo(ageWeightsG, googleLeads, googleSpend),
        gender: [
          { bucket: "Masculino", leads: Math.round(googleLeads * googleMaleFrac), spend: Math.round(googleSpend * googleMaleFrac) },
          { bucket: "Feminino", leads: Math.round(googleLeads * (1 - googleMaleFrac)), spend: Math.round(googleSpend * (1 - googleMaleFrac)) },
        ],
        device: [
          { bucket: "Mobile", leads: Math.round(googleLeads * 0.62), spend: Math.round(googleSpend * 0.58) },
          { bucket: "Desktop", leads: Math.round(googleLeads * 0.32), spend: Math.round(googleSpend * 0.36) },
          { bucket: "Tablet", leads: Math.round(googleLeads * 0.06), spend: Math.round(googleSpend * 0.06) },
        ],
      },
      searchTerms,
      geo: googleGeo,
    },
    meta: {
      kpis: metaKpis,
      demographics: {
        age: makeAgeDemo(ageWeightsM, metaLeads, metaSpend),
        gender: [
          { bucket: "Masculino", leads: Math.round(metaLeads * metaMaleFrac), spend: Math.round(metaSpend * metaMaleFrac) },
          { bucket: "Feminino", leads: Math.round(metaLeads * (1 - metaMaleFrac)), spend: Math.round(metaSpend * (1 - metaMaleFrac)) },
        ],
        device: [
          { bucket: "Mobile", leads: Math.round(metaLeads * 0.78), spend: Math.round(metaSpend * 0.74) },
          { bucket: "Desktop", leads: Math.round(metaLeads * 0.16), spend: Math.round(metaSpend * 0.20) },
          { bucket: "Tablet", leads: Math.round(metaLeads * 0.06), spend: Math.round(metaSpend * 0.06) },
        ],
      },
      topAds: topAds.slice(0, 6),
      geo: metaGeo,
      leadsBySubPlatform: [
        { platform: "Facebook Feed", leads: Math.round(metaLeads * 0.38) },
        { platform: "Instagram Feed", leads: Math.round(metaLeads * 0.35) },
        { platform: "Reels", leads: Math.round(metaLeads * 0.20) },
        { platform: "Stories", leads: Math.round(metaLeads * 0.07) },
      ],
    },
  };
}

export function getMockTrafegoHistorico(): TrafegoHistorico {
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const monthKeys = ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06",
    "2026-07", "2026-08", "2026-09", "2026-10", "2026-11", "2026-12"];

  const baseInvest = [9800, 10200, 11500, 12800, 13200, 14000, 14500, 15200, 13800, 14800, 16000, 17500];
  const baseLeads  = [130,   142,   158,   172,   185,   195,   205,   218,   198,   215,   235,   260];
  const baseVendas = [10,    11,    13,    15,    16,    18,    19,    21,    17,    20,    23,    26];
  const googleFrac = [0.55, 0.54, 0.53, 0.52, 0.51, 0.50, 0.50, 0.51, 0.52, 0.53, 0.52, 0.51];

  const mensal = months.map((month, i) => {
    const ticket = lerp(38000, 65000, i / 11);
    const faturamento = baseVendas[i] * ticket;
    const roi = parseFloat(((faturamento / baseInvest[i]) * 100).toFixed(1));
    return {
      month,
      investimento: baseInvest[i],
      leads: baseLeads[i],
      vendas: baseVendas[i],
      faturamento,
      roi,
      google: Math.round(baseLeads[i] * googleFrac[i]),
      meta: Math.round(baseLeads[i] * (1 - googleFrac[i])),
    };
  });

  const leadsPorCanal = months.map((_month, i) => {
    const total = baseLeads[i];
    const google = Math.round(total * googleFrac[i]);
    const meta = Math.round(total * 0.28);
    const instagram = Math.round(total * 0.07);
    const organico = Math.round(total * 0.05);
    const indicacao = Math.round(total * 0.04);
    const evento = Math.round(total * 0.02);
    return { month: monthKeys[i], google, meta, instagram, organico, indicacao, evento, total };
  });

  const totalInvest = mensal.reduce((a, m) => a + m.investimento, 0);
  const totalLeads  = mensal.reduce((a, m) => a + m.leads, 0);
  const totalVendas = mensal.reduce((a, m) => a + m.vendas, 0);
  const totalFat    = mensal.reduce((a, m) => a + m.faturamento, 0);

  return {
    kpisAnuais: {
      investimento: { atual: totalInvest, anterior: Math.round(totalInvest * 0.78), goal: Math.round(totalInvest * 1.15) },
      leads:        { atual: totalLeads,  anterior: Math.round(totalLeads * 0.82),  goal: Math.round(totalLeads * 1.20) },
      vendas:       { atual: totalVendas, anterior: Math.round(totalVendas * 0.75), goal: Math.round(totalVendas * 1.25) },
      faturamento:  { atual: totalFat,    anterior: Math.round(totalFat * 0.72),    goal: Math.round(totalFat * 1.30) },
      roi:          { atual: parseFloat(((totalFat / totalInvest) * 100).toFixed(1)), anterior: 195 },
    },
    mensal,
    leadsPorCanal,
  };
}
