import { FaGoogle } from "react-icons/fa";
import { FaMeta } from "react-icons/fa6";
import type { DashboardFilters, AdPlatformMetrics } from "@/lib/types";
import { useTrafego } from "@/hooks/useTrafego";
import { DemographicCharts } from "./DemographicCharts";
import { SearchTermsTable } from "./SearchTermsTable";
import { BrazilGeoMap } from "./BrazilGeoMap";
import { TopAdsTable } from "./TopAdsTable";
import { LeadsByMetaPlatform } from "./LeadsByMetaPlatform";
import { fmtBRL, fmtNum, fmtPct } from "./fmt";

interface Props {
  filters: DashboardFilters;
}

function KpiGrid({ metrics }: { metrics: AdPlatformMetrics }) {
  const items = [
    { label: "Investimento",  value: fmtBRL(metrics.investido) },
    { label: "Leads",         value: fmtNum(metrics.leads) },
    { label: "CPL",           value: fmtBRL(metrics.cpl) },
    ...(metrics.clicks !== undefined    ? [{ label: "Cliques",     value: fmtNum(metrics.clicks) }]    : []),
    ...(metrics.impressions !== undefined ? [{ label: "Impressões", value: fmtNum(metrics.impressions) }] : []),
    ...(metrics.mensagens !== undefined ? [{ label: "Mensagens",   value: fmtNum(metrics.mensagens) }] : []),
    ...(metrics.conversao !== undefined ? [{ label: "Conversão",   value: fmtPct(metrics.conversao) }]  : []),
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
      {items.map(({ label, value }) => (
        <div key={label} className="card-base p-3">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-bold text-foreground mt-0.5">{value}</p>
        </div>
      ))}
    </div>
  );
}

function PlatformHeader({ name, icon, accent }: { name: string; icon: React.ReactNode; accent: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div
        className="h-7 w-7 rounded-lg flex items-center justify-center"
        style={{ background: `${accent}20` }}
      >
        <span style={{ color: accent }}>{icon}</span>
      </div>
      <h3 className="text-sm font-semibold text-foreground">{name}</h3>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
      {[0, 1].map((i) => (
        <div key={i} className="space-y-4">
          <div className="h-8 bg-secondary rounded w-1/3" />
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((j) => <div key={j} className="h-16 bg-secondary rounded" />)}
          </div>
          <div className="h-48 bg-secondary rounded" />
          <div className="h-40 bg-secondary rounded" />
        </div>
      ))}
    </div>
  );
}

export function DetalhamentoTab({ filters }: Props) {
  const { detalhamento, loading, error } = useTrafego(filters, "detalhamento");

  if (loading) return <Skeleton />;
  if (error) return (
    <div className="card-base p-6 text-center text-sm text-[hsl(var(--danger))]">
      {error}
    </div>
  );
  if (!detalhamento) return null;

  const { google, meta } = detalhamento;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Google */}
      <div className="space-y-5">
        <PlatformHeader name="Google Ads" icon={<FaGoogle className="h-4 w-4" />} accent="#4285F4" />
        <KpiGrid metrics={google.kpis} />
        <DemographicCharts
          age={google.demographics.age}
          gender={google.demographics.gender}
          device={google.demographics.device}
        />
        {google.searchTerms && google.searchTerms.length > 0 && (
          <SearchTermsTable rows={google.searchTerms} />
        )}
        {google.geo && google.geo.length > 0 && <BrazilGeoMap data={google.geo} />}
      </div>

      {/* Meta */}
      <div className="space-y-5">
        <PlatformHeader name="Meta Ads" icon={<FaMeta className="h-4 w-4" />} accent="#1877F2" />
        <KpiGrid metrics={meta.kpis} />
        <DemographicCharts
          age={meta.demographics.age}
          gender={meta.demographics.gender}
          device={meta.demographics.device}
        />
        {meta.leadsBySubPlatform && meta.leadsBySubPlatform.length > 0 && (
          <LeadsByMetaPlatform data={meta.leadsBySubPlatform} />
        )}
        {meta.topAds && meta.topAds.length > 0 && <TopAdsTable ads={meta.topAds} />}
        {meta.geo && meta.geo.length > 0 && <BrazilGeoMap data={meta.geo} />}
      </div>
    </div>
  );
}
