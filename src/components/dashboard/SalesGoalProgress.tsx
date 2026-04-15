import type { GoalData } from "@/lib/types";

interface Props {
  goalData: GoalData;
}

function daysLeftInMonth(): number {
  const now   = new Date();
  const last  = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return last.getDate() - now.getDate();
}

function barColor(pct: number): string {
  if (pct >= 80) return "hsl(142 70% 45%)";
  if (pct >= 50) return "hsl(48 90% 50%)";
  if (pct >= 30) return "hsl(25 90% 55%)";
  return "hsl(0 72% 55%)";
}

export function SalesGoalProgress({ goalData }: Props) {
  const { wonDeals, salesGoal, name, monthLabel } = goalData;

  if (!salesGoal) {
    return (
      <div className="w-full bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-sm text-yellow-800 text-center">
        Meta não definida — peça ao responsável da loja para configurá-la.
      </div>
    );
  }

  const pct      = Math.min(100, Math.round((wonDeals / salesGoal) * 100));
  const color    = barColor(pct);
  const daysLeft = daysLeftInMonth();

  return (
    <div className="w-full bg-card border-b border-border px-4 py-3">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-1.5 text-sm">
          <span className="font-medium text-foreground">
            Meta de {name} — <span className="capitalize">{monthLabel}</span>:&nbsp;
            <strong>{wonDeals} / {salesGoal} vendas</strong>
          </span>
          <span className="text-muted-foreground">
            <strong style={{ color }}>{pct}%</strong> &nbsp;·&nbsp; {daysLeft} {daysLeft === 1 ? "dia restante" : "dias restantes"}
          </span>
        </div>
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
      </div>
    </div>
  );
}
