import { FaGoogle } from "react-icons/fa";
import { FaMeta } from "react-icons/fa6";
import type { DashboardFilters, AdPlatformMetrics } from "@/lib/types";
import { useTrafego } from "@/hooks/useTrafego";
import { AgeChart, GenderChart, DeviceChart } from "./DemographicCharts";
import { SearchTermsTable } from "./SearchTermsTable";
import { BrazilGeoMap } from "./BrazilGeoMap";
import { TopAdsTable } from "./TopAdsTable";
import { LeadsByMetaPlatform } from "./LeadsByMetaPlatform";
import { fmtBRL, fmtNum } from "./fmt";

interface Props {
  filters: DashboardFilters;
}

interface KpiItem {
  label: string;
  value: string;
}

function buildGoogleKpis(m: AdPlatformMetrics): KpiItem[] {
  return [
    { label: "Investido",      value: fmtBRL(m.investido) },
    { label: "Leads",          value: fmtNum(m.leads) },
    { label: "Custo por Lead", value: m.leads > 0 ? fmtBRL(m.cpl) : "—" },
    { label: "Cliques",        value: fmtNum(m.clicks ?? 0) },
    { label: "Impressões",     value: fmtNum(m.impressions ?? 0) },
  ];
}

function buildMetaKpis(m: AdPlatformMetrics): KpiItem[] {
  return [
    { label: "Investido",          value: fmtBRL(m.investido) },
    { label: "Todos os Leads",     value: fmtNum(m.leads) },
    { label: "C/ Todos os Leads",  value: m.leads > 0 ? fmtBRL(m.cpl) : "—" },
    { label: "Mensagens",          value: fmtNum(m.mensagens ?? 0) },
    { label: "C/ Mensagem",        value: (m.mensagens ?? 0) > 0 ? fmtBRL(m.conversao ?? 0) : "—" },
  ];
}

function KpiRow({ items }: { items: KpiItem[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-5">
      {items.map(({ label, value }) => (
        <div key={label} className="card-base px-3 py-2.5">
          <p className="text-[9px] text-muted-foreground leading-tight">{label}</p>
          <p className="text-base sm:text-lg font-bold text-foreground mt-0.5 leading-tight">{value}</p>
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
        <div key={i} className="card-base p-5 space-y-4">
          <div className="h-7 bg-secondary rounded w-1/3" />
          <div className="grid grid-cols-5 gap-2">
            {[0, 1, 2, 3, 4].map((j) => <div key={j} className="h-14 bg-secondary rounded" />)}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-36 bg-secondary rounded" />
            <div className="h-36 bg-secondary rounded" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-36 bg-secondary rounded" />
            <div className="h-48 bg-secondary rounded" />
          </div>
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
      {/* ── Google Ads ── */}
      <div className="card-base p-5 space-y-5">
        <PlatformHeader name="Google Ads" icon={<FaGoogle className="h-4 w-4" />} accent="#4285F4" />
        <KpiRow items={buildGoogleKpis(google.kpis)} />

        {/* Linha 1: Leads por Idade | Leads por Gênero */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AgeChart data={google.demographics.age} />
          <GenderChart data={google.demographics.gender} />
        </div>

        {/* Linha 2: Leads por Dispositivo | Termos de Pesquisa */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
          <DeviceChart data={google.demographics.device} />
          <SearchTermsTable rows={google.searchTerms ?? []} />
        </div>

        {/* Linha 3: Leads por Estado */}
        <BrazilGeoMap data={google.geo ?? []} />
      </div>

      {/* ── Meta Ads ── */}
      <div className="card-base p-5 space-y-5">
        <PlatformHeader name="Meta Ads" icon={<FaMeta className="h-4 w-4" />} accent="#1877F2" />
        <KpiRow items={buildMetaKpis(meta.kpis)} />

        {/* Linha 1: Leads por Idade | Leads por Gênero */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AgeChart data={meta.demographics.age} />
          <GenderChart data={meta.demographics.gender} />
        </div>

        {/* Linha 2: Leads por Dispositivo | Melhores Anúncios */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
          <DeviceChart data={meta.demographics.device} />
          <TopAdsTable ads={meta.topAds ?? []} />
        </div>

        {/* Linha 3: Leads por Plataforma */}
        <LeadsByMetaPlatform data={meta.leadsBySubPlatform ?? []} />
      </div>
    </div>
  );
}
