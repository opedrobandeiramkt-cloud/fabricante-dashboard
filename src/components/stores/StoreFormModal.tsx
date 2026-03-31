import { useState, useEffect } from "react";
import { X, Store, Save } from "lucide-react";
import type { Store as StoreType } from "@/lib/types";

const BR_STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA",
  "MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN",
  "RS","RO","RR","SC","SP","SE","TO",
];

type FormData = {
  name:       string;
  city:       string;
  state:      string;
  externalId: string;
  phone:      string;
  email:      string;
  active:     boolean;
};

const EMPTY: FormData = {
  name: "", city: "", state: "SP",
  externalId: "", phone: "", email: "", active: true,
};

interface StoreFormModalProps {
  store:    StoreType | null; // null = novo cadastro
  onSave:   (data: Omit<StoreType, "id" | "createdAt">) => void;
  onClose:  () => void;
}

export function StoreFormModal({ store, onSave, onClose }: StoreFormModalProps) {
  const [form, setForm]     = useState<FormData>(EMPTY);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  useEffect(() => {
    if (store) {
      setForm({
        name:       store.name,
        city:       store.city,
        state:      store.state,
        externalId: store.externalId ?? "",
        phone:      store.phone ?? "",
        email:      store.email ?? "",
        active:     store.active,
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [store]);

  function set(field: keyof FormData, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate(): boolean {
    const e: Partial<FormData> = {};
    if (!form.name.trim())       e.name  = "Nome obrigatório";
    if (!form.city.trim())       e.city  = "Cidade obrigatória";
    if (!form.state)             e.state = "Estado obrigatório";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "E-mail inválido";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      name:       form.name.trim(),
      city:       form.city.trim(),
      state:      form.state,
      externalId: form.externalId.trim() || undefined,
      phone:      form.phone.trim() || undefined,
      email:      form.email.trim() || undefined,
      active:     form.active,
    });
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[hsl(var(--primary)/0.12)] flex items-center justify-center">
              <Store className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                {store ? "Editar Loja" : "Nova Loja"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {store ? `Editando: ${store.name}` : "Preencha os dados da loja"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="px-6 py-5 space-y-5">

            {/* Nome */}
            <Field label="Nome da Loja" required error={errors.name}>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="ex: iGUi São Paulo Centro"
                className={inputCls(!!errors.name)}
              />
            </Field>

            {/* Cidade + Estado */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Cidade" required error={errors.city}>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  placeholder="ex: São Paulo"
                  className={inputCls(!!errors.city)}
                />
              </Field>
              <Field label="Estado" required error={errors.state}>
                <select
                  value={form.state}
                  onChange={(e) => set("state", e.target.value)}
                  className={inputCls(false)}
                >
                  {BR_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </Field>
            </div>

            {/* Telefone + E-mail */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Telefone" error={errors.phone}>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="(11) 99999-0000"
                  className={inputCls(false)}
                />
              </Field>
              <Field label="E-mail" error={errors.email}>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="loja@igui.com.br"
                  className={inputCls(!!errors.email)}
                />
              </Field>
            </div>

            {/* ID no CRM */}
            <Field
              label="ID no CRM"
              hint="Identificador da loja no Chatwoot ou Helena CRM"
            >
              <input
                type="text"
                value={form.externalId}
                onChange={(e) => set("externalId", e.target.value)}
                placeholder="ex: loja-sp-01"
                className={inputCls(false)}
              />
            </Field>

            {/* Status */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
              <div>
                <p className="text-sm font-medium text-foreground">Loja Ativa</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Lojas inativas não aparecem nos filtros do dashboard
                </p>
              </div>
              <button
                type="button"
                onClick={() => set("active", !form.active)}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  form.active ? "bg-primary" : "bg-secondary border border-border"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    form.active ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Save className="h-4 w-4" />
              {store ? "Salvar Alterações" : "Cadastrar Loja"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

// ─── Sub-componentes de formulário ────────────────────────────────────────────

function inputCls(hasError: boolean) {
  return `w-full px-3 py-2 text-sm bg-background border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors ${
    hasError ? "border-[hsl(var(--danger))]" : "border-border"
  }`;
}

function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label:     string;
  required?: boolean;
  hint?:     string;
  error?:    string;
  children:  React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-[hsl(var(--danger))] ml-1">*</span>}
      </label>
      {children}
      {hint  && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-[hsl(var(--danger))]">{error}</p>}
    </div>
  );
}
