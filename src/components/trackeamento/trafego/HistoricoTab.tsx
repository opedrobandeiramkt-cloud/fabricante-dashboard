import type { DashboardFilters } from "@/lib/types";
import { useTrafego } from "@/hooks/useTrafego";
import { KpisAnuaisRow } from "./KpisAnuaisRow";
import { HistoricoMensalChart } from "./HistoricoMensalChart";
import { LeadsPorCanalChart } from "./LeadsPorCanalChart";

interface Props {
  filters: DashboardFilters;
}

function Skeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="grid grid-cols-5 gap-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-secondary rounded-xl" />
        ))}
      </div>
      <div className="h-80 bg-secondary rounded-xl" />
      <div className="h-72 bg-secondary rounded-xl" />
    </div>
  );
}

export function HistoricoTab({ filters }: Props) {
  const { historico, loading, error } = useTrafego(filters, "historico");

  if (loading) return <Skeleton />;
  if (error) return (
    <div className="card-base p-6 text-center text-sm text-[hsl(var(--danger))]">
      {error}
    </div>
  );
  if (!historico) return null;

  return (
    <div className="space-y-5">
      <KpisAnuaisRow kpisAnuais={historico.kpisAnuais} />
      <HistoricoMensalChart mensal={historico.mensal} />
      <LeadsPorCanalChart leadsPorCanal={historico.leadsPorCanal} />
    </div>
  );
}
