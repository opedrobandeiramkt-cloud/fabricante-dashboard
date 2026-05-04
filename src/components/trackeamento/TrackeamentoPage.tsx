import { useState, useEffect } from "react";
import { Users, TrendingUp, BarChart2, Clock } from "lucide-react";
import { LeadsTable } from "./LeadsTable";
import { useLeads } from "@/hooks/useLeads";
import type { DashboardFilters, LeadOrigem, LeadRow, TrafegoTab } from "@/lib/types";
import { VisaoGeralTab } from "./trafego/VisaoGeralTab";
import { DetalhamentoTab } from "./trafego/DetalhamentoTab";
import { HistoricoTab } from "./trafego/HistoricoTab";

interface Props {
  filters: DashboardFilters;
}

const TABS: Array<{ key: TrafegoTab; label: string; icon: React.ReactNode }> = [
  { key: "visao-geral",   label: "Visão Geral",   icon: <TrendingUp className="h-4 w-4" /> },
  { key: "detalhamento",  label: "Detalhamento",  icon: <BarChart2 className="h-4 w-4" /> },
  { key: "historico",     label: "Histórico",     icon: <Clock className="h-4 w-4" /> },
  { key: "leads",         label: "Leads",         icon: <Users className="h-4 w-4" /> },
];

function getStoredTab(): TrafegoTab {
  const stored = sessionStorage.getItem("trackeamento.tab");
  const valid: TrafegoTab[] = ["visao-geral", "detalhamento", "historico", "leads"];
  return valid.includes(stored as TrafegoTab) ? (stored as TrafegoTab) : "visao-geral";
}

export function TrackeamentoPage({ filters }: Props) {
  const [tab, setTab] = useState<TrafegoTab>(() => getStoredTab());

  useEffect(() => {
    sessionStorage.setItem("trackeamento.tab", tab);
  }, [tab]);

  const { leads, total, totalPages, page, setPage, loading, updateLead } = useLeads(filters);

  function handleLeadUpdate(id: string, patch: Partial<LeadRow>) {
    if ("origemManual" in patch) {
      updateLead(id, patch.origemManual as LeadOrigem | null);
    }
  }

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <TrendingUp className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Tráfego Pago</h2>
          <p className="text-xs text-muted-foreground">Inteligência de mídia paga e leads</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-1">
          {TABS.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Conteúdo da tab ativa */}
      {tab === "visao-geral"  && <VisaoGeralTab filters={filters} />}
      {tab === "detalhamento" && <DetalhamentoTab filters={filters} />}
      {tab === "historico"    && <HistoricoTab filters={filters} />}
      {tab === "leads" && (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Leads Gerados</h3>
              <p className="text-xs text-muted-foreground">
                {loading ? "Carregando..." : `${total} lead${total !== 1 ? "s" : ""} no período`}
              </p>
            </div>
          </div>
          <LeadsTable
            leads={leads}
            loading={loading}
            total={total}
            totalPages={totalPages}
            page={page}
            onPage={setPage}
            onLeadUpdate={handleLeadUpdate}
          />
        </div>
      )}
    </div>
  );
}
