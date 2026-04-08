import { useState } from "react";
import { Eye, EyeOff, KeyRound, CheckCircle2, AlertCircle } from "lucide-react";
import logoSvg from "@/assets/logo.svg";

const API       = import.meta.env.VITE_API_URL ?? "http://localhost:3333";
const USERS_KEY = "igui_users";
const PASSWD_KEY = "igui_passwords";

interface Props {
  token:   string;
  onDone:  () => void; // volta para o login
}

export function ResetPasswordPage({ token, onDone }: Props) {
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [showPwd,   setShowPwd]   = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6)   { setError("A senha deve ter pelo menos 6 caracteres."); return; }
    if (password !== confirm)  { setError("As senhas não coincidem."); return; }
    setError(null);
    setLoading(true);

    try {
      const res  = await fetch(`${API}/api/auth/reset-password`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json() as { ok?: boolean; email?: string; error?: string };

      if (!res.ok || !data.ok) {
        setError(data.error ?? "Link inválido ou expirado.");
        setLoading(false);
        return;
      }

      // Atualiza a senha no localStorage
      if (data.email) {
        updatePasswordInStorage(data.email, password);
      }

      setSuccess(true);
    } catch {
      setError("Erro ao conectar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function updatePasswordInStorage(email: string, newPassword: string) {
    try {
      const rawUsers = localStorage.getItem(USERS_KEY);
      const users    = rawUsers ? JSON.parse(rawUsers) as { id: string; email: string }[] : [];
      const user     = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!user) return;

      const rawPwd   = localStorage.getItem(PASSWD_KEY);
      const passwords = rawPwd ? JSON.parse(rawPwd) as Record<string, string> : {};
      passwords[user.id] = newPassword;
      localStorage.setItem(PASSWD_KEY, JSON.stringify(passwords));
    } catch { /* ignora */ }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 50% at 50% 0%, hsl(var(--primary) / 0.12), transparent)",
        }}
      />

      <div className="w-full max-w-sm relative">
        <div className="flex flex-col items-center mb-8">
          <div className="h-20 w-20 rounded-2xl bg-[#1a1510] border border-[#f0d488]/25 flex items-center justify-center mb-4 shadow-lg">
            <img src={logoSvg} alt="iGUi Logo" className="h-14 w-14 object-contain" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Nova senha</h1>
          <p className="text-sm text-muted-foreground mt-1">iGUi Piscinas — Dashboard</p>
        </div>

        <div className="card-base p-6 space-y-5">
          {success ? (
            <div className="text-center space-y-4 py-2">
              <div className="flex justify-center">
                <div className="h-14 w-14 rounded-full bg-[hsl(var(--success)/0.1)] border border-[hsl(var(--success)/0.2)] flex items-center justify-center">
                  <CheckCircle2 className="h-7 w-7 text-[hsl(var(--success))]" />
                </div>
              </div>
              <div>
                <p className="font-semibold text-foreground">Senha redefinida!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Sua senha foi atualizada com sucesso.
                </p>
              </div>
              <button
                onClick={onDone}
                className="w-full px-4 py-2.5 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Ir para o login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <KeyRound className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Crie sua nova senha</p>
                  <p className="text-xs text-muted-foreground">Mínimo de 6 caracteres</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Nova senha</label>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(null); }}
                    placeholder="••••••••"
                    autoFocus
                    className="w-full px-3 py-2.5 pr-10 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                  />
                  <button type="button" onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Confirmar senha</label>
                <input
                  type={showPwd ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); setError(null); }}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-[hsl(var(--danger))] bg-[hsl(var(--danger)/0.08)] border border-[hsl(var(--danger)/0.2)] rounded-lg px-3 py-2.5">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {loading && <span className="h-4 w-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />}
                {loading ? "Salvando..." : "Salvar nova senha"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
