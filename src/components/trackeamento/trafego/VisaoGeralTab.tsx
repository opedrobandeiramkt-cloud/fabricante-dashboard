import type { DashboardFilters } from "@/lib/types";
import { useTrafego } from "@/hooks/useTrafego";
import { MacroFunnel } from "./MacroFunnel";
import { IndicadoresMacroCards } from "./IndicadoresMacroCards";
import { IndicadoresTemporalChart } from "./IndicadoresTemporalChart";
import { PlatformSplit } from "./PlatformSplit";

interface Props {
  filters: DashboardFilters;
}

function Skeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-36 bg-secondary rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 bg-secondary rounded-xl" />
        ))}
      </div>
      <div className="h-64 bg-secondary rounded-xl" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-64 bg-secondary rounded-xl" />
        <div className="h-64 bg-secondary rounded-xl" />
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
      <MacroFunnel funnel={overview.funnel} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <IndicadoresMacroCards macro={overview.macro} />
        </div>
        <div className="lg:col-span-1">
          <IndicadoresTemporalChart temporal={overview.temporal} />
        </div>
      </div>

      <PlatformSplit google={overview.google} meta={overview.meta} />
    </div>
  );
}
