import { Users } from "lucide-react";
import { LeadsTable } from "./LeadsTable";
import { useLeads } from "@/hooks/useLeads";
import type { DashboardFilters, LeadOrigem, LeadRow } from "@/lib/types";

interface Props {
  filters: DashboardFilters;
}

export function TrackeamentoPage({ filters }: Props) {
  const { leads, total, totalPages, page, setPage, loading, updateLead } = useLeads(filters);

  function handleLeadUpdate(id: string, patch: Partial<LeadRow>) {
    if ("origemManual" in patch) {
      updateLead(id, patch.origemManual as LeadOrigem | null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Users className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Leads Gerados</h2>
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
  );
}
