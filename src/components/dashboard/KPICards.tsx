import { TrendingUp, TrendingDown, Users, Trophy, Timer, BarChart3, CircleDollarSign, Banknote } from "lucide-react";
import type { KPIData } from "@/lib/types";

interface KPICardsProps {
  data: KPIData;
}

interface CardProps {
  title: string;
  value: string;
  delta: number;
  deltaLabel?: string;
  icon: React.ReactNode;
  accent?: "primary" | "success" | "warning";
  highlight?: boolean; // borda destaque para faturamento
}

function Delta({ value, label }: { value: number; label?: string }) {
  const positive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${
        positive ? "text-[hsl(var(--success))]" : "text-[hsl(var(--danger))]"
      }`}
    >
      {positive ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {positive ? "+" : ""}
      {value}
      {label ?? "%"} vs. período anterior
    </span>
  );
}

function KPICard({ title, value, delta, deltaLabel, icon, accent = "primary", highlight }: CardProps) {
  const accentColor =
    accent === "success" ? "var(--success)" :
    accent === "warning" ? "var(--warning)" : "var(--primary)";

  return (
    <div className={`card-base p-5 flex flex-col gap-4 transition-colors hover:border-[hsl(var(--primary)/0.4)] ${
      highlight ? "border-[hsl(var(--success)/0.4)] bg-[hsl(var(--success)/0.04)]" : ""
    }`}>
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

function formatBRL(value: number): string {
  if (value >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M`;
  }
  if (value >= 1_000) {
    return `R$ ${(value / 1_000).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}K`;
  }
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function KPICards({ data }: KPICardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <KPICard
        title="Total de Leads"
        value={data.totalLeads.toLocaleString("pt-BR")}
        delta={data.totalLeadsDelta}
        icon={<Users className="h-4 w-4" />}
        accent="primary"
      />
      <KPICard
        title="Conversão Total"
        value={`${data.totalConversion}%`}
        delta={data.totalConversionDelta}
        deltaLabel="p.p."
        icon={<BarChart3 className="h-4 w-4" />}
        accent="primary"
      />
      <KPICard
        title="Vendas Fechadas"
        value={data.wonDeals.toLocaleString("pt-BR")}
        delta={data.wonDealsDelta}
        icon={<Trophy className="h-4 w-4" />}
        accent="success"
      />
      <KPICard
        title="Faturamento Total"
        value={formatBRL(data.totalRevenue)}
        delta={data.totalRevenueDelta}
        icon={<CircleDollarSign className="h-4 w-4" />}
        accent="success"
        highlight
      />
      <KPICard
        title="Ticket Médio"
        value={formatBRL(data.avgTicket)}
        delta={data.avgTicketDelta}
        icon={<Banknote className="h-4 w-4" />}
        accent="warning"
      />
      <KPICard
        title="Ciclo Médio"
        value={`${data.avgCycleDays} dias`}
        delta={-data.avgCycleDelta}
        deltaLabel=" dias"
        icon={<Timer className="h-4 w-4" />}
        accent="warning"
      />
    </div>
  );
}
