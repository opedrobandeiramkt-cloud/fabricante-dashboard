import { useState } from "react";
import { Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import logoSvg from "@/assets/logo.svg";

export function LoginPage() {
  const { login } = useAuth();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError("Preencha e-mail e senha.");
      return;
    }
    setError(null);
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.success) setError(result.error ?? "Erro ao entrar.");
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Glow de fundo */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, hsl(var(--primary) / 0.12), transparent)",
        }}
      />

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-20 w-20 rounded-2xl bg-[#1a1510] border border-[#f0d488]/25 flex items-center justify-center mb-4 shadow-lg">
            <img src={logoSvg} alt="iGUi Logo" className="h-14 w-14 object-contain" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Inteligência Comercial
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            iGUi Piscinas — Acesso ao Dashboard
          </p>
        </div>

        {/* Card do formulário */}
        <div className="card-base p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* E-mail */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">E-mail</label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                placeholder="seu@email.com"
                className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
              />
            </div>

            {/* Senha */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Senha</label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 pr-10 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Erro */}
            {error && (
              <div className="flex items-center gap-2 text-sm text-[hsl(var(--danger))] bg-[hsl(var(--danger)/0.08)] border border-[hsl(var(--danger)/0.2)] rounded-lg px-3 py-2.5">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Botão */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          {/* Credenciais de demo */}
          <div className="border-t border-border pt-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Credenciais de demonstração:</p>
            <div className="space-y-1.5">
              <DemoCredential
                label="Admin (acesso total)"
                email="admin@igui.com.br"
                password="admin2024"
                badge="admin"
                onUse={(e, p) => { setEmail(e); setPassword(p); setError(null); }}
              />
              <DemoCredential
                label="Carlos — SP Centro + Campinas"
                email="carlos@igui.com.br"
                password="igui2024"
                onUse={(e, p) => { setEmail(e); setPassword(p); setError(null); }}
              />
              <DemoCredential
                label="Ana — Curitiba"
                email="ana@igui.com.br"
                password="igui2024"
                onUse={(e, p) => { setEmail(e); setPassword(p); setError(null); }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DemoCredential({
  label, email, password, badge, onUse,
}: {
  label:    string;
  email:    string;
  password: string;
  badge?:   string;
  onUse:    (email: string, password: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onUse(email, password)}
      className="w-full text-left flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors group"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium text-foreground truncate">{label}</p>
          {badge && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-semibold flex-shrink-0">
              {badge}
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">{email}</p>
      </div>
      <span className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0">
        usar →
      </span>
    </button>
  );
}
