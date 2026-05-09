import { AlertTriangle } from "lucide-react";
import type { FunnelStageData } from "@/lib/types";

interface FunnelChartProps {
  data: FunnelStageData[];
}

function FunnelStage({ entry, maxCount }: { entry: FunnelStageData; maxCount: number }) {
  const pct = maxCount > 0 ? Math.max(5, (entry.count / maxCount) * 100) : 5;
  const fill = entry.isWon
    ? "hsl(var(--success))"
    : entry.isBottleneck
    ? "hsl(var(--warning))"
    : "hsl(var(--primary))";
  const opacity = entry.isWon ? 1 : entry.isBottleneck ? 0.88 : 0.72;

  return (
    <div className="group flex items-center gap-2 sm:gap-3 rounded px-1 py-0.5 hover:bg-secondary/30 transition-colors cursor-default">
      <span
        className="text-[11px] text-right text-muted-foreground group-hover:text-foreground transition-colors shrink-0 leading-tight w-28 sm:w-36 truncate"
        title={entry.label}
      >
        {entry.label}
      </span>
      <div className="flex-1 flex items-center h-6 min-w-0">
        <div
          className="h-full rounded-sm transition-[width]"
          style={{ width: `${pct}%`, background: fill, opacity }}
        />
      </div>
      <span className="text-xs font-semibold text-foreground tabular-nums shrink-0 w-10 sm:w-12 text-right">
        {entry.count.toLocaleString("pt-BR")}
      </span>
    </div>
  );
}

function ConvBadge({ value }: { value: number }) {
  const cls =
    value >= 70
      ? "text-[hsl(var(--success))] bg-[hsl(var(--success)/0.1)] border-[hsl(var(--success)/0.25)]"
      : value >= 50
      ? "text-[hsl(var(--warning))] bg-[hsl(var(--warning)/0.1)] border-[hsl(var(--warning)/0.25)]"
      : "text-[hsl(var(--danger))] bg-[hsl(var(--danger)/0.1)] border-[hsl(var(--danger)/0.25)]";

  return (
    <div className="flex items-center gap-2 sm:gap-3 py-1 px-1">
      <div className="shrink-0 w-28 sm:w-36" />
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <div className="flex-1 h-px bg-border" />
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${cls}`}>
          {value}%
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>
      <div className="shrink-0 w-10 sm:w-12" />
    </div>
  );
}

export function FunnelChart({ data }: FunnelChartProps) {
  const funnelData = data.filter((d) => !d.isLost);
  const lostData = data.filter((d) => d.isLost);
  const bottlenecks = funnelData.filter((d) => d.isBottleneck);
  const maxCount = funnelData[0]?.count ?? 1;

  return (
    <div className="card-base p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Funil de Conversão</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Largura proporcional ao volume · taxa entre etapas
          </p>
        </div>
        {bottlenecks.length > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-[hsl(var(--warning)/0.12)] text-[hsl(var(--warning))] border border-[hsl(var(--warning)/0.3)] shrink-0">
            <AlertTriangle className="h-3 w-3" />
            {bottlenecks.length} gargalo{bottlenecks.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="flex flex-col">
        {funnelData.map((entry, i) => (
          <div key={entry.key}>
            <FunnelStage entry={entry} maxCount={maxCount} />
            {i < funnelData.length - 1 && funnelData[i + 1]?.conversionFromPrev != null && (
              <ConvBadge value={funnelData[i + 1].conversionFromPrev!} />
            )}
          </div>
        ))}
      </div>

      {lostData.map((lost) => (
        <div
          key={lost.key}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[hsl(var(--danger)/0.07)] border border-[hsl(var(--danger)/0.15)]"
        >
          <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--danger))] shrink-0" />
          <span className="text-xs text-muted-foreground">
            {lost.label}:{" "}
            <span className="font-semibold text-[hsl(var(--danger))]">
              {lost.count.toLocaleString("pt-BR")} leads
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}
