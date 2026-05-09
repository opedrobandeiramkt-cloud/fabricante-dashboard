import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { Clock, AlertTriangle } from "lucide-react";
import type { StageTimeData } from "@/lib/types";

interface StageTimeChartProps {
  data: StageTimeData[];
}

interface StageTooltipItem {
  payload?: StageTimeData;
}

function CustomTooltip({
  active,
  payload,
  avg,
}: {
  active?: boolean;
  payload?: StageTooltipItem[];
  avg: number;
}) {
  if (!active || !payload?.[0]?.payload) return null;
  const d = payload[0].payload;
  const delta = d.avgDays - Math.round(avg);
  return (
    <div className="bg-card border border-border rounded-lg p-3 text-sm shadow-xl">
      <p className="font-semibold text-foreground mb-1">{d.label}</p>
      <p className="text-muted-foreground">
        Tempo médio:{" "}
        <span className="text-foreground font-bold">{d.avgDays} dias</span>
      </p>
      {delta > 0 && (
        <p className="text-[hsl(var(--warning))] text-xs mt-1">
          +{delta} dia{delta !== 1 ? "s" : ""} acima da média
        </p>
      )}
      {delta < 0 && (
        <p className="text-[hsl(var(--success))] text-xs mt-1">
          {Math.abs(delta)} dia{Math.abs(delta) !== 1 ? "s" : ""} abaixo da média
        </p>
      )}
      {d.isBottleneck && (
        <p className="text-[hsl(var(--warning))] flex items-center gap-1 mt-1 text-xs">
          <AlertTriangle className="h-3 w-3" /> Gargalo identificado
        </p>
      )}
    </div>
  );
}

export function StageTimeChart({ data }: StageTimeChartProps) {
  const mean = data.length
    ? data.reduce((s, d) => s + d.avgDays, 0) / data.length
    : 0;
  const avgRounded = Math.round(mean);

  function getColor(days: number): string {
    if (mean <= 0) return "hsl(var(--primary))";
    const r = days / mean;
    if (r > 1.5) return "hsl(var(--danger))";
    if (r > 1.0) return "hsl(var(--warning))";
    return "hsl(var(--success))";
  }

  return (
    <div className="card-base p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Tempo Médio por Etapa
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Em dias — média geral: {avgRounded}d
          </p>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[hsl(var(--success))]" />
            abaixo
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[hsl(var(--warning))]" />
            acima
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[hsl(var(--danger))]" />
            &gt;1.5×
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth: 320 }}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 60 }} barSize={24}>
              <XAxis
                dataKey="label"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                angle={-35}
                textAnchor="end"
                interval={0}
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                unit="d"
              />
              <Tooltip
                content={(props) => (
                  <CustomTooltip
                    active={props.active}
                    payload={props.payload as unknown as StageTooltipItem[]}
                    avg={mean}
                  />
                )}
                cursor={{ fill: "hsl(var(--border) / 0.3)" }}
              />
              <ReferenceLine
                y={avgRounded}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="4 4"
                strokeWidth={1}
              />
              <Bar dataKey="avgDays" radius={[4, 4, 0, 0]}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={getColor(entry.avgDays)} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
