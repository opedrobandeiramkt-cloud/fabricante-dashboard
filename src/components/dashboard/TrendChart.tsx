import {
  LineChart,
  Line,
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
          <span className="text-foreground font-bold">{p.value.toLocaleString("pt-BR")}</span>
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
        <LineChart data={data} margin={{ top: 4, right: 12, left: -16, bottom: 0 }}>
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
          <Line
            type="monotone"
            dataKey="leads"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
          <Line
            type="monotone"
            dataKey="vendas"
            stroke="hsl(var(--success))"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
