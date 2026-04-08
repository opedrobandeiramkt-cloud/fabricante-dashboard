import { useState } from "react";
import { X, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3333";

interface Props {
  onClose: () => void;
}

export function ForgotPasswordModal({ onClose }: Props) {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) { setError("Informe seu e-mail."); return; }
    setError(null);
    setLoading(true);
    try {
      await fetch(`${API}/api/auth/forgot-password`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email }),
      });
      setSent(true);
    } catch {
      setError("Erro ao conectar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-5">
        {/* Fechar */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {sent ? (
          <div className="text-center space-y-3 py-2">
            <div className="flex justify-center">
              <div className="h-14 w-14 rounded-full bg-[hsl(var(--success)/0.1)] border border-[hsl(var(--success)/0.2)] flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-[hsl(var(--success))]" />
              </div>
            </div>
            <h2 className="text-lg font-bold text-foreground">E-mail enviado!</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Se <strong className="text-foreground">{email}</strong> estiver cadastrado,
              você receberá um link para redefinir sua senha em instantes.
            </p>
            <p className="text-xs text-muted-foreground">
              Verifique também a pasta de spam. O link expira em 1 hora.
            </p>
            <button
              onClick={onClose}
              className="mt-2 w-full px-4 py-2.5 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Voltar ao login
            </button>
          </div>
        ) : (
          <>
            <div>
              <h2 className="text-lg font-bold text-foreground">Esqueceu a senha?</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Informe seu e-mail e enviaremos um link para criar uma nova senha.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    autoFocus
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                    placeholder="seu@email.com"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-[hsl(var(--danger))]">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <span className="h-4 w-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : null}
                {loading ? "Enviando..." : "Enviar link de redefinição"}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao login
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
