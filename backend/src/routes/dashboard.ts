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

      // Entradas no funil (fromStage = null) — leads únicos
      const [entryRows, prevEntryRows] = await Promise.all([
        prisma.leadEvent.findMany({ where: { ...baseFilter, ...periodFilter, fromStageId: null }, distinct: ["leadId"], select: { leadId: true } }),
        prisma.leadEvent.findMany({ where: { ...baseFilter, ...prevFilter,  fromStageId: null }, distinct: ["leadId"], select: { leadId: true } }),
      ]);
      const entryCount     = entryRows.length;
      const prevEntryCount = prevEntryRows.length;

      // Etapas de ganho/perda
      const wonStages = await prisma.funnelStage.findMany({
        where: { tenantId: tenant.id, isWon: true },
        select: { id: true },
      });
      const wonStageIds = wonStages.map((s) => s.id);

      const [wonRows, prevWonRows] = await Promise.all([
        prisma.leadEvent.findMany({ where: { ...baseFilter, ...periodFilter, toStageId: { in: wonStageIds } }, distinct: ["leadId"], select: { leadId: true } }),
        prisma.leadEvent.findMany({ where: { ...baseFilter, ...prevFilter,  toStageId: { in: wonStageIds } }, distinct: ["leadId"], select: { leadId: true } }),
      ]);
      const wonCount     = wonRows.length;
      const prevWonCount = prevWonRows.length;

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

      // Conta leads únicos que chegaram em cada etapa no período
      const counts = await Promise.all(
        stages.map((stage) =>
          prisma.leadEvent.findMany({
            where: {
              ...baseFilter,
              toStageId:  stage.id,
              occurredAt: { gte: start, lte: end },
            },
            distinct: ["leadId"],
            select:   { leadId: true },
          }).then((rows) => ({ stageId: stage.id, count: rows.length }))
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

          const [leadRows, wonRows] = await Promise.all([
            prisma.leadEvent.findMany({ where: { ...filter, fromStageId: null }, distinct: ["leadId"], select: { leadId: true } }),
            prisma.leadEvent.findMany({ where: { ...filter, toStageId: { in: wonStageIds } }, distinct: ["leadId"], select: { leadId: true } }),
          ]);
          const leads    = leadRows.length;
          const wonDeals = wonRows.length;

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

  // ── GET /api/dashboard/stage-time ───────────────────────────────────────────
  app.get<{ Querystring: DashboardQuery }>(
    "/api/dashboard/stage-time",
    { schema: { querystring: querySchema } },
    async (request, reply) => {
      const tenant   = (request as unknown as Record<string, unknown>).tenant as { id: string };
      const period   = (request.query.period ?? "30d") as Period;
      const storeIds = request.query.storeIds?.split(",").filter(Boolean) ?? [];

      const { start, end } = getPeriodRange(period);

      const stages = await prisma.funnelStage.findMany({
        where:   { tenantId: tenant.id },
        orderBy: { orderIndex: "asc" },
      });

      if (stages.length === 0) return reply.send([]);

      // Calcula tempo médio em cada etapa usando window function LEAD
      type AvgRow = { to_stage_id: string; avg_days: number };
      let rows: AvgRow[];

      if (storeIds.length > 0) {
        rows = await prisma.$queryRaw<AvgRow[]>`
          WITH ordered AS (
            SELECT
              lead_id,
              to_stage_id,
              occurred_at,
              LEAD(occurred_at) OVER (PARTITION BY lead_id ORDER BY occurred_at) AS next_at
            FROM lead_events
            WHERE tenant_id = ${tenant.id}::uuid
              AND store_id  = ANY(${storeIds}::uuid[])
              AND occurred_at BETWEEN ${start} AND ${end}
          )
          SELECT
            to_stage_id::text,
            AVG(EXTRACT(EPOCH FROM (next_at - occurred_at)) / 86400)::float AS avg_days
          FROM ordered
          WHERE next_at IS NOT NULL
          GROUP BY to_stage_id
        `;
      } else {
        rows = await prisma.$queryRaw<AvgRow[]>`
          WITH ordered AS (
            SELECT
              lead_id,
              to_stage_id,
              occurred_at,
              LEAD(occurred_at) OVER (PARTITION BY lead_id ORDER BY occurred_at) AS next_at
            FROM lead_events
            WHERE tenant_id = ${tenant.id}::uuid
              AND occurred_at BETWEEN ${start} AND ${end}
          )
          SELECT
            to_stage_id::text,
            AVG(EXTRACT(EPOCH FROM (next_at - occurred_at)) / 86400)::float AS avg_days
          FROM ordered
          WHERE next_at IS NOT NULL
          GROUP BY to_stage_id
        `;
      }

      const avgMap = Object.fromEntries(rows.map((r) => [r.to_stage_id, Math.round(r.avg_days)]));
      const result = stages.map((s) => ({ key: s.key, label: s.label, avgDays: avgMap[s.id] ?? 0 }));
      const nonZero = result.filter((r) => r.avgDays > 0);
      const globalAvg = nonZero.length ? nonZero.reduce((s, r) => s + r.avgDays, 0) / nonZero.length : 0;

      return reply.send(
        result.map((r) => ({ ...r, isBottleneck: r.avgDays > 0 && r.avgDays > globalAvg * 1.3 }))
      );
    }
  );

  // ── GET /api/dashboard/stores ────────────────────────────────────────────────
  app.get("/api/dashboard/stores", async (request, reply) => {
    const tenant = (request as unknown as Record<string, unknown>).tenant as { id: string };
    const stores = await prisma.store.findMany({
      where:   { tenantId: tenant.id },
      orderBy: { name: "asc" },
      select:  { id: true, name: true, city: true, state: true, externalId: true },
    });
    return reply.send(stores);
  });

  // ── POST /api/dashboard/stores ───────────────────────────────────────────────
  app.post("/api/dashboard/stores", async (request, reply) => {
    const tenant = (request as unknown as Record<string, unknown>).tenant as { id: string };
    const body   = request.body as { name?: string; city?: string; state?: string; externalId?: string };

    if (!body.name?.trim()) {
      return reply.code(400).send({ error: "Nome da loja é obrigatório." });
    }

    const store = await prisma.store.create({
      data: {
        tenantId:   tenant.id,
        name:       body.name.trim(),
        city:       body.city?.trim()       || null,
        state:      body.state?.trim()      || null,
        externalId: body.externalId?.trim() || null,
      },
      select: { id: true, name: true, city: true, state: true, externalId: true },
    });

    return reply.code(201).send(store);
  });

  // ── PUT /api/dashboard/stores/:id ────────────────────────────────────────────
  app.put<{ Params: { id: string } }>("/api/dashboard/stores/:id", async (request, reply) => {
    const tenant = (request as unknown as Record<string, unknown>).tenant as { id: string };
    const { id } = request.params;
    const body   = request.body as { name?: string; city?: string; state?: string; externalId?: string };

    const existing = await prisma.store.findFirst({ where: { id, tenantId: tenant.id } });
    if (!existing) return reply.code(404).send({ error: "Loja não encontrada." });

    const store = await prisma.store.update({
      where:  { id },
      data: {
        name:       body.name?.trim()       ?? existing.name,
        city:       body.city?.trim()       ?? existing.city,
        state:      body.state?.trim()      ?? existing.state,
        externalId: body.externalId?.trim() ?? existing.externalId,
      },
      select: { id: true, name: true, city: true, state: true, externalId: true },
    });

    return reply.send(store);
  });

  // ── DELETE /api/dashboard/stores/:id ─────────────────────────────────────────
  app.delete<{ Params: { id: string } }>("/api/dashboard/stores/:id", async (request, reply) => {
    const tenant = (request as unknown as Record<string, unknown>).tenant as { id: string };
    const { id } = request.params;

    const existing = await prisma.store.findFirst({ where: { id, tenantId: tenant.id } });
    if (!existing) return reply.code(404).send({ error: "Loja não encontrada." });

    // Remove eventos e leads vinculados antes de deletar a loja
    await prisma.leadEvent.deleteMany({ where: { storeId: id } });
    await prisma.lead.deleteMany({ where: { storeId: id } });
    await prisma.store.delete({ where: { id } });

    return reply.send({ ok: true });
  });
}
