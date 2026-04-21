import { useState, useRef } from "react";
import { FileText, History, Waves, Plus, Pencil, Trophy, X, ChevronDown, Trash2 } from "lucide-react";
import { useOrcamentos } from "@/contexts/OrcamentosContext";
import { useAuth } from "@/contexts/AuthContext";
import { useStores } from "@/contexts/StoresContext";
import { QuoteForm } from "@/components/orcamentos/QuoteForm";
import { QuoteTemplate } from "@/components/orcamentos/QuoteTemplate";
import { IguiQuoteTemplate } from "@/components/orcamentos/IguiQuoteTemplate";
import {
  type QuoteFormData,
  type SavedQuote,
  type PoolModel,
  type PoolSize,
  type QuoteStatus,
  loadPoolModels,
  savePoolModels,
  loadPoolSizes,
  savePoolSizes,
  defaultPoolModels,
  defaultPoolSizes,
  formatCurrency,
} from "@/lib/pool-data";

type Tab = "novo" | "historico" | "piscinas";
type StatusFilter = "todos" | QuoteStatus;

const STATUS_LABELS: Record<QuoteStatus, string> = {
  pendente: "Pendente",
  ganho: "Ganho",
  perdido: "Perdido",
};

const STATUS_COLORS: Record<QuoteStatus, string> = {
  pendente: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  ganho: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  perdido: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
};

export function OrcamentosPage() {
  const { quotes, addQuote, updateQuote, markAsWon } = useOrcamentos();
  const { user, allowedStoreIds, isVendedor } = useAuth();
  const { stores } = useStores();

  const [tab, setTab] = useState<Tab>("historico");
  const [editingQuote, setEditingQuote] = useState<SavedQuote | null>(null);
  const [generating, setGenerating] = useState(false);
  const [quoteData, setQuoteData] = useState<QuoteFormData | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [confirmWonId, setConfirmWonId] = useState<string | null>(null);
  const quoteRef = useRef<HTMLDivElement>(null);

  const storeId = allowedStoreIds[0] ?? stores[0]?.id ?? "default";
  const storeKind = stores.find((s) => s.id === storeId)?.storeType ?? "splash";
  const vendedorId = user?.id ?? "";
  const vendedorName = user?.name ?? "";

  // ── NOVO ORÇAMENTO ─────────────────────────────────────────────────────────
  async function handleGenerate(data: QuoteFormData) {
    setQuoteData(data);
    setGenerating(true);

    if (editingQuote) {
      updateQuote(editingQuote.id, {
        clientName: data.clientName,
        proposalValue: data.proposalValue,
        formData: data,
      });
    } else {
      addQuote({
        clientName: data.clientName,
        proposalValue: data.proposalValue,
        status: "pendente",
        formData: data,
        vendedorId,
        vendedorName,
        storeId,
      });
    }

    setTimeout(async () => {
      if (!quoteRef.current) { setGenerating(false); return; }
      try {
        // Aguarda fontes carregarem para evitar problemas de espaçamento
        await document.fonts.ready;

        const [{ jsPDF }, html2canvasMod] = await Promise.all([
          import("jspdf"),
          import("html2canvas"),
        ]);
        const html2canvas = html2canvasMod.default;

        // Renderiza cada página individualmente — elimina páginas em branco
        const pageEls = quoteRef.current.querySelectorAll<HTMLElement>("[data-pdf-page='true']");
        const pdf = new jsPDF("portrait", "mm", "a4");

        for (let i = 0; i < pageEls.length; i++) {
          const canvas = await html2canvas(pageEls[i], {
            scale: 2,
            useCORS: true,
            logging: false,
            width: pageEls[i].offsetWidth,
            height: pageEls[i].offsetHeight,
          });
          const imgData = canvas.toDataURL("image/jpeg", 0.98);
          if (i > 0) pdf.addPage();
          pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);
        }

        const filename = `orcamento-${data.clientName.replace(/\s+/g, "-").toLowerCase()}.pdf`;
        pdf.save(filename);
      } catch (err) {
        console.error("Erro ao gerar PDF:", err);
      } finally {
        setGenerating(false);
        setEditingQuote(null);
        setQuoteData(null);
        setTab("historico");
      }
    }, 500);
  }

  function handleEdit(quote: SavedQuote) {
    setEditingQuote(quote);
    setTab("novo");
  }

  function handleCancelEdit() {
    setEditingQuote(null);
    setTab("historico");
  }

  // ── HISTÓRICO ──────────────────────────────────────────────────────────────
  const filtered = quotes.filter((q) => statusFilter === "todos" || q.status === statusFilter);
  const wonCount = quotes.filter((q) => q.status === "ganho").length;
  const pendingCount = quotes.filter((q) => q.status === "pendente").length;

  // ── PISCINAS ───────────────────────────────────────────────────────────────
  const [models, setModels] = useState<PoolModel[]>(() => loadPoolModels());
  const [sizes, setSizes] = useState<PoolSize[]>(() => loadPoolSizes());
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [showModelForm, setShowModelForm] = useState(false);
  const [showSizeForm, setShowSizeForm] = useState(false);
  const [editingModel, setEditingModel] = useState<PoolModel | null>(null);
  const [editingSize, setEditingSize] = useState<PoolSize | null>(null);
  const [modelForm, setModelForm] = useState({ name: "", line: "" });
  const [sizeForm, setSizeForm] = useState({ dimensions: "", area: "", price: "" });

  function refreshCatalog() {
    setModels(loadPoolModels());
    setSizes(loadPoolSizes());
  }

  function handleSaveModel() {
    if (!modelForm.name || !modelForm.line) return;
    if (editingModel) {
      savePoolModels(models.map((m) => m.id === editingModel.id ? { ...m, ...modelForm } : m));
    } else {
      savePoolModels([...models, { id: crypto.randomUUID(), name: modelForm.name, line: modelForm.line }]);
    }
    refreshCatalog();
    setShowModelForm(false);
    setEditingModel(null);
    setModelForm({ name: "", line: "" });
  }

  function handleDeleteModel(id: string) {
    if (!window.confirm("Excluir este modelo? Os tamanhos vinculados também serão removidos.")) return;
    savePoolModels(models.filter((m) => m.id !== id));
    savePoolSizes(sizes.filter((s) => s.modelId !== id));
    refreshCatalog();
    if (selectedModelId === id) setSelectedModelId("");
  }

  function handleSaveSize() {
    if (!sizeForm.dimensions || !sizeForm.area || !selectedModelId) return;
    if (editingSize) {
      savePoolSizes(sizes.map((s) => s.id === editingSize.id
        ? { ...s, dimensions: sizeForm.dimensions, area: sizeForm.area, price: parseFloat(sizeForm.price) || 0 }
        : s
      ));
    } else {
      savePoolSizes([...sizes, {
        id: crypto.randomUUID(), modelId: selectedModelId,
        dimensions: sizeForm.dimensions, area: sizeForm.area,
        price: parseFloat(sizeForm.price) || 0, semiPastilha: false,
      }]);
    }
    refreshCatalog();
    setShowSizeForm(false);
    setEditingSize(null);
    setSizeForm({ dimensions: "", area: "", price: "" });
  }

  function handleDeleteSize(id: string) {
    if (!window.confirm("Excluir este tamanho?")) return;
    savePoolSizes(sizes.filter((s) => s.id !== id));
    refreshCatalog();
  }

  function handleResetCatalog() {
    if (!window.confirm("Restaurar o catálogo padrão? Todas as personalizações serão perdidas.")) return;
    savePoolModels(defaultPoolModels);
    savePoolSizes(defaultPoolSizes);
    refreshCatalog();
    setSelectedModelId("");
  }

  const modelSizes = sizes.filter((s) => s.modelId === selectedModelId);
  const inputCls = "w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary/50 border border-border w-fit">
        {([
          { id: "historico" as Tab, icon: <History className="h-3.5 w-3.5" />, label: "Histórico" },
          { id: "novo" as Tab, icon: <Plus className="h-3.5 w-3.5" />, label: "Novo Orçamento" },
          ...(!isVendedor ? [{ id: "piscinas" as Tab, icon: <Waves className="h-3.5 w-3.5" />, label: "Piscinas" }] : []),
        ] as const).map(({ id, icon, label }) => (
          <button
            key={id}
            onClick={() => {
              setTab(id);
              if (id !== "novo") { setEditingQuote(null); setQuoteData(null); }
            }}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              tab === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {icon}{label}
          </button>
        ))}
      </div>

      {/* ── NOVO ORÇAMENTO ── */}
      {tab === "novo" && (
        <div className="max-w-2xl space-y-4">
          {editingQuote && (
            <div className="flex items-center justify-between rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800 px-4 py-3">
              <span className="text-sm font-medium text-amber-800 dark:text-amber-400">
                Editando orçamento de <strong>{editingQuote.clientName}</strong>
              </span>
              <button onClick={handleCancelEdit} className="text-xs text-amber-600 hover:text-amber-800 underline">
                Cancelar
              </button>
            </div>
          )}
          <QuoteForm
            onGenerate={handleGenerate}
            initialData={editingQuote?.formData}
            defaultSellerName={vendedorName}
            generating={generating}
            storeKind={storeKind}
          />
        </div>
      )}

      {/* ── HISTÓRICO ── */}
      {tab === "historico" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground">Total</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{quotes.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground">Pendentes</p>
              <p className="mt-1 text-2xl font-bold text-yellow-600">{pendingCount}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground">Ganhos</p>
              <p className="mt-1 text-2xl font-bold text-green-600">{wonCount}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {(["todos", "pendente", "ganho", "perdido"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                  statusFilter === s
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary hover:text-foreground"
                }`}
              >
                {s === "todos" ? "Todos" : STATUS_LABELS[s]}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {quotes.length === 0 ? "Nenhum orçamento criado ainda." : "Nenhum orçamento com este filtro."}
              </p>
              {quotes.length === 0 && (
                <button
                  onClick={() => setTab("novo")}
                  className="mt-4 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Criar primeiro orçamento
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-secondary/40 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Cliente</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Data</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Consultor</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Valor</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((q) => (
                    <tr key={q.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{q.clientName}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                        {new Date(q.date).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{q.vendedorName}</td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground">
                        {formatCurrency(q.proposalValue)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {q.status === "ganho" ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[q.status]}`}>
                            {STATUS_LABELS[q.status]}
                          </span>
                        ) : (
                          <select
                            value={q.status}
                            onChange={(e) => {
                              const val = e.target.value as QuoteStatus;
                              if (val === "ganho") setConfirmWonId(q.id);
                              else updateQuote(q.id, { status: val });
                            }}
                            className="text-xs border border-border rounded-lg px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="pendente">Pendente</option>
                            <option value="perdido">Perdido</option>
                            <option value="ganho">Ganho ✓</option>
                          </select>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {q.status !== "ganho" && (
                            <>
                              <button
                                onClick={() => handleEdit(q)}
                                title="Editar orçamento"
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setConfirmWonId(q.id)}
                                title="Marcar como ganho"
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                              >
                                <Trophy className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── PISCINAS ── */}
      {tab === "piscinas" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Gerencie o catálogo de modelos e tamanhos de piscinas iGUi.</p>
            <button onClick={handleResetCatalog} className="text-xs text-muted-foreground hover:text-foreground underline">
              Restaurar padrão
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Models panel */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
                <h3 className="text-sm font-semibold text-foreground">Modelos</h3>
                <button
                  onClick={() => { setShowModelForm(true); setEditingModel(null); setModelForm({ name: "", line: "" }); }}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Plus className="h-3 w-3" /> Novo
                </button>
              </div>

              {showModelForm && (
                <div className="p-4 border-b border-border bg-secondary/10 space-y-3">
                  <input className={inputCls} placeholder="Nome do modelo (ex: Navagio)" value={modelForm.name}
                    onChange={(e) => setModelForm((f) => ({ ...f, name: e.target.value }))} />
                  <input className={inputCls} placeholder="Linha (ex: Premium, Tradicional)" value={modelForm.line}
                    onChange={(e) => setModelForm((f) => ({ ...f, line: e.target.value }))} />
                  <div className="flex gap-2">
                    <button onClick={handleSaveModel} className="flex-1 py-2 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                      Salvar
                    </button>
                    <button onClick={() => { setShowModelForm(false); setEditingModel(null); }} className="px-3 py-2 text-xs font-medium border border-border rounded-lg hover:bg-secondary transition-colors">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}

              <ul className="divide-y divide-border">
                {models.map((m) => (
                  <li
                    key={m.id}
                    className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                      selectedModelId === m.id ? "bg-primary/5 border-l-2 border-primary" : "hover:bg-secondary/30"
                    }`}
                    onClick={() => setSelectedModelId(m.id)}
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.line}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground mr-1">
                        {sizes.filter((s) => s.modelId === m.id).length} tam.
                      </span>
                      <button onClick={(e) => { e.stopPropagation(); setEditingModel(m); setModelForm({ name: m.name, line: m.line }); setShowModelForm(true); }}
                        className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteModel(m.id); }}
                        className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <Trash2 className="h-3 w-3" />
                      </button>
                      <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${selectedModelId === m.id ? "-rotate-90" : ""}`} />
                    </div>
                  </li>
                ))}
                {models.length === 0 && (
                  <li className="px-4 py-8 text-center text-sm text-muted-foreground">Nenhum modelo cadastrado.</li>
                )}
              </ul>
            </div>

            {/* Sizes panel */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
                <h3 className="text-sm font-semibold text-foreground">
                  Tamanhos{selectedModelId ? ` — ${models.find((m) => m.id === selectedModelId)?.name}` : ""}
                </h3>
                {selectedModelId && (
                  <button
                    onClick={() => { setShowSizeForm(true); setEditingSize(null); setSizeForm({ dimensions: "", area: "", price: "" }); }}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="h-3 w-3" /> Novo
                  </button>
                )}
              </div>

              {!selectedModelId && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Selecione um modelo para ver os tamanhos.
                </div>
              )}

              {selectedModelId && (
                <>
                  {showSizeForm && (
                    <div className="p-4 border-b border-border bg-secondary/10 space-y-3">
                      <input className={inputCls} placeholder="Dimensões (ex: 4,00 x 2,50 x 1,10)"
                        value={sizeForm.dimensions} onChange={(e) => setSizeForm((f) => ({ ...f, dimensions: e.target.value }))} />
                      <input className={inputCls} placeholder="Área (ex: 10,00 m²)"
                        value={sizeForm.area} onChange={(e) => setSizeForm((f) => ({ ...f, area: e.target.value }))} />
                      <input type="number" className={inputCls} placeholder="Preço de referência (ex: 22500)"
                        value={sizeForm.price} onChange={(e) => setSizeForm((f) => ({ ...f, price: e.target.value }))} />
                      <div className="flex gap-2">
                        <button onClick={handleSaveSize} className="flex-1 py-2 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                          Salvar
                        </button>
                        <button onClick={() => { setShowSizeForm(false); setEditingSize(null); }} className="px-3 py-2 text-xs font-medium border border-border rounded-lg hover:bg-secondary transition-colors">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  <ul className="divide-y divide-border">
                    {modelSizes.map((s) => (
                      <li key={s.id} className="flex items-center justify-between px-4 py-3 hover:bg-secondary/20 transition-colors">
                        <div>
                          <p className="text-sm font-medium text-foreground">{s.dimensions} m</p>
                          <p className="text-xs text-muted-foreground">{s.area}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {s.price > 0 && <span className="text-xs text-muted-foreground">{formatCurrency(s.price)}</span>}
                          <button onClick={() => { setEditingSize(s); setSizeForm({ dimensions: s.dimensions, area: s.area, price: String(s.price) }); setShowSizeForm(true); }}
                            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button onClick={() => handleDeleteSize(s.id)}
                            className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </li>
                    ))}
                    {modelSizes.length === 0 && (
                      <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                        Nenhum tamanho cadastrado. Clique em "+ Novo" para adicionar.
                      </li>
                    )}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Won Modal */}
      {confirmWonId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl border border-border shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                <Trophy className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Marcar como Ganho?</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Esta ação é permanente e não pode ser desfeita.</p>
              </div>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800 px-3 py-2.5">
              <p className="text-xs text-amber-800 dark:text-amber-400 font-medium">
                O valor será contabilizado no faturamento do dashboard e o orçamento não poderá mais ser editado.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { markAsWon(confirmWonId); setConfirmWonId(null); }}
                className="flex-1 py-2.5 text-sm font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Confirmar
              </button>
              <button
                onClick={() => setConfirmWonId(null)}
                className="flex-1 py-2.5 text-sm font-medium border border-border rounded-lg hover:bg-secondary transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offscreen PDF template */}
      {quoteData && (
        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
          {storeKind === "igui"
            ? <IguiQuoteTemplate ref={quoteRef} data={quoteData} />
            : <QuoteTemplate ref={quoteRef} data={quoteData} />
          }
        </div>
      )}
    </div>
  );
}
