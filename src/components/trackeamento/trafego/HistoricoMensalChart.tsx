import { useState } from "react";
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
import type { MonthlyHistoricoPoint } from "@/lib/types";
import { fmtBRL, fmtNum, fmtPct } from "./fmt";

interface Props {
  mensal: MonthlyHistoricoPoint[];
}

type SeriesKey = "leads" | "vendas" | "investimento" | "faturamento" | "roi";

const SERIES: Array<{ key: SeriesKey; label: string; color: string; type: "bar" | "line"; axis: "left" | "right" }> = [
  { key: "leads",       label: "Leads",       color: "#60a5fa", type: "bar",  axis: "left" },
  { key: "vendas",      label: "Vendas",      color: "#16a34a", type: "bar",  axis: "left" },
  { key: "investimento",label: "Investimento",color: "#f97316", type: "line", axis: "right" },
  { key: "faturamento", label: "Faturamento", color: "#1d4ed8", type: "line", axis: "right" },
  { key: "roi",         label: "ROI %",       color: "#eab308", type: "line", axis: "right" },
];

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string; dataKey: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card-base p-3 text-xs space-y-1 shadow-lg max-w-[200px]">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map(({ name, value, color, dataKey }) => (
        <div key={dataKey} className="flex justify-between gap-3">
          <span style={{ color }} className="font-medium">{name}</span>
          <span className="text-foreground">
            {dataKey === "roi"
              ? fmtPct(value)
              : (dataKey === "investimento" || dataKey === "faturamento")
                ? fmtBRL(value)
                : fmtNum(value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function HistoricoMensalChart({ mensal }: Props) {
  const [hidden, setHidden] = useState<Set<SeriesKey>>(new Set());

  function toggleSeries(key: SeriesKey) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="card-base p-5">
      <p className="text-sm font-semibold text-foreground mb-4">Evolução Mensal</p>

      {/* Legend interativa */}
      <div className="flex flex-wrap gap-2 mb-4">
        {SERIES.map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => toggleSeries(key)}
            className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded border transition-colors ${
              hidden.has(key)
                ? "border-border text-muted-foreground"
                : "border-transparent text-foreground"
            }`}
          >
            <span
              className="inline-block h-2 w-4 rounded"
              style={{ background: hidden.has(key) ? "#64748b" : color }}
            />
            {label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={mensal} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 10 }} width={36} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }}
            tickFormatter={(v) => v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)} width={48} />
          <Tooltip content={<CustomTooltip />} />
          <Legend content={() => null} />

          {!hidden.has("leads") && (
            <Bar yAxisId="left" dataKey="leads" name="Leads" fill="#60a5fa" radius={[2, 2, 0, 0]} barSize={12} />
          )}
          {!hidden.has("vendas") && (
            <Bar yAxisId="left" dataKey="vendas" name="Vendas" fill="#16a34a" radius={[2, 2, 0, 0]} barSize={12} />
          )}
          {!hidden.has("investimento") && (
            <Line yAxisId="right" dataKey="investimento" name="Investimento" stroke="#f97316"
              strokeWidth={2} dot={false} type="monotone" />
          )}
          {!hidden.has("faturamento") && (
            <Line yAxisId="right" dataKey="faturamento" name="Faturamento" stroke="#1d4ed8"
              strokeWidth={2} dot={false} type="monotone" />
          )}
          {!hidden.has("roi") && (
            <Line yAxisId="right" dataKey="roi" name="ROI %" stroke="#eab308"
              strokeWidth={2} dot={false} type="monotone" strokeDasharray="4 2" />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
