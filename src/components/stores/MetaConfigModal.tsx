import { useState, useEffect } from "react";
import { X, Loader2, CheckCircle2, XCircle, Wifi, Info } from "lucide-react";
import { api } from "@/lib/api";
import type { StoreMetaConfig, MetaTestResult } from "@/lib/types";

interface Props {
  storeId:   string;
  storeName: string;
  onClose:   () => void;
}

export function MetaConfigModal({ storeId, storeName, onClose }: Props) {
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [testing,    setTesting]    = useState(false);
  const [existing,   setExisting]   = useState<StoreMetaConfig | null>(null);
  const [error,      setError]      = useState<string | null>(null);
  const [testResult, setTestResult] = useState<MetaTestResult | null>(null);

  const [adAccountId,  setAdAccountId]  = useState("");
  const [accessToken,  setAccessToken]  = useState("");
  const [pixelId,      setPixelId]      = useState("");
  const [syncEnabled,  setSyncEnabled]  = useState(true);

  useEffect(() => {
    api.getMetaConfig(storeId)
      .then((cfg) => {
        setExisting(cfg);
        setAdAccountId(cfg.adAccountId);
        setPixelId(cfg.pixelId ?? "");
        setSyncEnabled(cfg.syncEnabled);
      })
      .catch(() => {
        // config ainda não existe — começa em branco
      })
      .finally(() => setLoading(false));
  }, [storeId]);

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.testMetaConfig(storeId);
      setTestResult(res);
    } catch {
      setTestResult({ ok: false, latencyMs: 0, error: "Erro ao testar" });
    } finally {
      setTesting(false);
    }
  }

  async function handleSave() {
    if (!adAccountId.trim()) {
      setError("Ad Account ID é obrigatório.");
      return;
    }
    if (!existing && !accessToken.trim()) {
      setError("Access Token é obrigatório na criação.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.saveMetaConfig(storeId, {
        adAccountId:  adAccountId.trim(),
        pixelId:      pixelId.trim() || undefined,
        syncEnabled,
        ...(accessToken.trim() ? { accessToken: accessToken.trim() } : {}),
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-semibold text-foreground">Configurar Meta Ads</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{storeName}</p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="p-6 space-y-5">

            {/* Info box */}
            <div className="flex gap-2.5 p-3 bg-blue-500/8 border border-blue-500/20 rounded-lg">
              <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Use um <span className="font-semibold text-foreground">System User Token</span> para evitar expiração.
                Crie em Gerenciador de Negócios → Usuários do Sistema → Gerar token com permissão{" "}
                <code className="text-[10px] bg-secondary px-1 py-0.5 rounded">ads_read</code>.
              </p>
            </div>

            {/* Ad Account ID */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Ad Account ID
              </label>
              <input
                value={adAccountId}
                onChange={(e) => setAdAccountId(e.target.value)}
                placeholder="act_1234567890"
                className="w-full px-3 py-2 text-sm font-mono bg-secondary/50 border border-border rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Access Token */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Access Token
                {existing?.hasToken && (
                  <span className="ml-2 text-[10px] text-[hsl(var(--success))] normal-case font-normal">
                    já configurado
                  </span>
                )}
              </label>
              <input
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder={existing?.hasToken ? "••••••••• (manter atual)" : "EAAxxxxxxxxxx..."}
                className="w-full px-3 py-2 text-sm font-mono bg-secondary/50 border border-border rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Pixel ID (opcional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Pixel ID{" "}
                <span className="normal-case font-normal text-muted-foreground/70">(opcional — para CAPI futuro)</span>
              </label>
              <input
                value={pixelId}
                onChange={(e) => setPixelId(e.target.value)}
                placeholder="123456789012345"
                className="w-full px-3 py-2 text-sm font-mono bg-secondary/50 border border-border rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Sync enabled toggle */}
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium text-foreground">Sincronização ativa</p>
                <p className="text-xs text-muted-foreground mt-0.5">O N8N incluirá esta loja na sync diária</p>
              </div>
              <button
                onClick={() => setSyncEnabled((v) => !v)}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  syncEnabled ? "bg-primary" : "bg-secondary border border-border"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                    syncEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Botão Testar */}
            {existing?.hasToken && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleTest}
                  disabled={testing}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-secondary transition-colors disabled:opacity-50"
                >
                  {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wifi className="h-3.5 w-3.5" />}
                  Testar conexão
                </button>
                {testResult && (
                  <span className={`flex items-center gap-1.5 text-xs font-medium ${
                    testResult.ok ? "text-[hsl(var(--success))]" : "text-[hsl(var(--danger))]"
                  }`}>
                    {testResult.ok
                      ? <CheckCircle2 className="h-3.5 w-3.5" />
                      : <XCircle className="h-3.5 w-3.5" />
                    }
                    {testResult.ok
                      ? `Conta: ${testResult.accountName} (${testResult.latencyMs}ms)`
                      : (testResult.error ?? "Falha na conexão")
                    }
                  </span>
                )}
              </div>
            )}

            {/* Erro */}
            {error && (
              <p className="text-xs text-[hsl(var(--danger))] bg-[hsl(var(--danger)/0.08)] border border-[hsl(var(--danger)/0.2)] px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            {/* Footer */}
            <div className="flex gap-3 pt-2 border-t border-border">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors border border-border"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saving ? "Salvando..." : "Salvar Configuração"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
