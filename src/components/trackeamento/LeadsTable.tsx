import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Check, Pencil, Users, CalendarDays } from "lucide-react";
import { FaFacebook, FaGoogle, FaInstagram } from "react-icons/fa";
import { api } from "@/lib/api";
import type { LeadRow, LeadOrigem } from "@/lib/types";

// ─── Origem config ────────────────────────────────────────────────────────────

const ORIGEM_CONFIG: Record<LeadOrigem, { label: string; icon: React.ReactNode; className: string }> = {
  meta:      { label: "Meta Ads",   icon: <FaFacebook   className="h-3 w-3" />,             className: "bg-blue-500/10 text-blue-400 border-blue-500/20"    },
  google:    { label: "Google",     icon: <FaGoogle     className="h-3 w-3" />,             className: "bg-red-500/10 text-red-400 border-red-500/20"        },
  instagram: { label: "Instagram",  icon: <FaInstagram  className="h-3 w-3" />,             className: "bg-pink-500/10 text-pink-400 border-pink-500/20"     },
  indicacao: { label: "Indicação",  icon: <Users        className="h-3 w-3" />,             className: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
  evento:    { label: "Evento",     icon: <CalendarDays className="h-3 w-3" />,             className: "bg-amber-500/10 text-amber-400 border-amber-500/20"  },
  organico:  { label: "Orgânico",   icon: null,                                              className: "bg-secondary text-muted-foreground border-border"    },
};

const ORIGENS: LeadOrigem[] = ["meta", "google", "instagram", "indicacao", "evento", "organico"];

// ─── Origem badge editável ────────────────────────────────────────────────────

function OrigemCell({ lead, onUpdate }: { lead: LeadRow; onUpdate: (id: string, origem: LeadOrigem | null) => void }) {
  const [open,   setOpen]   = useState(false);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  async function handleSelect(origem: LeadOrigem | null) {
    setOpen(false);
    setSaving(true);
    try {
      await api.updateLeadOrigem(lead.id, origem);
      onUpdate(lead.id, origem);
    } catch {
      setOpen(true);
    } finally {
      setSaving(false);
    }
  }

  const cfg = ORIGEM_CONFIG[lead.origem];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={saving}
        className={`group inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-opacity ${cfg.className} ${saving ? "opacity-50" : "hover:opacity-80"}`}
      >
        {cfg.icon}
        {cfg.label}
        {lead.origemManual && <span className="text-[9px] opacity-60">✎</span>}
        {!saving && <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-60 ml-0.5 flex-shrink-0" />}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-44 rounded-xl border border-border bg-card shadow-xl overflow-hidden">
          <div className="px-3 py-2 border-b border-border">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Definir origem</p>
          </div>
          {ORIGENS.map((o) => {
            const c = ORIGEM_CONFIG[o];
            const isActive = lead.origemManual === o || (!lead.origemManual && lead.origem === o);
            return (
              <button
                key={o}
                onClick={() => handleSelect(o)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-secondary/60 transition-colors"
              >
                <span className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-[11px] border ${c.className}`}>
                  {c.icon ?? <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                </span>
                <span className="flex-1 text-left text-foreground text-xs">{c.label}</span>
                {isActive && <Check className="h-3 w-3 text-primary flex-shrink-0" />}
              </button>
            );
          })}
          {lead.origemManual && (
            <>
              <div className="border-t border-border" />
              <button
                onClick={() => handleSelect(null)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
              >
                Auto-detectar (por UTM)
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function formatBRL(value: number | null) {
  if (value == null) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

// ─── Paginação ────────────────────────────────────────────────────────────────

interface PaginationProps {
  page:       number;
  totalPages: number;
  total:      number;
  onPage:     (p: number) => void;
}

function Pagination({ page, totalPages, total, onPage }: PaginationProps) {
  if (totalPages <= 1) return null;
  const from = (page - 1) * 50 + 1;
  const to   = Math.min(page * 50, total);
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-secondary/10">
      <span className="text-xs text-muted-foreground">{from}–{to} de {total} leads</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="h-7 w-7 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="text-xs font-medium text-foreground px-2">{page} / {totalPages}</span>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className="h-7 w-7 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Tabela principal ─────────────────────────────────────────────────────────

interface Props {
  leads:      LeadRow[];
  loading:    boolean;
  total:      number;
  totalPages: number;
  page:       number;
  onPage:     (p: number) => void;
  onLeadUpdate: (id: string, patch: Partial<LeadRow>) => void;
}

export function LeadsTable({ leads, loading, total, totalPages, page, onPage, onLeadUpdate }: Props) {
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

  function handleOrigemUpdate(id: string, origemManual: LeadOrigem | null) {
    const derived = leads.find((l) => l.id === id);
    if (!derived) return;
    onLeadUpdate(id, {
      origemManual,
      origem: origemManual ?? derived.origem,
    });
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
                  <div className="flex items-center gap-1.5">
                    <p className="font-medium text-foreground truncate max-w-[150px]">
                      {lead.contactName ?? <span className="text-muted-foreground">—</span>}
                    </p>
                    {lead.isDuplicate && (
                      <span
                        title="Telefone duplicado — este número já aparece em outro lead"
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/25 flex-shrink-0"
                      >
                        DUP
                      </span>
                    )}
                  </div>
                  {lead.contactPhone && (
                    <p className="text-xs text-muted-foreground mt-0.5">{lead.contactPhone}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <OrigemCell lead={lead} onUpdate={handleOrigemUpdate} />
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
                  {lead.revenue != null ? (
                    <span className="text-sm font-medium text-[hsl(var(--success))]">
                      {formatBRL(lead.revenue)}
                    </span>
                  ) : lead.estimatedValue != null ? (
                    <span className="text-sm font-medium text-amber-400" title="Valor estimado — ainda não convertido">
                      {formatBRL(lead.estimatedValue)}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
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
      <Pagination page={page} totalPages={totalPages} total={total} onPage={onPage} />
    </div>
  );
}
