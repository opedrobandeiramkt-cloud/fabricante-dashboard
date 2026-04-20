import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import type { Orcamento, OrcamentoItem, OrcamentoStatus } from "@/lib/types";
import type { AppUser } from "@/lib/auth-types";
import type { Store } from "@/lib/types";

interface Props {
  orcamento: Orcamento | null; // null = novo
  currentUser: AppUser;
  stores: Store[];
  vendedores: AppUser[];
  allowedStoreIds: string[]; // [] = todos
  onSave: (data: Omit<Orcamento, "id" | "numero" | "createdAt" | "updatedAt" | "wonAt">) => void;
  onClose: () => void;
}

const STATUS_OPTIONS: { value: OrcamentoStatus; label: string }[] = [
  { value: "rascunho", label: "Rascunho" },
  { value: "enviado", label: "Enviado" },
  { value: "em_negociacao", label: "Em Negociação" },
];

const uid = () => Math.random().toString(36).slice(2, 10);

function emptyItem(): OrcamentoItem {
  return { id: uid(), description: "", quantity: 1, unitPrice: 0 };
}

function calcTotal(items: OrcamentoItem[]): number {
  return items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
}

function fmtBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function OrcamentoFormModal({
  orcamento,
  currentUser,
  stores,
  vendedores,
  allowedStoreIds,
  onSave,
  onClose,
}: Props) {
  const isNew = orcamento === null;
  const isVendedor = currentUser.role === "vendedor";

  const availableStores = allowedStoreIds.length > 0
    ? stores.filter((s) => allowedStoreIds.includes(s.id) && s.active !== false)
    : stores.filter((s) => s.active !== false);

  const [clientName,  setClientName]  = useState(orcamento?.clientName ?? "");
  const [clientPhone, setClientPhone] = useState(orcamento?.clientPhone ?? "");
  const [clientEmail, setClientEmail] = useState(orcamento?.clientEmail ?? "");
  const [storeId,     setStoreId]     = useState(
    orcamento?.storeId ?? (availableStores[0]?.id ?? ""),
  );
  const [vendedorId,  setVendedorId]  = useState(
    orcamento?.vendedorId ?? currentUser.id,
  );
  const [status, setStatus] = useState<OrcamentoStatus>(
    orcamento?.status ?? "rascunho",
  );
  const [items, setItems] = useState<OrcamentoItem[]>(
    orcamento?.items.length ? orcamento.items : [emptyItem()],
  );
  const [notes, setNotes] = useState(orcamento?.notes ?? "");
  const [error, setError] = useState("");

  const totalValue = calcTotal(items);

  const selectedVendedor =
    isVendedor
      ? currentUser
      : vendedores.find((v) => v.id === vendedorId) ?? currentUser;

  function handleItemChange(id: string, field: keyof OrcamentoItem, value: string | number) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function removeItem(id: string) {
    setItems((prev) => (prev.length > 1 ? prev.filter((i) => i.id !== id) : prev));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientName.trim()) { setError("Informe o nome do cliente."); return; }
    if (!storeId)            { setError("Selecione uma loja."); return; }
    if (items.some((i) => !i.description.trim())) {
      setError("Todos os itens precisam de descrição.");
      return;
    }
    setError("");

    onSave({
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim() || undefined,
      clientEmail: clientEmail.trim() || undefined,
      storeId,
      vendedorId: selectedVendedor.id,
      vendedorName: selectedVendedor.name,
      items,
      totalValue,
      status,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">
            {isNew ? "Novo Orçamento" : `Editar ${orcamento.numero}`}
          </h2>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-5">

            {/* Cliente */}
            <fieldset className="space-y-3">
              <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Cliente
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs text-muted-foreground mb-1">
                    Nome <span className="text-[hsl(var(--danger))]">*</span>
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Nome do cliente"
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Telefone</label>
                  <input
                    type="text"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">E-mail</label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="cliente@email.com"
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
            </fieldset>

            {/* Loja + Vendedor + Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Loja <span className="text-[hsl(var(--danger))]">*</span>
                </label>
                <select
                  value={storeId}
                  onChange={(e) => setStoreId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {availableStores.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">Vendedor</label>
                {isVendedor ? (
                  <input
                    type="text"
                    value={currentUser.name}
                    disabled
                    className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-lg text-muted-foreground"
                  />
                ) : (
                  <select
                    value={vendedorId}
                    onChange={(e) => setVendedorId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {vendedores.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as OrcamentoStatus)}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Itens */}
            <fieldset className="space-y-3">
              <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Itens do Orçamento
              </legend>

              <div className="space-y-2">
                {/* Cabeçalho da tabela */}
                <div className="grid grid-cols-[1fr_72px_112px_32px] gap-2 px-1">
                  <span className="text-xs text-muted-foreground">Descrição</span>
                  <span className="text-xs text-muted-foreground text-center">Qtd</span>
                  <span className="text-xs text-muted-foreground text-right">Valor unit.</span>
                  <span />
                </div>

                {items.map((item) => (
                  <div key={item.id} className="grid grid-cols-[1fr_72px_112px_32px] gap-2 items-center">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                      placeholder="Ex: Piscina de vinil 6x3m"
                      className="px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => handleItemChange(item.id, "quantity", Math.max(1, Number(e.target.value)))}
                      className="px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(item.id, "unitPrice", Number(e.target.value))}
                      className="px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground text-right focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                      className="h-8 w-8 rounded-lg hover:bg-[hsl(var(--danger)/0.1)] flex items-center justify-center text-muted-foreground hover:text-[hsl(var(--danger))] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors border border-dashed border-border w-full justify-center"
                >
                  <Plus className="h-3.5 w-3.5" /> Adicionar item
                </button>
              </div>

              {/* Total */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
                <span className="text-sm font-medium text-muted-foreground">Total:</span>
                <span className="text-lg font-bold text-[hsl(var(--success))]">
                  {fmtBRL(totalValue)}
                </span>
              </div>
            </fieldset>

            {/* Observações */}
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Observações</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Informações adicionais, condições de pagamento, prazo de entrega..."
                rows={3}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>

            {error && (
              <p className="text-xs text-[hsl(var(--danger))] bg-[hsl(var(--danger)/0.08)] px-3 py-2 rounded-lg border border-[hsl(var(--danger)/0.2)]">
                {error}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors border border-border"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              {isNew ? "Criar Orçamento" : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
