import { TrendingUp, TrendingDown, DollarSign, Banknote, BarChart2 } from "lucide-react";
import type { TrafegoMacro } from "@/lib/types";
import { fmtBRL, fmtPct } from "./fmt";

interface Props {
  macro: TrafegoMacro;
}

function Delta({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${
        positive ? "text-[hsl(var(--success))]" : "text-[hsl(var(--danger))]"
      }`}
    >
      {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {positive ? "+" : ""}
      {value}% vs. anterior
    </span>
  );
}

interface CardProps {
  title: string;
  value: string;
  delta: number;
  icon: React.ReactNode;
  highlight?: boolean;
}

function Card({ title, value, delta, icon, highlight }: CardProps) {
  return (
    <div className={`card-base p-5 flex flex-col gap-4 ${
      highlight ? "border-[hsl(var(--success)/0.4)] bg-[hsl(var(--success)/0.04)]" : ""
    }`}>
      <div className="flex items-start justify-between">
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
        <div className="mt-2">
          <Delta value={delta} />
        </div>
      </div>
    </div>
  );
}

export function IndicadoresMacroCards({ macro }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card
        title="Investimento"
        value={fmtBRL(macro.investimento)}
        delta={macro.investimentoDelta}
        icon={<DollarSign className="h-4 w-4" />}
      />
      <Card
        title="Faturamento"
        value={fmtBRL(macro.faturamento)}
        delta={macro.faturamentoDelta}
        icon={<Banknote className="h-4 w-4" />}
        highlight
      />
      <Card
        title="ROI"
        value={fmtPct(macro.roi)}
        delta={macro.roiDelta}
        icon={<BarChart2 className="h-4 w-4" />}
      />
    </div>
  );
}
