import { TrendingUp, TrendingDown } from "lucide-react";
import type { TrafegoHistorico } from "@/lib/types";
import { fmtBRL, fmtNum, fmtPct } from "./fmt";

interface Props {
  kpisAnuais: TrafegoHistorico["kpisAnuais"];
}

interface CardProps {
  title: string;
  value: string;
  anterior: string;
  pctChange: number;
  goal?: number | null;
  formatGoal: (v: number) => string;
}

function AnualCard({ title, value, anterior, pctChange, goal, formatGoal }: CardProps) {
  const positive = pctChange >= 0;
  const goalProgress = goal ? Math.min((parseFloat(value.replace(/\D/g, "")) / goal) * 100, 100) : null;

  return (
    <div className="card-base p-4 flex flex-col gap-2">
      <p className="text-xs text-muted-foreground font-medium">{title}</p>
      <p className="text-xl font-bold text-foreground">{value}</p>

      <div className="flex items-center gap-1">
        {positive
          ? <TrendingUp className="h-3 w-3 text-[hsl(var(--success))]" />
          : <TrendingDown className="h-3 w-3 text-[hsl(var(--danger))]" />
        }
        <span className={`text-xs font-medium ${positive ? "text-[hsl(var(--success))]" : "text-[hsl(var(--danger))]"}`}>
          {positive ? "+" : ""}{pctChange.toFixed(1)}% vs {anterior} ano anterior
        </span>
      </div>

      {goal !== null && goal !== undefined && goalProgress !== null && (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Meta: {formatGoal(goal)}</span>
            <span>{goalProgress.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${goalProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function pct(atual: number, anterior: number) {
  if (anterior === 0) return 0;
  return ((atual - anterior) / anterior) * 100;
}

export function KpisAnuaisRow({ kpisAnuais }: Props) {
  const { investimento, leads, vendas, faturamento, roi } = kpisAnuais;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
      <AnualCard
        title="Investimento Anual"
        value={fmtBRL(investimento.atual)}
        anterior={fmtBRL(investimento.anterior)}
        pctChange={pct(investimento.atual, investimento.anterior)}
        goal={investimento.goal}
        formatGoal={fmtBRL}
      />
      <AnualCard
        title="Leads Totais"
        value={fmtNum(leads.atual)}
        anterior={fmtNum(leads.anterior)}
        pctChange={pct(leads.atual, leads.anterior)}
        goal={leads.goal}
        formatGoal={fmtNum}
      />
      <AnualCard
        title="Vendas Fechadas"
        value={fmtNum(vendas.atual)}
        anterior={fmtNum(vendas.anterior)}
        pctChange={pct(vendas.atual, vendas.anterior)}
        goal={vendas.goal}
        formatGoal={fmtNum}
      />
      <AnualCard
        title="Faturamento"
        value={fmtBRL(faturamento.atual)}
        anterior={fmtBRL(faturamento.anterior)}
        pctChange={pct(faturamento.atual, faturamento.anterior)}
        goal={faturamento.goal}
        formatGoal={fmtBRL}
      />
      <AnualCard
        title="ROI Médio"
        value={fmtPct(roi.atual)}
        anterior={fmtPct(roi.anterior)}
        pctChange={pct(roi.atual, roi.anterior)}
        goal={null}
        formatGoal={fmtPct}
      />
    </div>
  );
}
