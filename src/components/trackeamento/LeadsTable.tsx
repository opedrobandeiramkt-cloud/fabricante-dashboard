import { FaFacebook, FaGoogle, FaInstagram } from "react-icons/fa";
import type { LeadRow, LeadOrigem } from "@/lib/types";

// ─── Origem badge ─────────────────────────────────────────────────────────────

const ORIGEM_CONFIG: Record<LeadOrigem, { label: string; icon: React.ReactNode; className: string }> = {
  meta:      { label: "Meta Ads",  icon: <FaFacebook  className="h-3 w-3" />, className: "bg-blue-500/10 text-blue-400 border-blue-500/20"    },
  google:    { label: "Google",    icon: <FaGoogle    className="h-3 w-3" />, className: "bg-red-500/10 text-red-400 border-red-500/20"        },
  instagram: { label: "Instagram", icon: <FaInstagram className="h-3 w-3" />, className: "bg-pink-500/10 text-pink-400 border-pink-500/20"     },
  organico:  { label: "Orgânico",  icon: null,                                className: "bg-secondary text-muted-foreground border-border"     },
};

function OrigemBadge({ origem }: { origem: LeadOrigem }) {
  const cfg = ORIGEM_CONFIG[origem];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${cfg.className}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─── Formato ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function formatBRL(value: number | null) {
  if (value == null) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface Props {
  leads:   LeadRow[];
  loading: boolean;
}

export function LeadsTable({ leads, loading }: Props) {
  if (loading) {
    return (
      <div className="card-base p-6 flex items-center justify-center text-muted-foreground text-sm">
        Carregando leads...
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="card-base p-10 flex flex-col items-center justify-center gap-2 text-center">
        <p className="text-sm font-medium text-foreground">Nenhum lead no período</p>
        <p className="text-xs text-muted-foreground">Os leads aparecerão aqui conforme entrarem no CRM Helena via N8N.</p>
      </div>
    );
  }

  return (
    <div className="card-base overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contato</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Origem</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Campanha / Anúncio</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Etapa</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Valor</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Vendedor</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Loja</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Data</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-secondary/20 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground truncate max-w-[160px]">
                    {lead.contactName ?? <span className="text-muted-foreground">—</span>}
                  </p>
                  {lead.contactPhone && (
                    <p className="text-xs text-muted-foreground mt-0.5">{lead.contactPhone}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <OrigemBadge origem={lead.origem} />
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  {lead.origem === "organico" ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <div>
                      <p className="text-xs text-foreground truncate max-w-[180px]">
                        {lead.utmCampaign ?? <span className="text-muted-foreground">—</span>}
                      </p>
                      {lead.utmContent && (
                        <p className="text-[11px] text-muted-foreground truncate max-w-[180px] mt-0.5">
                          {lead.utmContent}
                        </p>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/15">
                    {lead.stageLabel ?? "—"}
                  </span>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className={`text-sm font-medium ${lead.revenue ? "text-[hsl(var(--success))]" : "text-muted-foreground"}`}>
                    {formatBRL(lead.revenue)}
                  </span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-sm text-muted-foreground truncate max-w-[120px] block">
                    {lead.salespersonName ?? "—"}
                  </span>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className="text-xs text-muted-foreground truncate max-w-[120px] block">{lead.storeName}</span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-xs text-muted-foreground">{formatDate(lead.enteredAt)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {leads.length === 500 && (
        <div className="px-4 py-2.5 border-t border-border bg-secondary/20">
          <p className="text-xs text-muted-foreground">Exibindo os 500 leads mais recentes do período.</p>
        </div>
      )}
    </div>
  );
}
