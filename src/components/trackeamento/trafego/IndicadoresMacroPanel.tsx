import { PieChart, Pie, Cell, AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { TrafegoMacro, TrafegoTemporalPoint, AdPlatformMetrics } from "@/lib/types";
import { fmtBRL, fmtPct } from "./fmt";

interface Props {
  macro: TrafegoMacro;
  temporal: TrafegoTemporalPoint[];
  google: AdPlatformMetrics;
  meta: AdPlatformMetrics;
}

function DeltaChip({ value }: { value: number }) {
  const pos = value >= 0;
  return (
    <span className={`text-[9px] font-medium ${pos ? "text-emerald-500" : "text-red-500"}`}>
      {pos ? "+" : ""}{value.toFixed(1)}%
    </span>
  );
}

function KpiBlock({ label, value, delta }: { label: string; value: string; delta: number }) {
  return (
    <div>
      <p className="text-[9px] text-muted-foreground leading-tight">{label}</p>
      <p className="text-base font-bold text-foreground leading-tight mt-0.5">{value}</p>
      <DeltaChip value={delta} />
    </div>
  );
}

export function IndicadoresMacroPanel({ macro, temporal, google, meta }: Props) {
  const total = google.investido + meta.investido;
  const googlePct = total > 0 ? Math.round((google.investido / total) * 100) : 0;

  const donutData = [
    { name: "Google Ads",  value: Math.max(google.investido, total > 0 ? 0 : 1) },
    { name: "Meta Ads",    value: Math.max(meta.investido,   total > 0 ? 0 : 0) },
  ];

  const chartData = temporal.map(d => ({
    date: d.date.slice(5),
    investimento: d.investimento,
    vendas: d.vendas,
    cps: d.cps,
  }));

  return (
    <div className="card-base p-5 space-y-4">
      <p className="text-sm font-semibold text-foreground">Indicadores Macro</p>

      {/* 3 KPI blocks */}
      <div className="grid grid-cols-3 gap-3">
        <KpiBlock
          label="Investimento Total"
          value={fmtBRL(macro.investimento)}
          delta={macro.investimentoDelta}
        />
        <KpiBlock
          label="Faturamento"
          value={macro.faturamento > 0 ? fmtBRL(macro.faturamento) : "—"}
          delta={macro.faturamentoDelta}
        />
        <KpiBlock
          label="Retorno sobre Investimento"
          value={macro.roi > 0 ? fmtPct(macro.roi) : "N/A"}
          delta={macro.roiDelta}
        />
      </div>

      {/* Donut: Google vs Meta */}
      <div className="relative flex items-center justify-center" style={{ height: 160 }}>
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie
              data={donutData}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={72}
              startAngle={90}
              endAngle={-270}
              strokeWidth={0}
            >
              <Cell fill="#1d4ed8" />
              <Cell fill="#60a5fa" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-foreground">{googlePct}%</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 justify-center text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-blue-700" /> Investido (Google)</span>
        <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-blue-400" /> Investido (Meta)</span>
      </div>

      {/* Temporal line chart */}
      <div>
        <p className="text-[9px] text-muted-foreground uppercase font-semibold tracking-wide mb-1">Evolução do Período</p>
        <ResponsiveContainer width="100%" height={90}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis dataKey="date" tick={{ fontSize: 9 }} />
            <Tooltip contentStyle={{ fontSize: 10 }} formatter={(v) => fmtBRL(Number(v))} />
            <Area type="monotone" dataKey="investimento" name="Investido" stroke="#1d4ed8" fill="#1d4ed8" fillOpacity={0.15} dot={false} strokeWidth={1.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Vendas chart */}
      <div>
        <p className="text-[9px] text-muted-foreground uppercase font-semibold tracking-wide mb-1">Vendas Realizadas</p>
        <ResponsiveContainer width="100%" height={60}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis dataKey="date" tick={{ fontSize: 9 }} />
            <Tooltip contentStyle={{ fontSize: 10 }} />
            <Area type="monotone" dataKey="vendas" name="Vendas" stroke="#10b981" fill="#10b981" fillOpacity={0.15} dot={false} strokeWidth={1.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
