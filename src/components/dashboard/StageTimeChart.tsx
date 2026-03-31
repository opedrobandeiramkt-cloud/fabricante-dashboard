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

interface TooltipPayload {
  payload?: StageTimeData;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.[0]?.payload) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-card border border-border rounded-lg p-3 text-sm shadow-xl">
      <p className="font-semibold text-foreground mb-1">{d.label}</p>
      <p className="text-muted-foreground">
        Tempo médio:{" "}
        <span className="text-foreground font-bold">{d.avgDays} dias</span>
      </p>
      {d.isBottleneck && (
        <p className="text-[hsl(var(--warning))] flex items-center gap-1 mt-1 text-xs">
          <AlertTriangle className="h-3 w-3" /> Tempo acima da média
        </p>
      )}
    </div>
  );
}

export function StageTimeChart({ data }: StageTimeChartProps) {
  const avg = data.length
    ? Math.round(data.reduce((s, d) => s + d.avgDays, 0) / data.length)
    : 0;

  return (
    <div className="card-base p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Tempo Médio por Etapa
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Em dias — linha tracejada = média geral ({avg} dias)
          </p>
        </div>
        <span className="text-xs text-muted-foreground px-2 py-1 rounded-md bg-secondary border border-border">
          Etapas com gargalo em{" "}
          <span className="text-[hsl(var(--warning))] font-medium">âmbar</span>
        </span>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 60 }} barSize={28}>
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
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--border) / 0.3)" }} />
          <ReferenceLine
            y={avg}
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="4 4"
            strokeWidth={1}
          />
          <Bar dataKey="avgDays" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={
                  entry.isBottleneck
                    ? "hsl(var(--warning))"
                    : "hsl(var(--primary))"
                }
                fillOpacity={entry.isBottleneck ? 0.9 : 0.65}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
