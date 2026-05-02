import { Users } from "lucide-react";
import { LeadsTable } from "./LeadsTable";
import { useLeads } from "@/hooks/useLeads";
import type { DashboardFilters } from "@/lib/types";

interface Props {
  filters: DashboardFilters;
}

export function TrackeamentoPage({ filters }: Props) {
  const { leads, loading } = useLeads(filters);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Users className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Leads Gerados</h2>
          <p className="text-xs text-muted-foreground">
            {loading ? "Carregando..." : `${leads.length} lead${leads.length !== 1 ? "s" : ""} no período`}
          </p>
        </div>
      </div>

      <LeadsTable leads={leads} loading={loading} />
    </div>
  );
}
