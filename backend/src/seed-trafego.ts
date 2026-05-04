import { prisma } from "./lib/prisma.js";

// ─── Helpers determinísticos (sem Math.random) ────────────────────────────────

/** Pseudo-ruído determinístico baseado em índice e seed, retorna [0, 1) */
function pseudoNoise(index: number, seed: number): number {
  const x = Math.sin(index * 127.1 + seed * 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

/** Interpola entre min e max usando um fator [0,1] */
function lerp(min: number, max: number, t: number): number {
  return min + (max - min) * t;
}

/**
 * Gera um valor numérico para o dia `dayIndex` com:
 * - curva semanal (Math.sin baseado no dia da semana)
 * - sazonalidade anual sutil
 * - ruído determinístico
 */
function dailyValue(
  dayIndex: number,
  weekDay: number, // 0 = domingo
  min: number,
  max: number,
  seed: number,
): number {
  // Pico seg (1) e sex (5), vale dom (0) e sáb (6)
  const weekCurve = Math.sin((weekDay - 1) * (Math.PI / 5)) * 0.5 + 0.5;
  // Sazonalidade anual: pico no verão (jan) e dezembro
  const annualCurve = Math.cos((dayIndex / 365) * 2 * Math.PI) * 0.15 + 0.85;
  const noise = pseudoNoise(dayIndex, seed) * 0.25 + 0.75; // [0.75, 1)

  const factor = weekCurve * annualCurve * noise;
  return lerp(min, max, Math.min(1, Math.max(0, factor)));
}

// ─── Dados de referência ──────────────────────────────────────────────────────

const SEARCH_TERMS = [
  "piscina fibra",
  "piscina vinil",
  "piscina pequena",
  "piscina preço",
  "piscina igui",
  "piscina splash",
  "piscina maringá",
  "instalar piscina",
  "piscina 6x3",
  "piscina 8x4",
  "piscina inground",
  "reforma piscina",
  "aquecimento piscina",
  "cobertura piscina",
  "piscina residencial",
  "piscina de fibra preço",
  "piscina 4x2",
  "construção piscina",
  "piscina pronto",
  "piscina financiamento",
] as const;

const CREATIVE_NAMES = [
  "Piscina Fibra - Verão 2025",
  "Desconto 10% - Carrossel",
  "Piscina iGUi - Vídeo Institucional",
  "Splash Pool - Reels Verão",
  "Financiamento Fácil - Stories",
  "Piscina 6x3 - Oferta Especial",
  "Promoção Janeiro - Imagem",
  "Piscina Aquecida - Facebook",
] as const;

const CREATIVE_TYPES = ["image", "video", "carousel", "image", "image", "video", "carousel", "image"] as const;
const SUB_PLATFORMS  = ["instagram", "facebook", "reels", "reels", "instagram", "facebook", "instagram", "facebook"] as const;

const STATES_NEIGHBOR: Record<string, string[]> = {
  PR: ["SP", "SC", "MS"],
  SP: ["PR", "MG", "RJ", "MS"],
  SC: ["PR", "RS"],
  RS: ["SC"],
  MG: ["SP", "RJ", "ES", "BA", "GO", "DF"],
  RJ: ["SP", "MG", "ES"],
  GO: ["MG", "MT", "MS", "BA", "DF"],
  DF: ["GO"],
  BA: ["MG", "GO", "PE", "PI", "SE", "AL"],
  PE: ["BA", "AL", "PB", "CE", "PI"],
};

const DEFAULT_NEIGHBOR_STATES = ["SP", "PR"];

function getStatesForStore(storeState: string | null): string[] {
  const uf = storeState ?? "PR";
  const neighbors = STATES_NEIGHBOR[uf] ?? DEFAULT_NEIGHBOR_STATES;
  return [uf, ...neighbors].slice(0, 5);
}

// ─── Distribuições demográficas ───────────────────────────────────────────────

interface DemoBucket {
  dimension: string;
  bucket: string;
  weight: number;
}

const DEMO_BUCKETS: DemoBucket[] = [
  // age
  { dimension: "age", bucket: "18-24", weight: 0.08 },
  { dimension: "age", bucket: "25-34", weight: 0.32 },
  { dimension: "age", bucket: "35-44", weight: 0.28 },
  { dimension: "age", bucket: "45-54", weight: 0.20 },
  { dimension: "age", bucket: "55+",   weight: 0.12 },
  // gender
  { dimension: "gender", bucket: "male",   weight: 0.55 },
  { dimension: "gender", bucket: "female", weight: 0.45 },
  // device
  { dimension: "device", bucket: "mobile",  weight: 0.62 },
  { dimension: "device", bucket: "desktop", weight: 0.33 },
  { dimension: "device", bucket: "tablet",  weight: 0.05 },
];

// ─── Seed principal ───────────────────────────────────────────────────────────

export async function seedTrafego(): Promise<void> {
  const tenant = await prisma.tenant.findFirst({ include: { stores: true } });
  if (!tenant) {
    console.log("[seed-trafego] Nenhum tenant encontrado. Execute o seed principal primeiro.");
    return;
  }

  const { stores } = tenant;
  if (stores.length === 0) {
    console.log("[seed-trafego] Nenhuma loja encontrada.");
    return;
  }

  const now = new Date();
  const currentYear = now.getFullYear();

  // Datas do período de 90 dias
  const periodEnd = new Date(now);
  periodEnd.setHours(0, 0, 0, 0);

  const periodStart = new Date(periodEnd);
  periodStart.setDate(periodEnd.getDate() - 90);

  const platforms = ["google", "meta"] as const;

  for (const store of stores) {
    const storeIndex = stores.indexOf(store);

    // ── AdMetricDaily: 90 dias × plataforma ─────────────────────────────────
    for (const platform of platforms) {
      const platformSeed = platform === "google" ? 1 : 2;

      for (let d = 0; d < 90; d++) {
        const date = new Date(periodStart);
        date.setDate(periodStart.getDate() + d);
        const weekDay = date.getDay();
        const daySeed = storeIndex * 1000 + platformSeed * 100 + d;

        let spend: number;
        let impressions: number;
        let clicks: number;
        let leads: number;
        let sales: number;
        let revenue: number;
        let messages: number;

        if (platform === "google") {
          spend       = Math.round(dailyValue(d, weekDay, 30, 120, daySeed + 1) * 100) / 100;
          impressions = Math.round(dailyValue(d, weekDay, 2000, 8000, daySeed + 2));
          clicks      = Math.round(dailyValue(d, weekDay, 60, 200, daySeed + 3));
          leads       = Math.round(dailyValue(d, weekDay, 3, 15, daySeed + 4));
          sales       = Math.round(dailyValue(d, weekDay, 0, 2, daySeed + 5));
          revenue     = Math.round(dailyValue(d, weekDay, 0, 90000, daySeed + 6) * 100) / 100;
          messages    = 0;
        } else {
          spend       = Math.round(dailyValue(d, weekDay, 40, 150, daySeed + 1) * 100) / 100;
          impressions = Math.round(dailyValue(d, weekDay, 5000, 20000, daySeed + 2));
          clicks      = Math.round(dailyValue(d, weekDay, 80, 300, daySeed + 3));
          leads       = Math.round(dailyValue(d, weekDay, 4, 18, daySeed + 4));
          sales       = Math.round(dailyValue(d, weekDay, 0, 3, daySeed + 5));
          revenue     = Math.round(dailyValue(d, weekDay, 0, 120000, daySeed + 6) * 100) / 100;
          messages    = Math.round(dailyValue(d, weekDay, 8, 35, daySeed + 7));
        }

        await prisma.adMetricDaily.upsert({
          where: {
            tenantId_storeId_platform_date: {
              tenantId: tenant.id,
              storeId:  store.id,
              platform,
              date,
            },
          },
          update: { spend, impressions, clicks, leads, sales, revenue, messages },
          create: { tenantId: tenant.id, storeId: store.id, platform, date, spend, impressions, clicks, leads, sales, revenue, messages },
        });
      }
    }

    // ── AdDemographic: data mais recente × plataforma × dimensão ────────────
    const demoDate = new Date(periodEnd);

    for (const platform of platforms) {
      const platformSeed = platform === "google" ? 10 : 20;

      // Busca totais do dia mais recente para distribuir
      const latestMetric = await prisma.adMetricDaily.findFirst({
        where: { tenantId: tenant.id, storeId: store.id, platform },
        orderBy: { date: "desc" },
      });
      const totalLeads = latestMetric?.leads ?? 10;
      const totalSpend = latestMetric?.spend ?? 80;
      const totalClicks = latestMetric?.clicks ?? 150;
      const totalImpressions = latestMetric?.impressions ?? 5000;

      for (const demoBucket of DEMO_BUCKETS) {
        const bucketIndex = DEMO_BUCKETS.indexOf(demoBucket);
        const noiseFactor = 0.9 + pseudoNoise(storeIndex * 100 + platformSeed + bucketIndex, 42) * 0.2;
        const weight = demoBucket.weight * noiseFactor;

        await prisma.adDemographic.create({
          data: {
            tenantId:   tenant.id,
            storeId:    store.id,
            platform,
            date:       demoDate,
            dimension:  demoBucket.dimension,
            bucket:     demoBucket.bucket,
            leads:      Math.round(totalLeads * weight),
            spend:      Math.round(totalSpend * weight * 100) / 100,
            clicks:     Math.round(totalClicks * weight),
            impressions: Math.round(totalImpressions * weight),
          },
        }).catch(() => {
          // Ignora duplicatas (idempotência manual para AdDemographic sem @@unique)
        });
      }
    }

    // ── AdSearchTerm: 20 termos para Google ──────────────────────────────────
    const termPeriodStart = new Date(periodStart);
    const termPeriodEnd   = new Date(periodEnd);

    for (let t = 0; t < SEARCH_TERMS.length; t++) {
      const term = SEARCH_TERMS[t];
      const termSeed = storeIndex * 1000 + t * 7;

      const impressions = Math.round(lerp(500, 5000, pseudoNoise(termSeed + 1, 77)));
      const clicks      = Math.round(lerp(20, 200, pseudoNoise(termSeed + 2, 77)));
      const conversions = Math.round(lerp(2, 30, pseudoNoise(termSeed + 3, 77)));
      const cost        = Math.round(lerp(80, 800, pseudoNoise(termSeed + 4, 77)) * 100) / 100;

      // Sem @@unique no modelo, usamos deleteMany + create para idempotência
      await prisma.adSearchTerm.deleteMany({
        where: {
          tenantId:    tenant.id,
          storeId:     store.id,
          term,
          periodStart: termPeriodStart,
        },
      });
      await prisma.adSearchTerm.create({
        data: {
          tenantId:    tenant.id,
          storeId:     store.id,
          periodStart: termPeriodStart,
          periodEnd:   termPeriodEnd,
          term,
          impressions,
          clicks,
          conversions,
          cost,
        },
      });
    }

    // ── AdCreative: 8 criativos para Meta ────────────────────────────────────
    for (let c = 0; c < CREATIVE_NAMES.length; c++) {
      const creativeSeed = storeIndex * 1000 + c * 13;
      const externalId   = `meta_creative_${store.id.substring(0, 8)}_${c}`;

      const leads    = Math.round(lerp(5, 120, pseudoNoise(creativeSeed + 1, 99)));
      const messages = Math.round(lerp(10, 200, pseudoNoise(creativeSeed + 2, 99)));
      const spend    = Math.round(lerp(200, 3000, pseudoNoise(creativeSeed + 3, 99)) * 100) / 100;
      const ctr      = Math.round(lerp(0.5, 5.0, pseudoNoise(creativeSeed + 4, 99)) * 100) / 100;

      await prisma.adCreative.deleteMany({
        where: { tenantId: tenant.id, storeId: store.id, externalId },
      });
      await prisma.adCreative.create({
        data: {
          tenantId:    tenant.id,
          storeId:     store.id,
          externalId,
          name:        CREATIVE_NAMES[c],
          type:        CREATIVE_TYPES[c],
          subPlatform: SUB_PLATFORMS[c],
          leads,
          messages,
          spend,
          ctr,
          periodStart: termPeriodStart,
          periodEnd:   termPeriodEnd,
        },
      });
    }

    // ── AdGeoMetric: estados por plataforma ──────────────────────────────────
    const geoStates = getStatesForStore(store.state);
    const geoDate   = new Date(periodEnd);

    for (const platform of platforms) {
      const platformSeed = platform === "google" ? 30 : 40;

      const platformMetric = await prisma.adMetricDaily.findFirst({
        where: { tenantId: tenant.id, storeId: store.id, platform },
        orderBy: { date: "desc" },
      });
      const totalLeads = platformMetric?.leads ?? 10;
      const totalSpend = platformMetric?.spend ?? 80;
      const totalClicks = platformMetric?.clicks ?? 150;

      for (let g = 0; g < geoStates.length; g++) {
        const state = geoStates[g];
        // Loja própria recebe mais leads
        const baseWeight = g === 0 ? 0.5 : (0.5 / (geoStates.length - 1));
        const noiseFactor = 0.85 + pseudoNoise(storeIndex * 200 + platformSeed + g, 55) * 0.3;
        const weight = baseWeight * noiseFactor;

        await prisma.adGeoMetric.create({
          data: {
            tenantId: tenant.id,
            storeId:  store.id,
            platform,
            date:     geoDate,
            state,
            leads:    Math.round(totalLeads * weight),
            spend:    Math.round(totalSpend * weight * 100) / 100,
            clicks:   Math.round(totalClicks * weight),
          },
        }).catch(() => {
          // Ignora duplicatas
        });
      }
    }

    // ── TrafficGoal: meta anual ───────────────────────────────────────────────
    const goalSeed = storeIndex * 500;
    const investmentGoal = Math.round(lerp(15000, 60000, pseudoNoise(goalSeed + 1, 7)));
    const leadsGoal      = Math.round(lerp(300, 1200, pseudoNoise(goalSeed + 2, 7)));
    const salesGoal      = Math.round(lerp(20, 80, pseudoNoise(goalSeed + 3, 7)));
    const revenueGoal    = Math.round(lerp(500000, 3000000, pseudoNoise(goalSeed + 4, 7)));

    await prisma.trafficGoal.upsert({
      where: {
        tenantId_storeId_year: {
          tenantId: tenant.id,
          storeId:  store.id,
          year:     currentYear,
        },
      },
      update: { investmentGoal, leadsGoal, salesGoal, revenueGoal },
      create: {
        tenantId: tenant.id,
        storeId:  store.id,
        year:     currentYear,
        investmentGoal,
        leadsGoal,
        salesGoal,
        revenueGoal,
      },
    });

    console.log(`[seed-trafego] Loja "${store.name}" processada.`);
  }
}

seedTrafego()
  .then(() => { console.log("Seed de tráfego concluído"); process.exit(0); })
  .catch((e) => { console.error(e); process.exit(1); });
