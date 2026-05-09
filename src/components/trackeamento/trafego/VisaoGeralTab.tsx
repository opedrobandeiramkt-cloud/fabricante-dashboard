import type { DashboardFilters } from "@/lib/types";
import { useTrafego } from "@/hooks/useTrafego";
import { MacroFunnel } from "./MacroFunnel";
import { IndicadoresMacroPanel } from "./IndicadoresMacroPanel";
import { VisaoGeralTrafego } from "./VisaoGeralTrafego";

interface Props {
  filters: DashboardFilters;
}

function Skeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 h-72 bg-secondary rounded-xl" />
        <div className="lg:col-span-2 h-72 bg-secondary rounded-xl" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-28 bg-secondary rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function VisaoGeralTab({ filters }: Props) {
  const { overview, loading, error } = useTrafego(filters, "visao-geral");

  if (loading) return <Skeleton />;
  if (error) return (
    <div className="card-base p-6 text-center text-sm text-[hsl(var(--danger))]">
      {error}
    </div>
  );
  if (!overview) return null;

  return (
    <div className="space-y-5">
      {/* Topo: Jornada de Compra (esq) | Indicadores Macro (dir) */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-5 items-start">
        <div className="md:col-span-3">
          <MacroFunnel funnel={overview.funnel} />
        </div>
        <div className="md:col-span-2">
          <IndicadoresMacroPanel
            macro={overview.macro}
            temporal={overview.temporal}
            google={overview.google}
            meta={overview.meta}
          />
        </div>
      </div>

      {/* Baixo: Visão Geral do Tráfego — 6 cards com sparkline */}
      <VisaoGeralTrafego
        google={overview.google}
        meta={overview.meta}
      />
    </div>
  );
}
