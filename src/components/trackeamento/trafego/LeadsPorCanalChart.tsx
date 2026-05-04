import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  ComposedChart,
  ResponsiveContainer,
} from "recharts";
import type { TrafegoHistorico } from "@/lib/types";
import { fmtNum } from "./fmt";

interface Props {
  leadsPorCanal: TrafegoHistorico["leadsPorCanal"];
}

const MONTH_LABELS: Record<string, string> = {
  "2026-01": "Jan", "2026-02": "Fev", "2026-03": "Mar", "2026-04": "Abr",
  "2026-05": "Mai", "2026-06": "Jun", "2026-07": "Jul", "2026-08": "Ago",
  "2026-09": "Set", "2026-10": "Out", "2026-11": "Nov", "2026-12": "Dez",
};

const CANAIS = [
  { key: "google",    label: "Google",    color: "#4285F4" },
  { key: "meta",      label: "Meta",      color: "#60a5fa" },
  { key: "instagram", label: "Instagram", color: "#ec4899" },
  { key: "organico",  label: "Orgânico",  color: "#94a3b8" },
  { key: "indicacao", label: "Indicação", color: "#a855f7" },
  { key: "evento",    label: "Evento",    color: "#f59e0b" },
];

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string; dataKey: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card-base p-3 text-xs space-y-1 shadow-lg">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.filter(p => p.dataKey !== "total").map(({ name, value, color }) => (
        <div key={name} className="flex justify-between gap-4">
          <span style={{ color }}>{name}</span>
          <span className="text-foreground">{fmtNum(value)}</span>
        </div>
      ))}
      {payload.find(p => p.dataKey === "total") && (
        <div className="flex justify-between gap-4 border-t border-border pt-1 font-semibold">
          <span className="text-foreground">Total</span>
          <span className="text-foreground">
            {fmtNum(payload.find(p => p.dataKey === "total")!.value)}
          </span>
        </div>
      )}
    </div>
  );
}

export function LeadsPorCanalChart({ leadsPorCanal }: Props) {
  const data = leadsPorCanal.map((row) => ({
    ...row,
    label: MONTH_LABELS[row.month] ?? row.month,
  }));

  return (
    <div className="card-base p-5">
      <p className="text-sm font-semibold text-foreground mb-4">Leads por Canal</p>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 10 }} width={36} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />

          {CANAIS.map(({ key, label, color }) => (
            <Bar key={key} dataKey={key} name={label} fill={color}
              stackId="canal" radius={key === "google" ? [2, 2, 0, 0] : [0, 0, 0, 0]} />
          ))}

          <Line dataKey="total" name="Total" stroke="#ffffff" strokeWidth={2}
            dot={{ r: 3, fill: "#ffffff" }} type="monotone" strokeOpacity={0.7} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
