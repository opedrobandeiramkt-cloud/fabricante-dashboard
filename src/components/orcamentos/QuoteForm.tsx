import { useState, useEffect } from "react";
import {
  heatingOptions,
  casasDeMaquina,
  loadPoolModels,
  loadPoolSizes,
  type QuoteFormData,
  type PoolModel,
  type PoolSize,
} from "@/lib/pool-data";

interface QuoteFormProps {
  onGenerate: (data: QuoteFormData) => void;
  initialData?: QuoteFormData;
  defaultSellerName?: string;
  generating?: boolean;
}

const emptyForm = (sellerName = ""): QuoteFormData => ({
  clientName: "",
  clientCity: "",
  clientEmail: "",
  clientAddress: "",
  sellerName,
  poolModelId: "",
  poolSizeId: "",
  heatingId: null,
  casaDeMaquinaId: "dry-pump-plus",
  includeClorador: false,
  proposalValue: 0,
});

const inputCls = "w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";
const labelCls = "block text-xs font-semibold text-muted-foreground mb-1.5";

export function QuoteForm({ onGenerate, initialData, defaultSellerName = "", generating }: QuoteFormProps) {
  const [poolModels, setPoolModels] = useState<PoolModel[]>([]);
  const [poolSizes, setPoolSizes] = useState<PoolSize[]>([]);
  const [form, setForm] = useState<QuoteFormData>(initialData ?? emptyForm(defaultSellerName));

  useEffect(() => {
    setPoolModels(loadPoolModels());
    setPoolSizes(loadPoolSizes());
  }, []);

  useEffect(() => {
    if (initialData) setForm(initialData);
    else setForm(emptyForm(defaultSellerName));
  }, [initialData, defaultSellerName]);

  const availableSizes = poolSizes.filter((s) => s.modelId === form.poolModelId);

  const update = <K extends keyof QuoteFormData>(field: K, value: QuoteFormData[K]) => {
    if (field === "poolModelId") {
      setForm((prev) => ({ ...prev, poolModelId: value as string, poolSizeId: "" }));
    } else {
      setForm((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(form);
  };

  const canSubmit = form.poolModelId && form.poolSizeId && form.clientName && form.sellerName && form.proposalValue > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Client */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary inline-block" />
          Dados do Cliente
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Nome do Cliente *</label>
            <input required className={inputCls} value={form.clientName} onChange={(e) => update("clientName", e.target.value)} placeholder="João Silva" />
          </div>
          <div>
            <label className={labelCls}>Cidade *</label>
            <input required className={inputCls} value={form.clientCity} onChange={(e) => update("clientCity", e.target.value)} placeholder="Cianorte — PR" />
          </div>
          <div>
            <label className={labelCls}>E-mail</label>
            <input type="email" className={inputCls} value={form.clientEmail} onChange={(e) => update("clientEmail", e.target.value)} placeholder="joao@email.com" />
          </div>
          <div>
            <label className={labelCls}>Endereço</label>
            <input className={inputCls} value={form.clientAddress} onChange={(e) => update("clientAddress", e.target.value)} placeholder="Rua das Palmeiras, 284" />
          </div>
          <div>
            <label className={labelCls}>Nome do Consultor *</label>
            <input required className={inputCls} value={form.sellerName} onChange={(e) => update("sellerName", e.target.value)} placeholder="Lucas Mendes" />
          </div>
        </div>
      </div>

      {/* Pool */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
          Piscina
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Modelo *</label>
            <select required className={inputCls} value={form.poolModelId} onChange={(e) => update("poolModelId", e.target.value)}>
              <option value="">Selecione o modelo</option>
              {poolModels.map((m) => (
                <option key={m.id} value={m.id}>{m.name} — {m.line}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Tamanho *</label>
            <select required className={inputCls} value={form.poolSizeId} onChange={(e) => update("poolSizeId", e.target.value)} disabled={!form.poolModelId}>
              <option value="">{form.poolModelId ? "Selecione o tamanho" : "Selecione o modelo primeiro"}</option>
              {availableSizes.map((s) => (
                <option key={s.id} value={s.id}>{s.dimensions} — {s.area}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Equipment */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
          Equipamentos
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Aquecimento</label>
            <select className={inputCls} value={form.heatingId ?? "none"} onChange={(e) => update("heatingId", e.target.value === "none" ? null : e.target.value)}>
              <option value="none">Sem aquecimento</option>
              {heatingOptions.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Casa de Máquina *</label>
            <select required className={inputCls} value={form.casaDeMaquinaId} onChange={(e) => update("casaDeMaquinaId", e.target.value)}>
              {casasDeMaquina.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={form.includeClorador}
            onChange={(e) => update("includeClorador", e.target.checked)}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          <span className="text-sm text-foreground">Incluir Clorador Automático</span>
        </label>
      </div>

      {/* Value */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary inline-block" />
          Valor da Proposta
        </h3>
        <div>
          <label className={labelCls}>Valor Total (R$) *</label>
          <input
            type="number"
            required
            min={1}
            step="0.01"
            className={`${inputCls} text-lg font-bold`}
            value={form.proposalValue || ""}
            onChange={(e) => update("proposalValue", parseFloat(e.target.value) || 0)}
            placeholder="25899.90"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={!canSubmit || generating}
        className="w-full py-3 px-4 text-sm font-bold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {generating ? "Gerando PDF..." : initialData ? "Atualizar e Gerar PDF" : "Gerar Orçamento em PDF"}
      </button>
    </form>
  );
}
