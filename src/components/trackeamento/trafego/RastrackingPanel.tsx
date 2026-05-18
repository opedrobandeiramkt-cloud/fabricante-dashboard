import { AlertTriangle, CheckCircle2, Radio, Zap } from "lucide-react";
import type { DashboardFilters, RoasStatus } from "@/lib/types";
import { useRastracking } from "@/hooks/useRastracking";
import { fmtBRL, fmtPct } from "./fmt";

// ─── Semáforo ROAS ────────────────────────────────────────────────────────────

const ROAS_CLASSES: Record<RoasStatus, { border: string; bg: string; text: string; label: string }> = {
  verde:     { border: "border-emerald-500", bg: "bg-emerald-500/10", text: "text-emerald-500", label: "Acima da meta" },
  amarelo:   { border: "border-yellow-500",  bg: "bg-yellow-500/10",  text: "text-yellow-500",  label: "Abaixo da meta" },
  vermelho:  { border: "border-red-500",     bg: "bg-red-500/10",     text: "text-red-500",     label: "Abaixo de 1x" },
  sem_dados: { border: "border-border",      bg: "bg-secondary",      text: "text-muted-foreground", label: "Sem dados" },
};

// ─── Micro card ───────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
  alert,
}: {
  label: string;
  value: string;
  sub?: string;
  alert?: boolean;
}) {
  return (
    <div className="card-base p-3 flex flex-col gap-0.5">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
      <p className={`text-xl font-bold leading-tight ${alert ? "text-red-500" : "text-foreground"}`}>
        {value}
      </p>
      {sub && (
        <p className={`text-[10px] leading-tight ${alert ? "text-red-400" : "text-muted-foreground"}`}>
          {sub}
        </p>
      )}
    </div>
  );
}

// ─── Barra de origem ─────────────────────────────────────────────────────────

function OrigemBar({ pago, organico, direto, total }: { pago: number; organico: number; direto: number; total: number }) {
  if (total === 0) return null;

  const pagoPct  = Math.round((pago / total) * 100);
  const orgPct   = Math.round((organico / total) * 100);
  const dirPct   = 100 - pagoPct - orgPct;

  return (
    <div className="space-y-2">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
        Origem dos Leads — {total} no período
      </p>

      {/* Barra empilhada */}
      <div className="flex h-3 w-full rounded-full overflow-hidden gap-px">
        {pagoPct  > 0 && <div className="bg-blue-500"    style={{ width: `${pagoPct}%` }} />}
        {orgPct   > 0 && <div className="bg-emerald-500" style={{ width: `${orgPct}%` }} />}
        {dirPct   > 0 && <div className="bg-border"      style={{ width: `${dirPct}%` }} />}
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-sm bg-blue-500 shrink-0" />
          Pago <span className="font-semibold text-foreground">{pagoPct}%</span>
          <span className="opacity-50">({pago})</span>
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-sm bg-emerald-500 shrink-0" />
          Orgânico <span className="font-semibold text-foreground">{orgPct}%</span>
          <span className="opacity-50">({organico})</span>
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-sm bg-border shrink-0" />
          Direto <span className="font-semibold text-foreground">{dirPct}%</span>
          <span className="opacity-50">({direto})</span>
        </span>
      </div>
    </div>
  );
}

// ─── CAPI / ctwa badge ────────────────────────────────────────────────────────

function RastrackingBadge({
  icon,
  label,
  value,
  ok,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
  ok?: boolean;
}) {
  if (value === null) {
    return (
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <span className="opacity-50">{icon}</span>
        <span>{label}: <span className="italic">não integrado</span></span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 text-[11px] font-medium ${ok ? "text-emerald-500" : "text-yellow-500"}`}>
      {icon}
      <span>{label}: <span className="font-bold">{value}</span></span>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="card-base p-5 space-y-4 animate-pulse">
      <div className="h-4 w-40 bg-secondary rounded" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map(i => <div key={i} className="h-20 bg-secondary rounded-xl" />)}
      </div>
      <div className="h-10 bg-secondary rounded" />
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface Props {
  filters: DashboardFilters;
}

export function RastrackingPanel({ filters }: Props) {
  const { data, loading, error } = useRastracking(filters);

  if (loading) return <Skeleton />;
  if (error) return (
    <div className="card-base p-5 text-sm text-[hsl(var(--danger))] text-center">{error}</div>
  );
  if (!data)  return null;

  const roasCls     = ROAS_CLASSES[data.roasStatus];
  const connectAlert = data.connectRate !== null && data.connectRate < 30;

  const capiOk  = data.capiSuccessRate !== null && data.capiSuccessRate >= 90;
  const ctwaOk  = data.ctwaClicRate    !== null && data.ctwaClicRate    >= 70;

  return (
    <div className="card-base p-5 space-y-5">
      {/* Cabeçalho */}
      <div className="flex items-center gap-2">
        <Radio className="h-4 w-4 text-primary shrink-0" />
        <div>
          <p className="text-sm font-semibold text-foreground">Rastracking WA + Meta</p>
          <p className="text-xs text-muted-foreground">Atribuição, ROAS e qualidade de rastreamento</p>
        </div>
      </div>

      {/* Grid de métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

        {/* ROAS — semáforo */}
        <div className={`card-base border-2 p-3 flex flex-col gap-0.5 ${roasCls.border} ${roasCls.bg}`}>
          <p className="text-[10px] uppercase tracking-wide font-medium text-muted-foreground">ROAS</p>
          <p className={`text-2xl font-bold leading-tight ${roasCls.text}`}>
            {data.roas !== null ? `${data.roas.toFixed(2)}x` : "—"}
          </p>
          <p className={`text-[10px] leading-tight ${roasCls.text}`}>{roasCls.label}</p>
        </div>

        {/* Connect Rate */}
        <MetricCard
          label="Connect Rate"
          value={data.connectRate !== null ? fmtPct(data.connectRate) : "—"}
          sub={connectAlert ? "< 30% — verificar funil WA" : "msgs WA / cliques Meta"}
          alert={connectAlert}
        />

        {/* CPL WhatsApp */}
        <MetricCard
          label="CPL WhatsApp"
          value={data.cplWa !== null ? fmtBRL(data.cplWa) : "—"}
          sub="investido Meta / msgs WA"
        />

        {/* Total Leads */}
        <MetricCard
          label="Leads no período"
          value={String(data.leadsPorOrigem.total)}
          sub={`${data.leadsPorOrigem.pago} pagos`}
        />
      </div>

      {/* Barra de origem */}
      <OrigemBar
        pago={data.leadsPorOrigem.pago}
        organico={data.leadsPorOrigem.organico}
        direto={data.leadsPorOrigem.direto}
        total={data.leadsPorOrigem.total}
      />

      {/* CAPI + ctwa_clid */}
      <div className="border-t border-border pt-4 flex flex-wrap gap-x-6 gap-y-2">
        <RastrackingBadge
          icon={<CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
          label="CAPI enviado"
          value={data.capiSuccessRate !== null ? fmtPct(data.capiSuccessRate) : null}
          ok={capiOk}
        />
        <RastrackingBadge
          icon={<Zap className="h-3.5 w-3.5 shrink-0" />}
          label="ctwa_clid capturado"
          value={data.ctwaClicRate !== null ? fmtPct(data.ctwaClicRate) : null}
          ok={ctwaOk}
        />
        {data.capiSuccessRate === null && data.ctwaClicRate === null && (
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Configure o backend rastracking para ativar CAPI e ctwa_clid tracking
          </p>
        )}
      </div>
    </div>
  );
}
