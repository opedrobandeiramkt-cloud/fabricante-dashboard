import { useState, useMemo } from "react";
import {
  Plus, Search, FileText, CheckCircle2, Clock, Send, MessageSquare, Trophy,
  Pencil, AlertTriangle,
} from "lucide-react";
import { OrcamentoFormModal } from "./OrcamentoFormModal";
import { useOrcamentos } from "@/contexts/OrcamentosContext";
import { useAuth } from "@/contexts/AuthContext";
import { useStores } from "@/contexts/StoresContext";
import { useUsersContext } from "@/contexts/UsersContext";
import type { Orcamento, OrcamentoStatus } from "@/lib/types";

const STATUS_LABELS: Record<OrcamentoStatus, string> = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  em_negociacao: "Em Negociação",
  ganho: "Ganho",
};

const STATUS_TABS: { key: OrcamentoStatus | "todos"; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "rascunho", label: "Rascunho" },
  { key: "enviado", label: "Enviado" },
  { key: "em_negociacao", label: "Em Negociação" },
  { key: "ganho", label: "Ganhos" },
];

function fmtBRL(n: number) {
  if (n >= 1_000_000) return `R$ ${(n / 1_000_000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M`;
  if (n >= 1_000) return `R$ ${(n / 1_000).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}K`;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function StatusBadge({ status }: { status: OrcamentoStatus }) {
  const map: Record<OrcamentoStatus, string> = {
    rascunho:      "bg-secondary text-muted-foreground",
    enviado:       "bg-[hsl(var(--primary)/0.12)] text-primary",
    em_negociacao: "bg-[hsl(var(--warning)/0.12)] text-[hsl(var(--warning))]",
    ganho:         "bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]",
  };
  const icons: Record<OrcamentoStatus, React.ReactNode> = {
    rascunho:      <Clock className="h-3 w-3" />,
    enviado:       <Send className="h-3 w-3" />,
    em_negociacao: <MessageSquare className="h-3 w-3" />,
    ganho:         <CheckCircle2 className="h-3 w-3" />,
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${map[status]}`}>
      {icons[status]} {STATUS_LABELS[status]}
    </span>
  );
}

function WonConfirmModal({
  orcamento,
  onConfirm,
  onClose,
}: {
  orcamento: Orcamento;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm bg-card border border-border rounded-xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-[hsl(var(--success)/0.12)] flex items-center justify-center">
            <Trophy className="h-5 w-5 text-[hsl(var(--success))]" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Marcar como Ganho?</h3>
            <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground p-3 bg-secondary/50 rounded-lg border border-border">
          O orçamento <span className="font-semibold text-foreground">{orcamento.numero}</span> de{" "}
          <span className="font-semibold text-foreground">{orcamento.clientName}</span>{" "}
          no valor de{" "}
          <span className="font-semibold text-[hsl(var(--success))]">{fmtBRL(orcamento.totalValue)}</span>{" "}
          será marcado como ganho e adicionado ao faturamento do dashboard.
          <br /><br />
          Após confirmar, o orçamento não poderá mais ser editado.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors border border-border"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 text-sm font-medium bg-[hsl(var(--success))] text-white rounded-lg hover:bg-[hsl(var(--success)/0.85)] transition-colors"
          >
            Confirmar Ganho
          </button>
        </div>
      </div>
    </div>
  );
}

export function OrcamentosPage() {
  const { user, isVendedor, allowedStoreIds } = useAuth();
  const { stores } = useStores();
  const { users } = useUsersContext();
  const { orcamentos, addOrcamento, updateOrcamento, markAsWon } = useOrcamentos();

  const [search,      setSearch]      = useState("");
  const [statusTab,   setStatusTab]   = useState<OrcamentoStatus | "todos">("todos");
  const [modalTarget, setModalTarget] = useState<Orcamento | null | "new">(null);
  const [wonTarget,   setWonTarget]   = useState<Orcamento | null>(null);

  const vendedores = useMemo(
    () => users.filter((u) => u.role === "vendedor"),
    [users],
  );

  const visibleOrcamentos = useMemo(() => {
    let list = orcamentos;
    if (isVendedor) {
      list = list.filter((o) => o.vendedorId === user?.id);
    } else if (allowedStoreIds.length > 0) {
      list = list.filter((o) => allowedStoreIds.includes(o.storeId));
    }
    return list;
  }, [orcamentos, isVendedor, user?.id, allowedStoreIds]);

  const filtered = useMemo(() => {
    return visibleOrcamentos.filter((o) => {
      const matchTab = statusTab === "todos" || o.status === statusTab;
      const matchSearch =
        !search ||
        o.clientName.toLowerCase().includes(search.toLowerCase()) ||
        o.numero.toLowerCase().includes(search.toLowerCase()) ||
        o.vendedorName.toLowerCase().includes(search.toLowerCase());
      return matchTab && matchSearch;
    });
  }, [visibleOrcamentos, statusTab, search]);

  const storeMap = useMemo(() => new Map(stores.map((s) => [s.id, s])), [stores]);

  const summary = useMemo(() => {
    const ativos = visibleOrcamentos.filter((o) => o.status !== "ganho");
    const ganhos = visibleOrcamentos.filter((o) => o.status === "ganho");
    return {
      totalAtivos: ativos.length,
      valorAtivos: ativos.reduce((s, o) => s + o.totalValue, 0),
      totalGanhos: ganhos.length,
      valorGanhos: ganhos.reduce((s, o) => s + o.totalValue, 0),
    };
  }, [visibleOrcamentos]);

  function handleSave(data: Parameters<typeof addOrcamento>[0]) {
    if (modalTarget === "new") {
      addOrcamento(data);
    } else if (modalTarget) {
      updateOrcamento(modalTarget.id, data);
    }
    setModalTarget(null);
  }

  function handleConfirmWon() {
    if (wonTarget) {
      markAsWon(wonTarget.id);
      setWonTarget(null);
    }
  }

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { todos: visibleOrcamentos.length };
    for (const o of visibleOrcamentos) {
      counts[o.status] = (counts[o.status] ?? 0) + 1;
    }
    return counts;
  }, [visibleOrcamentos]);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Orçamentos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {visibleOrcamentos.length} orçamento{visibleOrcamentos.length !== 1 ? "s" : ""} no total
          </p>
        </div>
        <button
          onClick={() => setModalTarget("new")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Novo Orçamento
        </button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard
          label="Em Aberto"
          count={summary.totalAtivos}
          value={summary.valorAtivos}
          color="primary"
          icon={<FileText className="h-4 w-4" />}
        />
        <SummaryCard
          label="Ganhos"
          count={summary.totalGanhos}
          value={summary.valorGanhos}
          color="success"
          icon={<Trophy className="h-4 w-4" />}
        />
        <div className="col-span-2 card-base p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-[hsl(var(--warning)/0.12)] flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-4 w-4 text-[hsl(var(--warning))]" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Orçamentos não podem ser excluídos.</p>
            <p className="text-xs text-muted-foreground">
              Edite antes de marcar como{" "}
              <span className="text-[hsl(var(--success))] font-medium">Ganho</span> — após isso, nenhuma alteração é possível.
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente, número ou vendedor..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary/50 border border-border overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusTab(tab.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                statusTab === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {tabCounts[tab.key] !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  statusTab === tab.key ? "bg-white/20" : "bg-secondary"
                }`}>
                  {tabCounts[tab.key]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      {filtered.length === 0 ? (
        <div className="card-base flex flex-col items-center justify-center py-16 text-center">
          <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Nenhum orçamento encontrado</p>
          <p className="text-xs text-muted-foreground mt-1">
            {search || statusTab !== "todos"
              ? "Tente outros filtros"
              : "Clique em \"Novo Orçamento\" para começar"}
          </p>
        </div>
      ) : (
        <div className="card-base overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Nº</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Cliente</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 hidden sm:table-cell">Loja</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3">Valor</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Status</th>
                  {!isVendedor && (
                    <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 hidden md:table-cell">Vendedor</th>
                  )}
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 hidden lg:table-cell">Data</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((o) => {
                  const storeName = storeMap.get(o.storeId)?.name ?? o.storeId;
                  const isWon = o.status === "ganho";
                  return (
                    <tr key={o.id} className={`hover:bg-secondary/30 transition-colors ${isWon ? "opacity-70" : ""}`}>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{o.numero}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{o.clientName}</p>
                        {o.clientPhone && (
                          <p className="text-xs text-muted-foreground">{o.clientPhone}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{storeName}</td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground">{fmtBRL(o.totalValue)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={o.status} />
                      </td>
                      {!isVendedor && (
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{o.vendedorName}</td>
                      )}
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                        {fmtDate(o.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          {!isWon && (
                            <>
                              <button
                                onClick={() => setModalTarget(o)}
                                title="Editar orçamento"
                                className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setWonTarget(o)}
                                title="Marcar como ganho"
                                className="h-8 px-2 rounded-lg hover:bg-[hsl(var(--success)/0.1)] flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-[hsl(var(--success))] transition-colors"
                              >
                                <Trophy className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Ganho</span>
                              </button>
                            </>
                          )}
                          {isWon && (
                            <span className="flex items-center gap-1 text-xs text-[hsl(var(--success))] font-medium px-2">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Ganho
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de criação/edição */}
      {modalTarget !== null && user && (
        <OrcamentoFormModal
          orcamento={modalTarget === "new" ? null : modalTarget}
          currentUser={user}
          stores={stores}
          vendedores={vendedores.length > 0 ? vendedores : [user]}
          allowedStoreIds={allowedStoreIds}
          onSave={handleSave}
          onClose={() => setModalTarget(null)}
        />
      )}

      {/* Modal de confirmação "Ganho" */}
      {wonTarget && (
        <WonConfirmModal
          orcamento={wonTarget}
          onConfirm={handleConfirmWon}
          onClose={() => setWonTarget(null)}
        />
      )}
    </div>
  );
}

function SummaryCard({
  label, count, value, color, icon,
}: {
  label: string;
  count: number;
  value: number;
  color: "primary" | "success";
  icon: React.ReactNode;
}) {
  const cls = color === "success"
    ? { bg: "bg-[hsl(var(--success)/0.12)]", text: "text-[hsl(var(--success))]" }
    : { bg: "bg-[hsl(var(--primary)/0.12)]", text: "text-primary" };

  return (
    <div className="card-base p-4 flex items-center gap-3">
      <div className={`h-10 w-10 rounded-lg ${cls.bg} flex items-center justify-center flex-shrink-0`}>
        <span className={cls.text}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold text-foreground">{count}</p>
        <p className={`text-xs font-medium ${cls.text} truncate`}>{fmtBRL(value)}</p>
      </div>
    </div>
  );
}
