import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { TrafegoTemporalPoint } from "@/lib/types";
import { fmtBRL, fmtPct } from "./fmt";

interface Props {
  temporal: TrafegoTemporalPoint[];
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card-base p-3 text-xs space-y-1 shadow-lg">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map(({ name, value, color }) => (
        <div key={name} className="flex justify-between gap-4">
          <span style={{ color }} className="font-medium">{name}</span>
          <span className="text-foreground">
            {name === "ROI" ? fmtPct(value) : fmtBRL(value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function IndicadoresTemporalChart({ temporal }: Props) {
  return (
    <div className="card-base p-5">
      <p className="text-sm font-semibold text-foreground mb-4">Evolução Temporal</p>
      <ResponsiveContainer width="100%" height={250}>
        <ComposedChart data={temporal} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
          <YAxis yAxisId="brl" orientation="left" tick={{ fontSize: 10 }}
            tickFormatter={(v) => `R$${Math.round(v / 1000)}k`} width={52} />
          <YAxis yAxisId="roi" orientation="right" tick={{ fontSize: 10 }}
            tickFormatter={(v) => `${v}%`} width={40} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar yAxisId="brl" dataKey="investimento" name="Investimento" fill="#93c5fd" radius={[2, 2, 0, 0]} />
          <Bar yAxisId="brl" dataKey="faturamento"  name="Faturamento"  fill="#1d4ed8" radius={[2, 2, 0, 0]} />
          <Line yAxisId="roi" dataKey="roi" name="ROI" stroke="#eab308"
            strokeWidth={2} dot={false} type="monotone" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
