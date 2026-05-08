import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { TrendPoint } from "@/lib/types";

interface TrendChartProps {
  data: TrendPoint[];
}

interface TooltipPayload {
  value: number;
  name: string;
  color: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 text-sm shadow-xl">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-muted-foreground">
          <span style={{ color: p.color }} className="font-medium">
            {p.name === "leads" ? "Leads" : "Vendas"}:{" "}
          </span>
          <span className="text-foreground font-bold tabular">{p.value.toLocaleString("pt-BR")}</span>
        </p>
      ))}
    </div>
  );
}

export function TrendChart({ data }: TrendChartProps) {
  return (
    <div className="card-base p-5 flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">Evolução no Período</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Comparativo de leads captados vs. vendas fechadas
        </p>
      </div>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-[340px] text-muted-foreground text-sm">
          Sem dados no período selecionado
        </div>
      ) : null}

      <ResponsiveContainer width="100%" height={data.length === 0 ? 0 : 340}>
        <AreaChart data={data} margin={{ top: 4, right: 12, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="grad-leads" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(217 91% 60%)" stopOpacity={0.25} />
              <stop offset="95%" stopColor="hsl(217 91% 60%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="grad-vendas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(142 70% 45%)" stopOpacity={0.25} />
              <stop offset="95%" stopColor="hsl(142 70% 45%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value: string) => (
              <span className="text-xs text-muted-foreground">
                {value === "leads" ? "Leads" : "Vendas"}
              </span>
            )}
          />
          <Area
            type="monotone"
            dataKey="leads"
            stroke="hsl(217 91% 60%)"
            strokeWidth={2}
            fill="url(#grad-leads)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
          <Area
            type="monotone"
            dataKey="vendas"
            stroke="hsl(142 70% 45%)"
            strokeWidth={2}
            fill="url(#grad-vendas)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
