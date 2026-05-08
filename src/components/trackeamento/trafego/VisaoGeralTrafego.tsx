import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { FaGoogle } from "react-icons/fa";
import { FaMeta } from "react-icons/fa6";
import type { AdPlatformMetrics } from "@/lib/types";
import { fmtBRL, fmtNum } from "./fmt";

interface Props {
  google: AdPlatformMetrics;
  meta: AdPlatformMetrics;
}

function formatDate(iso: string): string {
  const [, , day] = iso.split("-");
  const months = ["jan.", "fev.", "mar.", "abr.", "mai.", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."];
  const month = months[parseInt(iso.split("-")[1]) - 1] ?? "";
  return `${parseInt(day)} de ${month}`;
}

interface KpiItem {
  label: string;
  value: string;
}

function KpiCell({ label, value }: KpiItem) {
  return (
    <div>
      <p className="text-[9px] text-muted-foreground leading-tight">{label}</p>
      <p className="text-sm font-bold text-foreground mt-0.5">{value}</p>
      <p className="text-[9px] text-muted-foreground">N/A</p>
    </div>
  );
}

function PlatformPanel({
  name,
  icon,
  accent,
  metrics,
  kpis,
}: {
  name: string;
  icon: React.ReactNode;
  accent: string;
  metrics: AdPlatformMetrics;
  kpis: KpiItem[];
}) {
  const chartData = metrics.temporal.map(d => ({
    date: formatDate(d.date),
    leads: d.leads,
    investido: d.investido,
  }));

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div
          className="h-6 w-6 rounded-md flex items-center justify-center"
          style={{ background: `${accent}20` }}
        >
          <span style={{ color: accent }} className="text-xs">{icon}</span>
        </div>
        <span className="text-xs font-semibold text-foreground">{name}</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {kpis.map(k => <KpiCell key={k.label} {...k} />)}
      </div>

      {/* Área temporal */}
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
          <XAxis dataKey="date" tick={{ fontSize: 9 }} />
          <YAxis tick={{ fontSize: 9 }} />
          <Tooltip
            contentStyle={{ fontSize: 10 }}
            formatter={(v, name) =>
              name === "investido" ? [fmtBRL(Number(v)), "Investido"] : [fmtNum(Number(v)), "Leads"]
            }
          />
          <Area
            type="monotone"
            dataKey="leads"
            name="leads"
            stroke={accent}
            fill={accent}
            fillOpacity={0.15}
            dot={false}
            strokeWidth={1.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function VisaoGeralTrafego({ google, meta }: Props) {
  const googleKpis: KpiItem[] = [
    { label: "Investido",      value: fmtBRL(google.investido) },
    { label: "Leads",          value: fmtNum(google.leads) },
    { label: "Custo por Lead", value: google.cpl > 0 ? fmtBRL(google.cpl) : "—" },
  ];

  const metaKpis: KpiItem[] = [
    { label: "Investido",          value: fmtBRL(meta.investido) },
    { label: "Todos os Leads",     value: fmtNum(meta.leads) },
    { label: "C/ Todos os Leads",  value: meta.cpl > 0 ? fmtBRL(meta.cpl) : "—" },
  ];

  return (
    <div className="card-base p-5">
      <p className="text-sm font-semibold text-foreground mb-5 text-center">Visão Geral do Tráfego</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 divide-y md:divide-y-0 md:divide-x divide-border">
        <PlatformPanel name="Google Ads" icon={<FaGoogle />} accent="#4285F4" metrics={google} kpis={googleKpis} />
        <div className="pt-4 md:pt-0 md:pl-6">
          <PlatformPanel name="Meta Ads" icon={<FaMeta />} accent="#1877F2" metrics={meta} kpis={metaKpis} />
        </div>
      </div>
    </div>
  );
}
