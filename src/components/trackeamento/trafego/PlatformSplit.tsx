import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import { FaGoogle } from "react-icons/fa";
import { FaMeta } from "react-icons/fa6";
import type { AdPlatformMetrics } from "@/lib/types";
import { fmtBRL, fmtNum, fmtPct } from "./fmt";

interface Props {
  google: AdPlatformMetrics;
  meta: AdPlatformMetrics;
}

interface PlatformCardProps {
  name: string;
  icon: React.ReactNode;
  accent: string;
  metrics: AdPlatformMetrics;
}

function KpiRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-semibold text-foreground">{value}</span>
    </div>
  );
}

function PlatformCard({ name, icon, accent, metrics }: PlatformCardProps) {
  return (
    <div className="card-base p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center"
          style={{ background: `${accent}18` }}
        >
          <span style={{ color: accent }}>{icon}</span>
        </div>
        <span className="text-sm font-semibold text-foreground">{name}</span>
      </div>

      <div className="divide-y divide-border">
        <KpiRow label="Investimento" value={fmtBRL(metrics.investido)} />
        <KpiRow label="Leads" value={fmtNum(metrics.leads)} />
        <KpiRow label="CPL" value={fmtBRL(metrics.cpl)} />
        {metrics.clicks !== undefined && (
          <KpiRow label="Cliques" value={fmtNum(metrics.clicks)} />
        )}
        {metrics.impressions !== undefined && (
          <KpiRow label="Impressões" value={fmtNum(metrics.impressions)} />
        )}
        {metrics.mensagens !== undefined && (
          <KpiRow label="Mensagens" value={fmtNum(metrics.mensagens)} />
        )}
        {metrics.conversao !== undefined && (
          <KpiRow label="Conversão" value={fmtPct(metrics.conversao)} />
        )}
      </div>

      <div>
        <p className="text-xs text-muted-foreground mb-1">Leads (30 dias)</p>
        <ResponsiveContainer width="100%" height={80}>
          <LineChart data={metrics.temporal}>
            <Tooltip contentStyle={{ fontSize: 11 }} />
            <Line
              type="monotone"
              dataKey="leads"
              stroke={accent}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function PlatformSplit({ google, meta }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <PlatformCard
        name="Google Ads"
        icon={<FaGoogle className="h-4 w-4" />}
        accent="#4285F4"
        metrics={google}
      />
      <PlatformCard
        name="Meta Ads"
        icon={<FaMeta className="h-4 w-4" />}
        accent="#1877F2"
        metrics={meta}
      />
    </div>
  );
}
