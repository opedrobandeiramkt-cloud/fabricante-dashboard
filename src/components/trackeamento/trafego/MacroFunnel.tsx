import { Compass, Lightbulb, DollarSign, ArrowRight } from "lucide-react";
import type { TrafegoFunnel } from "@/lib/types";
import { fmtBRL, fmtPct, fmtNum } from "./fmt";

interface Props {
  funnel: TrafegoFunnel;
}

interface CardProps {
  title: string;
  icon: React.ReactNode;
  gradient: string;
  badge: string;
  badgeLabel: string;
  rows: Array<{ label: string; value: string }>;
}

function FunnelCard({ title, icon, gradient, badge, badgeLabel, rows }: CardProps) {
  return (
    <div className={`card-base p-5 flex flex-col gap-3 ${gradient}`}>
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
          {icon}
        </div>
        <span className="text-sm font-semibold text-white">{title}</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-medium bg-blue-900/60 text-white px-2 py-0.5 rounded">
          {badgeLabel}
        </span>
        <span className="text-base font-bold text-white">{badge}</span>
      </div>

      <div className="space-y-1.5">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex justify-between items-center">
            <span className="text-xs text-white/70">{label}</span>
            <span className="text-xs font-medium text-white">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MacroFunnel({ funnel }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-stretch">
      <FunnelCard
        title="Descoberta"
        icon={<Compass className="h-4 w-4 text-white" />}
        gradient="bg-gradient-to-br from-blue-400 to-blue-500"
        badgeLabel="Custo/Lead"
        badge={fmtBRL(funnel.cpl)}
        rows={[
          { label: "Impressões",   value: fmtNum(funnel.impressions) },
          { label: "Cliques",      value: fmtNum(funnel.clicks) },
          { label: "CTR",          value: fmtPct(funnel.ctr) },
        ]}
      />

      <div className="hidden md:flex items-center justify-center text-muted-foreground">
        <ArrowRight className="h-6 w-6" />
      </div>

      <FunnelCard
        title="Consideração"
        icon={<Lightbulb className="h-4 w-4 text-white" />}
        gradient="bg-gradient-to-br from-blue-500 to-blue-600"
        badgeLabel="Custo/Venda"
        badge={fmtBRL(funnel.cps)}
        rows={[
          { label: "Leads",         value: fmtNum(funnel.leads) },
          { label: "Atendimentos",  value: fmtNum(funnel.atendimentos) },
          { label: "MQL",           value: fmtNum(funnel.mql) },
        ]}
      />

      <div className="hidden md:flex items-center justify-center text-muted-foreground">
        <ArrowRight className="h-6 w-6" />
      </div>

      <FunnelCard
        title="Decisão"
        icon={<DollarSign className="h-4 w-4 text-white" />}
        gradient="bg-gradient-to-br from-blue-600 to-blue-800"
        badgeLabel="% Vendas"
        badge={fmtPct(funnel.percentVendas)}
        rows={[
          { label: "Vendas",        value: fmtNum(funnel.vendas) },
          { label: "Ticket Médio",  value: fmtBRL(funnel.ticketMedio) },
        ]}
      />
    </div>
  );
}
