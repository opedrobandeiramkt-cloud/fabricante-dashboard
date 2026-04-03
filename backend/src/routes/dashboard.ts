import type { FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { getPeriodRange, getPreviousPeriodRange, type Period } from "../lib/date-ranges.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function delta(current: number, previous: number): number {
  if (previous === 0) return 0;
  return parseFloat(((current - previous) / previous * 100).toFixed(1));
}

function buildStoreFilter(storeIds: string[]) {
  return storeIds.length > 0 ? { storeId: { in: storeIds } } : {};
}

const querySchema = {
  type: "object",
  properties: {
    period:   { type: "string", enum: ["7d", "30d", "90d", "12m"], default: "30d" },
    storeIds: { type: "string" }, // CSV: "id1,id2"
  },
} as const;

type DashboardQuery = { period?: Period; storeIds?: string };

// ─── Rotas ────────────────────────────────────────────────────────────────────

export async function dashboardRoutes(app: FastifyInstance) {

  // Middleware: resolve tenant via slug no header
  app.addHook("preHandler", async (request, reply) => {
    const tenantSlug = request.headers["x-tenant-slug"] as string;
    if (!tenantSlug) {
      return reply.code(400).send({ error: "Header x-tenant-slug obrigatório" });
    }
    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) {
      return reply.code(404).send({ error: "Tenant não encontrado" });
    }
    (request as unknown as Record<string, unknown>).tenant = tenant;
  });

  // ── GET /api/dashboard/kpis ──────────────────────────────────────────────────
  app.get<{ Querystring: DashboardQuery }>(
    "/api/dashboard/kpis",
    { schema: { querystring: querySchema } },
    async (request, reply) => {
      const tenant   = (request as unknown as Record<string, unknown>).tenant as { id: string };
      const period   = (request.query.period ?? "30d") as Period;
      const storeIds = request.query.storeIds?.split(",").filter(Boolean) ?? [];

      const { start, end }     = getPeriodRange(period);
      const { start: ps, end: pe } = getPreviousPeriodRange(period);

      const baseFilter    = { tenantId: tenant.id, ...buildStoreFilter(storeIds) };
      const periodFilter  = { occurredAt: { gte: start, lte: end } };
      const prevFilter    = { occurredAt: { gte: ps, lte: pe } };

      // Entradas no funil (fromStage = null)
      const [entryCount, prevEntryCount] = await Promise.all([
        prisma.leadEvent.count({ where: { ...baseFilter, ...periodFilter, fromStageId: null } }),
        prisma.leadEvent.count({ where: { ...baseFilter, ...prevFilter,  fromStageId: null } }),
      ]);

      // Etapas de ganho/perda
      const wonStages = await prisma.funnelStage.findMany({
        where: { tenantId: tenant.id, isWon: true },
        select: { id: true },
      });
      const wonStageIds = wonStages.map((s) => s.id);

      const [wonCount, prevWonCount] = await Promise.all([
        prisma.leadEvent.count({ where: { ...baseFilter, ...periodFilter, toStageId: { in: wonStageIds } } }),
        prisma.leadEvent.count({ where: { ...baseFilter, ...prevFilter,  toStageId: { in: wonStageIds } } }),
      ]);

      // Tempo médio de ciclo (entrada até fechamento)
      const closedLeads = await prisma.lead.findMany({
        where: {
          tenantId: tenant.id,
          ...buildStoreFilter(storeIds),
          closedAt: { not: null, gte: start, lte: end },
        },
        select: { enteredAt: true, closedAt: true },
      });

      const avgCycleDays = closedLeads.length
        ? Math.round(
            closedLeads.reduce((sum, l) => {
              const ms = (l.closedAt!.getTime() - l.enteredAt.getTime());
              return sum + ms / (1000 * 60 * 60 * 24);
            }, 0) / closedLeads.length
          )
        : 0;

      const totalConversion = entryCount > 0
        ? parseFloat(((wonCount / entryCount) * 100).toFixed(1))
        : 0;
      const prevConversion = prevEntryCount > 0
        ? parseFloat(((prevWonCount / prevEntryCount) * 100).toFixed(1))
        : 0;

      return reply.send({
        totalLeads:           entryCount,
        totalLeadsDelta:      delta(entryCount, prevEntryCount),
        totalConversion,
        totalConversionDelta: parseFloat((totalConversion - prevConversion).toFixed(1)),
        wonDeals:             wonCount,
        wonDealsDelta:        delta(wonCount, prevWonCount),
        avgCycleDays,
        avgCycleDelta:        0,
        totalRevenue:         0,
        totalRevenueDelta:    0,
        avgTicket:            0,
        avgTicketDelta:       0,
      });
    }
  );

  // ── GET /api/dashboard/funnel ────────────────────────────────────────────────
  app.get<{ Querystring: DashboardQuery }>(
    "/api/dashboard/funnel",
    { schema: { querystring: querySchema } },
    async (request, reply) => {
      const tenant   = (request as unknown as Record<string, unknown>).tenant as { id: string };
      const period   = (request.query.period ?? "30d") as Period;
      const storeIds = request.query.storeIds?.split(",").filter(Boolean) ?? [];

      const { start, end } = getPeriodRange(period);
      const baseFilter = { tenantId: tenant.id, ...buildStoreFilter(storeIds) };

      const stages = await prisma.funnelStage.findMany({
        where:   { tenantId: tenant.id },
        orderBy: { orderIndex: "asc" },
      });

      // Conta leads que chegaram em cada etapa no período
      const counts = await Promise.all(
        stages.map((stage) =>
          prisma.leadEvent.count({
            where: {
              ...baseFilter,
              toStageId:  stage.id,
              occurredAt: { gte: start, lte: end },
            },
          }).then((count) => ({ stageId: stage.id, count }))
        )
      );

      const countMap = Object.fromEntries(counts.map((c) => [c.stageId, c.count]));

      const result = stages.map((stage, i) => {
        const count    = countMap[stage.id] ?? 0;
        const prevStage = i > 0 ? stages[i - 1] : null;
        const prevCount = prevStage ? (countMap[prevStage.id] ?? 0) : null;

        const conversionFromPrev =
          prevCount !== null && prevCount > 0
            ? parseFloat(((count / prevCount) * 100).toFixed(1))
            : null;

        return {
          key:              stage.key,
          label:            stage.label,
          order:            stage.orderIndex,
          count,
          conversionFromPrev,
          isWon:            stage.isWon,
          isLost:           stage.isLost,
          isBottleneck:     false, // calculado no frontend por ora
        };
      });

      return reply.send(result);
    }
  );

  // ── GET /api/dashboard/trend ─────────────────────────────────────────────────
  app.get<{ Querystring: DashboardQuery }>(
    "/api/dashboard/trend",
    { schema: { querystring: querySchema } },
    async (request, reply) => {
      const tenant   = (request as unknown as Record<string, unknown>).tenant as { id: string };
      const period   = (request.query.period ?? "30d") as Period;
      const storeIds = request.query.storeIds?.split(",").filter(Boolean) ?? [];

      const { start, end } = getPeriodRange(period);

      const wonStages = await prisma.funnelStage.findMany({
        where: { tenantId: tenant.id, isWon: true },
        select: { id: true },
      });
      const wonStageIds = wonStages.map((s) => s.id);

      // Busca todos os eventos do período agrupando por data no SQL via raw
      const bucketSql = period === "12m" ? "month" : period === "90d" ? "week" : "day";

      const bucket = Prisma.raw(bucketSql);

      const rows = storeIds.length > 0
        ? await prisma.$queryRaw<Array<{ bucket: Date; leads: bigint; vendas: bigint }>>`
            SELECT
              DATE_TRUNC(${bucket}, occurred_at) AS bucket,
              COUNT(*) FILTER (WHERE from_stage_id IS NULL)                     AS leads,
              COUNT(*) FILTER (WHERE to_stage_id = ANY(${wonStageIds}::uuid[])) AS vendas
            FROM lead_events
            WHERE tenant_id  = ${tenant.id}::uuid
              AND store_id   = ANY(${storeIds}::uuid[])
              AND occurred_at BETWEEN ${start} AND ${end}
            GROUP BY bucket
            ORDER BY bucket ASC
          `
        : await prisma.$queryRaw<Array<{ bucket: Date; leads: bigint; vendas: bigint }>>`
            SELECT
              DATE_TRUNC(${bucket}, occurred_at) AS bucket,
              COUNT(*) FILTER (WHERE from_stage_id IS NULL)                     AS leads,
              COUNT(*) FILTER (WHERE to_stage_id = ANY(${wonStageIds}::uuid[])) AS vendas
            FROM lead_events
            WHERE tenant_id  = ${tenant.id}::uuid
              AND occurred_at BETWEEN ${start} AND ${end}
            GROUP BY bucket
            ORDER BY bucket ASC
          `;

      const result = rows.map((row) => ({
        date:   row.bucket.toLocaleDateString("pt-BR", {
          day:   bucketSql === "day"   ? "2-digit" : undefined,
          month: "short",
        }),
        leads:  Number(row.leads),
        vendas: Number(row.vendas),
      }));

      return reply.send(result);
    }
  );

  // ── GET /api/dashboard/ranking ───────────────────────────────────────────────
  app.get<{ Querystring: DashboardQuery }>(
    "/api/dashboard/ranking",
    { schema: { querystring: querySchema } },
    async (request, reply) => {
      const tenant   = (request as unknown as Record<string, unknown>).tenant as { id: string };
      const period   = (request.query.period ?? "30d") as Period;
      const storeIds = request.query.storeIds?.split(",").filter(Boolean) ?? [];

      const { start, end } = getPeriodRange(period);

      const stores = await prisma.store.findMany({
        where: {
          tenantId: tenant.id,
          ...(storeIds.length > 0 ? { id: { in: storeIds } } : {}),
        },
      });

      const wonStages = await prisma.funnelStage.findMany({
        where: { tenantId: tenant.id, isWon: true },
        select: { id: true },
      });
      const wonStageIds = wonStages.map((s) => s.id);

      const rows = await Promise.all(
        stores.map(async (store) => {
          const filter = {
            tenantId:   tenant.id,
            storeId:    store.id,
            occurredAt: { gte: start, lte: end },
          };

          const [leads, wonDeals] = await Promise.all([
            prisma.leadEvent.count({ where: { ...filter, fromStageId: null } }),
            prisma.leadEvent.count({ where: { ...filter, toStageId: { in: wonStageIds } } }),
          ]);

          return {
            store: {
              id:    store.id,
              name:  store.name,
              city:  store.city ?? "",
              state: store.state ?? "",
            },
            leads,
            wonDeals,
            conversion:   leads > 0 ? parseFloat(((wonDeals / leads) * 100).toFixed(1)) : 0,
            revenue:      0,
            avgTicket:    0,
            avgCycleDays: 0,
            trend:        [0, 0, 0, 0, 0, 0, 0],
          };
        })
      );

      return reply.send(rows.sort((a, b) => b.conversion - a.conversion));
    }
  );

  // ── GET /api/dashboard/stores ────────────────────────────────────────────────
  app.get("/api/dashboard/stores", async (request, reply) => {
    const tenant = (request as unknown as Record<string, unknown>).tenant as { id: string };
    const stores = await prisma.store.findMany({
      where:   { tenantId: tenant.id },
      orderBy: { name: "asc" },
      select:  { id: true, name: true, city: true, state: true },
    });
    return reply.send(stores);
  });
}
