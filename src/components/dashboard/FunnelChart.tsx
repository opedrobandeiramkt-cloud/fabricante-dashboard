import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { AlertTriangle } from "lucide-react";
import type { FunnelStageData } from "@/lib/types";

interface FunnelChartProps {
  data: FunnelStageData[];
}

interface TooltipPayload {
  payload?: FunnelStageData;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.[0]?.payload) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-card border border-border rounded-lg p-3 text-sm shadow-xl">
      <p className="font-semibold text-foreground mb-1">{d.label}</p>
      <p className="text-muted-foreground">
        Leads: <span className="text-foreground font-medium">{d.count.toLocaleString("pt-BR")}</span>
      </p>
      {d.conversionFromPrev !== null && (
        <p className="text-muted-foreground">
          Conv. da etapa anterior:{" "}
          <span
            className={`font-medium ${
              d.conversionFromPrev >= 70
                ? "text-[hsl(var(--success))]"
                : d.conversionFromPrev >= 50
                ? "text-[hsl(var(--warning))]"
                : "text-[hsl(var(--danger))]"
            }`}
          >
            {d.conversionFromPrev}%
          </span>
        </p>
      )}
      {d.isBottleneck && (
        <p className="text-[hsl(var(--warning))] flex items-center gap-1 mt-1">
          <AlertTriangle className="h-3 w-3" /> Gargalo identificado
        </p>
      )}
    </div>
  );
}

export function FunnelChart({ data }: FunnelChartProps) {
  // Excluindo "Venda Perdida" do funil visual (exibida separado)
  const funnelData = data.filter((d) => !d.isLost);

  const bottlenecks = data.filter((d) => d.isBottleneck);

  return (
    <div className="card-base p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Funil de Conversão</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Leads por etapa do processo</p>
        </div>
        {bottlenecks.length > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-[hsl(var(--warning)/0.12)] text-[hsl(var(--warning))] border border-[hsl(var(--warning)/0.3)]">
            <AlertTriangle className="h-3 w-3" />
            {bottlenecks.length} gargalo{bottlenecks.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
      <div style={{ minWidth: 300 }}>
      <ResponsiveContainer width="100%" height={340}>
        <BarChart
          data={funnelData}
          layout="vertical"
          margin={{ top: 0, right: 48, left: 8, bottom: 0 }}
          barSize={22}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="label"
            width={140}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--border) / 0.4)" }} />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {funnelData.map((entry) => (
              <Cell
                key={entry.key}
                fill={
                  entry.isWon
                    ? "hsl(var(--success))"
                    : entry.isBottleneck
                    ? "hsl(var(--warning))"
                    : "hsl(var(--primary))"
                }
                fillOpacity={entry.isBottleneck ? 0.9 : 0.75}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      </div>
      </div>

      {/* Conversões etapa a etapa */}
      <div className="border-t border-border pt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {funnelData
          .filter((d) => d.conversionFromPrev !== null)
          .slice(0, 4)
          .map((d) => {
            const pct = d.conversionFromPrev ?? 0;
            const color =
              pct >= 70 ? "hsl(var(--success))" :
              pct >= 50 ? "hsl(var(--warning))" :
                          "hsl(var(--danger))";
            return (
              <div key={d.key} className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg bg-secondary/50">
                <p className="text-[10px] text-muted-foreground truncate w-full text-center leading-tight">
                  {d.label.split(" ").slice(0, 2).join(" ")}
                </p>
                <p className="text-sm font-bold tabular leading-none" style={{ color }}>
                  {pct}%
                </p>
              </div>
            );
          })}
      </div>
    </div>
  );
}
