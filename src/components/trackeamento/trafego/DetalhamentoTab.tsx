import { useState } from "react";
import { FaGoogle } from "react-icons/fa";
import { FaMeta } from "react-icons/fa6";
import type { DashboardFilters, AdPlatformMetrics, PlatformDetalhamento } from "@/lib/types";
import { useTrafego } from "@/hooks/useTrafego";
import { AgeChart, GenderChart, DeviceChart } from "./DemographicCharts";
import { SearchTermsTable } from "./SearchTermsTable";
import { BrazilGeoMap } from "./BrazilGeoMap";
import { TopAdsTable } from "./TopAdsTable";
import { LeadsByMetaPlatform } from "./LeadsByMetaPlatform";
import { fmtBRL, fmtNum } from "./fmt";

type ActivePlatform = "google" | "meta";

const PLATFORMS = [
  { key: "google" as ActivePlatform, label: "Google Ads",  icon: <FaGoogle className="h-3.5 w-3.5" />, accent: "#4285F4" },
  { key: "meta"   as ActivePlatform, label: "Meta Ads",    icon: <FaMeta   className="h-3.5 w-3.5" />, accent: "#1877F2" },
];

interface KpiItem { label: string; value: string }

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
    { label: "Investido",         value: fmtBRL(m.investido) },
    { label: "Todos os Leads",    value: fmtNum(m.leads) },
    { label: "C/ Todos os Leads", value: m.leads > 0 ? fmtBRL(m.cpl) : "—" },
    { label: "Mensagens",         value: fmtNum(m.mensagens ?? 0) },
    { label: "C/ Mensagem",       value: (m.mensagens ?? 0) > 0 ? fmtBRL(m.conversao ?? 0) : "—" },
  ];
}

function KpiRow({ items, accent }: { items: KpiItem[]; accent: string }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {items.map(({ label, value }, i) => (
        <div key={label} className={`card-base px-4 py-3.5 ${i === 0 ? "border-l-2" : ""}`}
          style={i === 0 ? { borderLeftColor: accent } : undefined}>
          <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
          <p className="text-xl font-bold text-foreground mt-1 leading-tight tabular">{value}</p>
        </div>
      ))}
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-base p-5">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-4">
        {title}
      </p>
      {children}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-10 bg-secondary rounded-xl w-60" />
      <div className="grid grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => <div key={i} className="h-[72px] bg-secondary rounded-xl" />)}
      </div>
      <div className="h-[220px] bg-secondary rounded-xl" />
      <div className="h-[260px] bg-secondary rounded-xl" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-[200px] bg-secondary rounded-xl" />
        <div className="h-[200px] bg-secondary rounded-xl" />
      </div>
    </div>
  );
}

interface Props { filters: DashboardFilters }

export function DetalhamentoTab({ filters }: Props) {
  const [platform, setPlatform] = useState<ActivePlatform>("meta");
  const { detalhamento, loading, error } = useTrafego(filters, "detalhamento");

  if (loading) return <Skeleton />;
  if (error) return (
    <div className="card-base p-6 text-center text-sm text-[hsl(var(--danger))]">{error}</div>
  );
  if (!detalhamento) return null;

  const isGoogle = platform === "google";
  const data: PlatformDetalhamento = isGoogle ? detalhamento.google : detalhamento.meta;
  const kpis   = isGoogle ? buildGoogleKpis(data.kpis) : buildMetaKpis(data.kpis);
  const accent  = isGoogle ? "#4285F4" : "#1877F2";

  return (
    <div className="space-y-5">

      {/* ── Seletor de plataforma ───────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary/60 border border-border">
          {PLATFORMS.map(({ key, label, icon, accent: a }) => (
            <button
              key={key}
              onClick={() => setPlatform(key)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                platform === key
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span style={{ color: platform === key ? a : undefined }}>{icon}</span>
              {label}
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          {isGoogle ? "Dados do Google Ads" : "Dados do Meta Ads (Facebook & Instagram)"}
        </p>
      </div>

      {/* ── KPIs ────────────────────────────────────────────────────────── */}
      <KpiRow items={kpis} accent={accent} />

      {/* ── Audiência (3 colunas) ────────────────────────────────────────── */}
      <SectionCard title="Audiência">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <AgeChart    data={data.demographics.age} />
          <GenderChart data={data.demographics.gender} />
          <DeviceChart data={data.demographics.device} />
        </div>
      </SectionCard>

      {/* ── Seção específica por plataforma ─────────────────────────────── */}
      {isGoogle ? (
        <>
          <SectionCard title="Termos de Pesquisa">
            <SearchTermsTable rows={data.searchTerms ?? []} />
          </SectionCard>
          <SectionCard title="Leads por Estado">
            <BrazilGeoMap data={data.geo ?? []} />
          </SectionCard>
        </>
      ) : (
        <>
          <SectionCard title="Melhores Anúncios">
            <TopAdsTable ads={data.topAds ?? []} />
          </SectionCard>
          <SectionCard title="Leads por Plataforma">
            <LeadsByMetaPlatform data={data.leadsBySubPlatform ?? []} />
          </SectionCard>
        </>
      )}
    </div>
  );
}
