import { useState, useEffect } from "react";
import { X, UserCircle2, Save, Eye, EyeOff, ShieldCheck, Store } from "lucide-react";
import { STORES } from "@/lib/constants";
import type { AppUser } from "@/lib/auth-types";
import type { UserFormData } from "@/hooks/useUsers";

interface UserFormModalProps {
  user:    AppUser | null; // null = novo
  onSave:  (data: UserFormData) => void;
  onClose: () => void;
}

const EMPTY: UserFormData = {
  name: "", email: "", role: "fabricante", storeIds: [], password: "",
};

export function UserFormModal({ user, onSave, onClose }: UserFormModalProps) {
  const [form,    setForm]    = useState<UserFormData>(EMPTY);
  const [showPwd, setShowPwd] = useState(false);
  const [errors,  setErrors]  = useState<Partial<Record<keyof UserFormData, string>>>({});

  const isNew = !user;

  useEffect(() => {
    if (user) {
      setForm({ name: user.name, email: user.email, role: user.role, storeIds: user.storeIds, password: "" });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [user]);

  function set<K extends keyof UserFormData>(field: K, value: UserFormData[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function toggleStore(id: string) {
    set("storeIds",
      form.storeIds.includes(id)
        ? form.storeIds.filter((s) => s !== id)
        : [...form.storeIds, id]
    );
  }

  function validate(): boolean {
    const e: Partial<Record<keyof UserFormData, string>> = {};
    if (!form.name.trim())  e.name  = "Nome obrigatório";
    if (!form.email.trim()) e.email = "E-mail obrigatório";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "E-mail inválido";
    if (isNew && !form.password) e.password = "Senha obrigatória";
    if (isNew && form.password && form.password.length < 6) e.password = "Mínimo 6 caracteres";
    if (form.role === "fabricante" && form.storeIds.length === 0)
      e.storeIds = "Selecione ao menos uma loja";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSave(form);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[hsl(var(--primary)/0.12)] flex items-center justify-center">
              <UserCircle2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                {isNew ? "Novo Usuário" : "Editar Usuário"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isNew ? "Preencha os dados de acesso" : user.name}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="px-6 py-5 space-y-5">

            {/* Nome */}
            <Field label="Nome completo" required error={errors.name}>
              <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)}
                placeholder="ex: Carlos Mendes" className={inputCls(!!errors.name)} />
            </Field>

            {/* E-mail */}
            <Field label="E-mail" required error={errors.email}>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                placeholder="usuario@igui.com.br" className={inputCls(!!errors.email)} />
            </Field>

            {/* Senha — obrigatória apenas na criação */}
            <Field
              label={isNew ? "Senha" : "Nova Senha"}
              required={isNew}
              hint={isNew ? "Mínimo 6 caracteres" : "Deixe em branco para manter a atual"}
              error={errors.password}
            >
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder={isNew ? "••••••" : "Nova senha (opcional)"}
                  className={`${inputCls(!!errors.password)} pr-10`}
                />
                <button type="button" onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            {/* Role */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Perfil de acesso <span className="text-[hsl(var(--danger))]">*</span></label>
              <div className="grid grid-cols-2 gap-3">
                <RoleOption
                  selected={form.role === "fabricante"}
                  onClick={() => set("role", "fabricante")}
                  icon={<Store className="h-4 w-4" />}
                  title="Fabricante"
                  description="Vê apenas suas lojas"
                />
                <RoleOption
                  selected={form.role === "admin"}
                  onClick={() => set("role", "admin")}
                  icon={<ShieldCheck className="h-4 w-4" />}
                  title="Administrador"
                  description="Acesso total ao sistema"
                />
              </div>
            </div>

            {/* Lojas — apenas para fabricante */}
            {form.role === "fabricante" && (
              <Field label="Lojas sob responsabilidade" required error={errors.storeIds}>
                <div className="space-y-2 mt-1">
                  {STORES.map((store) => {
                    const checked = form.storeIds.includes(store.id);
                    return (
                      <button key={store.id} type="button" onClick={() => toggleStore(store.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                          checked
                            ? "border-primary bg-[hsl(var(--primary)/0.08)] text-foreground"
                            : "border-border bg-background text-muted-foreground hover:border-border/80 hover:text-foreground"
                        }`}>
                        <div className={`h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                          checked ? "bg-primary border-primary" : "border-border"
                        }`}>
                          {checked && <span className="text-white text-[10px] font-bold">✓</span>}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{store.name}</p>
                          <p className="text-xs text-muted-foreground">{store.city} — {store.state}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {errors.storeIds && <p className="text-xs text-[hsl(var(--danger))] mt-1">{errors.storeIds}</p>}
              </Field>
            )}

          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors">
              Cancelar
            </button>
            <button type="submit"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              <Save className="h-4 w-4" />
              {isNew ? "Criar Usuário" : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function inputCls(hasError: boolean) {
  return `w-full px-3 py-2 text-sm bg-background border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors ${
    hasError ? "border-[hsl(var(--danger))]" : "border-border"
  }`;
}

function Field({ label, required, hint, error, children }: {
  label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">
        {label}{required && <span className="text-[hsl(var(--danger))] ml-1">*</span>}
      </label>
      {children}
      {hint  && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-[hsl(var(--danger))]">{error}</p>}
    </div>
  );
}

function RoleOption({ selected, onClick, icon, title, description }: {
  selected: boolean; onClick: () => void; icon: React.ReactNode; title: string; description: string;
}) {
  return (
    <button type="button" onClick={onClick}
      className={`flex flex-col items-start gap-1 p-3 rounded-lg border text-left transition-colors ${
        selected
          ? "border-primary bg-[hsl(var(--primary)/0.08)]"
          : "border-border hover:border-border/80 hover:bg-secondary/30"
      }`}>
      <div className={`flex items-center gap-2 font-medium text-sm ${selected ? "text-primary" : "text-foreground"}`}>
        {icon}{title}
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </button>
  );
}
