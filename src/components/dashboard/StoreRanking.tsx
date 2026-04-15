import { LineChart, Line, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { StoreRankingRow } from "@/lib/types";

function formatResponseTime(minutes: number): string {
  if (minutes <= 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function formatBRL(value: number): string {
  if (value >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M`;
  }
  return `R$ ${(value / 1_000).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}K`;
}

interface StoreRankingProps {
  data: StoreRankingRow[];
}

function Sparkline({ values }: { values: number[] }) {
  const points = values.map((v, i) => ({ i, v }));
  const last = values[values.length - 1];
  const prev = values[values.length - 2];
  const color =
    last > prev ? "hsl(var(--success))" :
    last < prev ? "hsl(var(--danger))" :
    "hsl(var(--muted-foreground))";

  return (
    <ResponsiveContainer width={64} height={28}>
      <LineChart data={points}>
        <Line
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function ConvBadge({ value }: { value: number }) {
  const color =
    value >= 15 ? "text-[hsl(var(--success))] bg-[hsl(var(--success)/0.1)]" :
    value >= 10 ? "text-[hsl(var(--warning))] bg-[hsl(var(--warning)/0.1)]" :
    "text-[hsl(var(--danger))] bg-[hsl(var(--danger)/0.1)]";

  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>
      {value}%
    </span>
  );
}

function TrendIcon({ values }: { values: number[] }) {
  const last = values[values.length - 1];
  const prev = values[values.length - 2];
  if (last > prev) return <TrendingUp className="h-3.5 w-3.5 text-[hsl(var(--success))]" />;
  if (last < prev) return <TrendingDown className="h-3.5 w-3.5 text-[hsl(var(--danger))]" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
}

export function StoreRanking({ data }: StoreRankingProps) {
  return (
    <div className="card-base p-5 flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">Ranking de Lojas</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Ordenado por taxa de conversão — maior para menor
        </p>
      </div>

      {/* Total de faturamento */}
      {data.length > 0 && (
        <div className="flex items-center gap-6 px-4 py-3 rounded-lg bg-[hsl(var(--success)/0.06)] border border-[hsl(var(--success)/0.2)]">
          <div>
            <p className="text-xs text-muted-foreground">Faturamento consolidado</p>
            <p className="text-lg font-bold text-[hsl(var(--success))]">
              {formatBRL(data.reduce((s, r) => s + r.revenue, 0))}
            </p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="text-xs text-muted-foreground">Ticket médio geral</p>
            <p className="text-base font-semibold text-foreground">
              {formatBRL(Math.round(data.reduce((s, r) => s + r.avgTicket, 0) / data.length))}
            </p>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-4 w-6">#</th>
              <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-4">Loja</th>
              <th className="text-right text-xs font-medium text-muted-foreground pb-3 pr-4 hidden sm:table-cell">Leads</th>
              <th className="text-right text-xs font-medium text-muted-foreground pb-3 pr-4">Conversão</th>
              <th className="text-right text-xs font-medium text-muted-foreground pb-3 pr-4 hidden sm:table-cell">Vendas</th>
              <th className="text-right text-xs font-medium text-muted-foreground pb-3 pr-4">Faturamento</th>
              <th className="text-right text-xs font-medium text-muted-foreground pb-3 pr-4 hidden lg:table-cell">Ticket Médio</th>
              <th className="text-right text-xs font-medium text-muted-foreground pb-3 pr-4 hidden lg:table-cell">Ciclo Médio</th>
              <th className="text-right text-xs font-medium text-muted-foreground pb-3 pr-4 hidden lg:table-cell">1ª Resposta</th>
              <th className="text-right text-xs font-medium text-muted-foreground pb-3 hidden md:table-cell">Tendência</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((row, idx) => (
              <tr
                key={row.store.id}
                className="hover:bg-secondary/30 transition-colors"
              >
                <td className="py-3 pr-4">
                  <span
                    className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                      idx === 0
                        ? "bg-[hsl(var(--warning)/0.2)] text-[hsl(var(--warning))]"
                        : idx === 1
                        ? "bg-secondary text-muted-foreground"
                        : idx === 2
                        ? "bg-[hsl(38_50%_40%/0.15)] text-[hsl(38_60%_55%)]"
                        : "text-muted-foreground"
                    }`}
                  >
                    {idx + 1}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <p className="font-medium text-foreground">{row.store.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.store.city} — {row.store.state}
                  </p>
                </td>
                <td className="py-3 pr-4 text-right font-medium text-foreground hidden sm:table-cell">
                  {row.leads.toLocaleString("pt-BR")}
                </td>
                <td className="py-3 pr-4 text-right">
                  <ConvBadge value={row.conversion} />
                </td>
                <td className="py-3 pr-4 text-right font-medium text-foreground hidden sm:table-cell">
                  {row.wonDeals.toLocaleString("pt-BR")}
                </td>
                <td className="py-3 pr-4 text-right font-semibold text-[hsl(var(--success))]">
                  {formatBRL(row.revenue)}
                </td>
                <td className="py-3 pr-4 text-right text-muted-foreground hidden lg:table-cell">
                  {formatBRL(row.avgTicket)}
                </td>
                <td className="py-3 pr-4 text-right text-muted-foreground hidden lg:table-cell">
                  {row.avgCycleDays} dias
                </td>
                <td className="py-3 pr-4 text-right text-muted-foreground hidden lg:table-cell">
                  {formatResponseTime(row.avgFirstResponseMinutes)}
                </td>
                <td className="py-3 text-right hidden md:table-cell">
                  <div className="flex items-center justify-end gap-1">
                    <TrendIcon values={row.trend} />
                    <Sparkline values={row.trend} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
