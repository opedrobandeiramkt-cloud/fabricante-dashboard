import { TrendingUp, TrendingDown, Users, Trophy, Timer, BarChart3, Zap, CircleDollarSign } from "lucide-react";
import type { KPIData } from "@/lib/types";

interface Props {
  kpis: KPIData;
  orcamentosRevenue?: number;
}

interface CardProps {
  title: string;
  value: string;
  delta: number;
  deltaLabel?: string;
  icon: React.ReactNode;
  accent?: "primary" | "success" | "warning";
}

function Delta({ value, label }: { value: number; label?: string }) {
  const positive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${
        positive ? "text-[hsl(var(--success))]" : "text-[hsl(var(--danger))]"
      }`}
    >
      {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {positive ? "+" : ""}
      {value}
      {label ?? "%"} vs. período anterior
    </span>
  );
}

function KPICard({ title, value, delta, deltaLabel, icon, accent = "primary" }: CardProps) {
  const accentColor =
    accent === "success" ? "var(--success)" :
    accent === "warning" ? "var(--warning)" : "var(--primary)";

  return (
    <div className="card-base p-5 flex flex-col gap-4 transition-colors hover:border-[hsl(var(--primary)/0.4)]">
      <div className="flex items-start justify-between">
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
        <div
          className="h-9 w-9 rounded-lg flex items-center justify-center"
          style={{ background: `hsl(${accentColor} / 0.12)` }}
        >
          <span style={{ color: `hsl(${accentColor})` }}>{icon}</span>
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
        <div className="mt-2">
          <Delta value={delta} label={deltaLabel} />
        </div>
      </div>
    </div>
  );
}

function formatResponseTime(minutes: number): string {
  if (minutes <= 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function formatBRL(n: number): string {
  if (n >= 1_000_000) return `R$ ${(n / 1_000_000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M`;
  if (n >= 1_000) return `R$ ${(n / 1_000).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}K`;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function VendedorDashboard({ kpis, orcamentosRevenue = 0 }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <KPICard
        title="Meus Leads"
        value={kpis.totalLeads.toLocaleString("pt-BR")}
        delta={kpis.totalLeadsDelta}
        icon={<Users className="h-4 w-4" />}
        accent="primary"
      />
      <KPICard
        title="Conversão"
        value={`${kpis.totalConversion}%`}
        delta={kpis.totalConversionDelta}
        deltaLabel="p.p."
        icon={<BarChart3 className="h-4 w-4" />}
        accent="primary"
      />
      <KPICard
        title="Vendas Fechadas"
        value={kpis.wonDeals.toLocaleString("pt-BR")}
        delta={kpis.wonDealsDelta}
        icon={<Trophy className="h-4 w-4" />}
        accent="success"
      />
      <KPICard
        title="Ciclo Médio"
        value={`${kpis.avgCycleDays} dias`}
        delta={-kpis.avgCycleDelta}
        deltaLabel=" dias"
        icon={<Timer className="h-4 w-4" />}
        accent="warning"
      />
      <KPICard
        title="Tempo de 1ª Resposta"
        value={formatResponseTime(kpis.avgFirstResponseMinutes)}
        delta={-kpis.avgFirstResponseDelta}
        deltaLabel=" min"
        icon={<Zap className="h-4 w-4" />}
        accent="warning"
      />
      {orcamentosRevenue > 0 && (
        <KPICard
          title="Receita Gerada (Orçamentos)"
          value={formatBRL(orcamentosRevenue)}
          delta={0}
          deltaLabel=" no período"
          icon={<CircleDollarSign className="h-4 w-4" />}
          accent="success"
        />
      )}
    </div>
  );
}
