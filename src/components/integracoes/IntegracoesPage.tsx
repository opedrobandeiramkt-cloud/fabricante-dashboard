import { useState, useEffect } from "react";
import {
  BarChart2, MessageCircle, Webhook, Loader2, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, Copy, Check, Info, Wifi, ExternalLink,
  AlertCircle, Settings2,
} from "lucide-react";
import { api } from "@/lib/api";
import { useStores } from "@/contexts/StoresContext";
import type { Store } from "@/lib/types";
import type { StoreMetaConfig, StoreZapiConfig } from "@/lib/types";

type Tab = "meta" | "whatsapp" | "webhooks";

// ─── Toggle reutilizável ─────────────────────────────────────────────────────
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 rounded-full transition-colors flex-shrink-0 ${
        on ? "bg-primary" : "bg-secondary border border-border"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
          on ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

// ─── Badge de status ─────────────────────────────────────────────────────────
function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
      ok
        ? "bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]"
        : "bg-secondary text-muted-foreground"
    }`}>
      {ok ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
      {label}
    </span>
  );
}

// ─── Campo de input ──────────────────────────────────────────────────────────
function Field({
  label, hint, value, onChange, placeholder, type = "text",
}: {
  label: string; hint?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
        {hint && <span className="ml-1.5 normal-case font-normal text-muted-foreground/60">{hint}</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm font-mono bg-secondary/50 border border-border rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Aba Meta Ads
// ═══════════════════════════════════════════════════════════════════════════════

function MetaStoreRow({ store }: { store: Store }) {
  const [open,        setOpen]        = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [testing,     setTesting]     = useState(false);
  const [config,      setConfig]      = useState<StoreMetaConfig | null>(null);
  const [testResult,  setTestResult]  = useState<{ ok: boolean; accountName?: string; latencyMs: number; error?: string } | null>(null);
  const [error,       setError]       = useState<string | null>(null);

  const [adAccountId, setAdAccountId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [pixelId,     setPixelId]     = useState("");
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [capiEnabled, setCapiEnabled] = useState(false);

  async function loadConfig() {
    setLoading(true);
    try {
      const cfg = await api.getMetaConfig(store.id);
      setConfig(cfg);
      setAdAccountId(cfg.adAccountId);
      setPixelId(cfg.pixelId ?? "");
      setSyncEnabled(cfg.syncEnabled);
      setCapiEnabled(cfg.capiEnabled);
    } catch {
      // config ainda não existe
    } finally {
      setLoading(false);
    }
  }

  function handleOpen() {
    const next = !open;
    setOpen(next);
    if (next && config === null && !loading) loadConfig();
  }

  async function handleSave() {
    if (!adAccountId.trim()) { setError("Ad Account ID é obrigatório."); return; }
    if (!config && !accessToken.trim()) { setError("Access Token é obrigatório na criação."); return; }
    setSaving(true); setError(null);
    try {
      const updated = await api.saveMetaConfig(store.id, {
        adAccountId: adAccountId.trim(),
        pixelId:     pixelId.trim() || undefined,
        syncEnabled,
        capiEnabled,
        ...(accessToken.trim() ? { accessToken: accessToken.trim() } : {}),
      });
      setConfig(updated);
      setAccessToken("");
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true); setTestResult(null);
    try {
      const res = await api.testMetaConfig(store.id);
      setTestResult(res);
    } catch {
      setTestResult({ ok: false, latencyMs: 0, error: "Erro ao testar" });
    } finally {
      setTesting(false);
    }
  }

  const isConfigured = config !== null;

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={handleOpen}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-secondary/20 transition-colors text-left"
      >
        <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
          <BarChart2 className="h-4 w-4 text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground text-sm">{store.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isConfigured ? config.adAccountId : "Não configurado"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isConfigured && <StatusBadge ok={config.syncEnabled} label="Sync" />}
          {isConfigured && config.capiEnabled && <StatusBadge ok={true} label="CAPI" />}
          {isConfigured && config.pixelId && <StatusBadge ok={true} label="Pixel" />}
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-border px-5 py-5 bg-secondary/10 space-y-4">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="flex gap-2.5 p-3 bg-blue-500/8 border border-blue-500/20 rounded-lg">
                <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Use um <span className="font-semibold text-foreground">System User Token</span> com permissão{" "}
                  <code className="text-[10px] bg-secondary px-1 py-0.5 rounded">ads_read</code>.
                  Para CAPI, o Pixel ID é obrigatório.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Ad Account ID" value={adAccountId} onChange={setAdAccountId} placeholder="act_1234567890" />
                <Field label="Pixel ID" hint="(para CAPI)" value={pixelId} onChange={setPixelId} placeholder="123456789012345" />
              </div>

              <Field
                label="Access Token"
                hint={config?.hasToken ? "• já configurado — deixe em branco para manter" : undefined}
                value={accessToken}
                onChange={setAccessToken}
                placeholder={config?.hasToken ? "••••••••• (manter atual)" : "EAAxxxxxxxxxx..."}
                type="password"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="flex items-center justify-between py-1 px-3 rounded-lg border border-border bg-background">
                  <div>
                    <p className="text-sm font-medium text-foreground">Sincronização diária</p>
                    <p className="text-xs text-muted-foreground">N8N inclui esta loja no sync</p>
                  </div>
                  <Toggle on={syncEnabled} onChange={setSyncEnabled} />
                </div>
                <div className={`flex items-center justify-between py-1 px-3 rounded-lg border bg-background transition-colors ${
                  capiEnabled ? "border-primary/40 bg-primary/3" : "border-border"
                }`}>
                  <div>
                    <p className="text-sm font-medium text-foreground">Conversions API (CAPI)</p>
                    <p className="text-xs text-muted-foreground">Envia leads e vendas ao Meta</p>
                  </div>
                  <Toggle on={capiEnabled} onChange={setCapiEnabled} />
                </div>
              </div>

              {config?.hasToken && (
                <div className="flex items-center gap-3 pt-1">
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
                      {testResult.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                      {testResult.ok ? `${testResult.accountName} (${testResult.latencyMs}ms)` : (testResult.error ?? "Falha")}
                    </span>
                  )}
                </div>
              )}

              {error && (
                <p className="text-xs text-[hsl(var(--danger))] bg-[hsl(var(--danger)/0.08)] border border-[hsl(var(--danger)/0.2)] px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-1 border-t border-border">
                <button onClick={() => setOpen(false)} className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors border border-border">
                  Cancelar
                </button>
                <button onClick={handleSave} disabled={saving} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Aba WhatsApp / Z-API
// ═══════════════════════════════════════════════════════════════════════════════

function ZapiStoreRow({ store }: { store: Store }) {
  const [open,          setOpen]          = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [config,        setConfig]        = useState<StoreZapiConfig | null>(null);
  const [error,         setError]         = useState<string | null>(null);

  const [instanceId,     setInstanceId]     = useState("");
  const [clientToken,    setClientToken]    = useState("");
  const [securityToken,  setSecurityToken]  = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [syncEnabled,    setSyncEnabled]    = useState(true);

  async function loadConfig() {
    setLoading(true);
    try {
      const cfg = await api.getZapiConfig(store.id);
      setConfig(cfg);
      setInstanceId(cfg.instanceId);
      setWhatsappNumber(cfg.whatsappNumber);
      setSyncEnabled(cfg.syncEnabled);
    } catch {
      // não existe ainda
    } finally {
      setLoading(false);
    }
  }

  function handleOpen() {
    const next = !open;
    setOpen(next);
    if (next && config === null && !loading) loadConfig();
  }

  async function handleSave() {
    if (!instanceId.trim())     { setError("Instance ID é obrigatório."); return; }
    if (!clientToken.trim())    { setError("Client Token é obrigatório."); return; }
    if (!whatsappNumber.trim()) { setError("Número do WhatsApp é obrigatório."); return; }
    setSaving(true); setError(null);
    try {
      const updated = await api.saveZapiConfig(store.id, {
        instanceId:    instanceId.trim(),
        clientToken:   clientToken.trim(),
        securityToken: securityToken.trim() || undefined,
        whatsappNumber: whatsappNumber.trim(),
        syncEnabled,
      });
      setConfig(updated);
      setClientToken("");
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  const isConfigured = config !== null;

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={handleOpen}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-secondary/20 transition-colors text-left"
      >
        <div className="h-9 w-9 rounded-lg bg-[#25D366]/10 flex items-center justify-center flex-shrink-0">
          <MessageCircle className="h-4 w-4 text-[#25D366]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground text-sm">{store.name}</p>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            {isConfigured ? config.whatsappNumber : "Não configurado"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isConfigured && <StatusBadge ok={config.syncEnabled} label="Ativo" />}
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-border px-5 py-5 bg-secondary/10 space-y-4">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="flex gap-2.5 p-3 bg-[#25D366]/8 border border-[#25D366]/20 rounded-lg">
                <Info className="h-4 w-4 text-[#25D366] shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Encontre o <span className="font-semibold text-foreground">Instance ID</span> e{" "}
                  <span className="font-semibold text-foreground">Client Token</span> no painel{" "}
                  <a href="https://app.z-api.io" target="_blank" rel="noopener noreferrer"
                    className="text-[#25D366] underline underline-offset-2">
                    app.z-api.io
                  </a>{" "}
                  — o número do WhatsApp deve ser o mesmo conectado via QR Code no Helena CRM.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Instance ID" value={instanceId} onChange={setInstanceId} placeholder="3A4B5C6D7E..." />
                <Field
                  label="Número do WhatsApp"
                  hint="(formato E.164)"
                  value={whatsappNumber}
                  onChange={setWhatsappNumber}
                  placeholder="+5541999998888"
                />
              </div>

              <Field
                label="Client Token"
                hint={config ? "• já configurado — informe novo para atualizar" : undefined}
                value={clientToken}
                onChange={setClientToken}
                placeholder={config ? "••••••••• (manter atual)" : "Token da instância Z-API"}
                type="password"
              />

              <Field
                label="Security Token"
                hint="(opcional — para validar webhook)"
                value={securityToken}
                onChange={setSecurityToken}
                placeholder="Token de segurança do webhook"
                type="password"
              />

              <div className="flex items-center justify-between py-1 px-3 rounded-lg border border-border bg-background">
                <div>
                  <p className="text-sm font-medium text-foreground">Receber leads</p>
                  <p className="text-xs text-muted-foreground">Processa mensagens recebidas via webhook</p>
                </div>
                <Toggle on={syncEnabled} onChange={setSyncEnabled} />
              </div>

              {error && (
                <p className="text-xs text-[hsl(var(--danger))] bg-[hsl(var(--danger)/0.08)] border border-[hsl(var(--danger)/0.2)] px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-1 border-t border-border">
                <button onClick={() => setOpen(false)} className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors border border-border">
                  Cancelar
                </button>
                <button onClick={handleSave} disabled={saving} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-[#25D366] text-white rounded-lg hover:bg-[#25D366]/90 transition-colors disabled:opacity-60">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Aba Webhooks
// ═══════════════════════════════════════════════════════════════════════════════

function CopyableUrl({ label, url, hint }: { label: string; url: string; hint?: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      {hint && <p className="text-xs text-muted-foreground/70">{hint}</p>}
      <div className="flex items-center gap-2">
        <code className="flex-1 px-3 py-2.5 text-xs font-mono bg-secondary/50 border border-border rounded-lg text-foreground break-all min-w-0">
          {url}
        </code>
        <button
          onClick={handleCopy}
          className="h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-lg border border-border hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          title="Copiar"
        >
          {copied ? <Check className="h-4 w-4 text-[hsl(var(--success))]" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function WebhooksTab() {
  const n8nBase = import.meta.env.VITE_N8N_URL ?? "https://seu-n8n.railway.app";
  const backendBase = import.meta.env.VITE_API_URL ?? "https://seu-backend.railway.app";

  const webhookUrl = `${n8nBase}/webhook/zapi-whatsapp-lead`;

  return (
    <div className="space-y-6">
      {/* Z-API → N8N */}
      <div className="card-base p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-[#25D366]/10 flex items-center justify-center">
            <MessageCircle className="h-4 w-4 text-[#25D366]" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">Z-API → N8N</p>
            <p className="text-xs text-muted-foreground">Webhook para captura de leads WhatsApp Ads</p>
          </div>
        </div>

        <CopyableUrl
          label="URL do Webhook (produção)"
          url={webhookUrl}
          hint="Configure este URL no app.z-api.io em On Message Received ou via API da Z-API."
        />

        <div className="space-y-2.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Como configurar</p>
          <ol className="space-y-2 text-xs text-muted-foreground">
            {[
              <>Acesse <a href="https://app.z-api.io" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 inline-flex items-center gap-0.5">app.z-api.io <ExternalLink className="h-2.5 w-2.5" /></a> → sua instância → <strong className="text-foreground">Webhooks</strong></>,
              <><strong className="text-foreground">On Message Received</strong> → cole a URL acima e salve</>,
              <>Ou via API: <code className="bg-secondary px-1 py-0.5 rounded text-[10px]">PUT /instances/ID/token/TOKEN/update-webhook-received</code> com <code className="bg-secondary px-1 py-0.5 rounded text-[10px]">{"{ \"value\": \"<url>\" }"}</code></>,
              <>Ative o workflow <strong className="text-foreground">"Z-API WhatsApp Lead Capture"</strong> no N8N</>,
            ].map((step, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="h-4 w-4 rounded-full bg-secondary flex items-center justify-center text-[9px] font-bold text-muted-foreground flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Helena CRM → Dashboard */}
      <div className="card-base p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Webhook className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">Helena CRM → Dashboard</p>
            <p className="text-xs text-muted-foreground">Ingestão de eventos de funil (já configurado via N8N)</p>
          </div>
        </div>

        <CopyableUrl
          label="Endpoint de ingestão de eventos"
          url={`${backendBase}/api/ingest/event`}
          hint="Chamado pelo N8N com Bearer WEBHOOK_SECRET. Processa transições de etapa do CRM Helena."
        />

        <CopyableUrl
          label="Endpoint de ingestão WhatsApp"
          url={`${backendBase}/api/ingest/whatsapp-lead`}
          hint="Chamado pelo N8N quando Z-API recebe mensagem de lead com ctwa_clid."
        />
      </div>

      {/* Variáveis de ambiente */}
      <div className="card-base p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
          <p className="font-semibold text-foreground text-sm">Variáveis de Ambiente</p>
        </div>
        <div className="space-y-2">
          {[
            { name: "WEBHOOK_SECRET", desc: "Bearer token compartilhado entre N8N e o backend" },
            { name: "CRM_TOKEN_KEY",  desc: "Chave AES-256 (64 chars hex) — encripta tokens do Meta e Z-API" },
            { name: "VITE_N8N_URL",   desc: "URL base do N8N (frontend) — usado para exibir as URLs acima" },
          ].map(({ name, desc }) => (
            <div key={name} className="flex items-start gap-3 p-2.5 rounded-lg bg-secondary/50 border border-border">
              <code className="text-xs font-mono text-foreground font-semibold flex-shrink-0">{name}</code>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Página principal
// ═══════════════════════════════════════════════════════════════════════════════

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "meta",      label: "Meta Ads",         icon: <BarChart2 className="h-4 w-4" /> },
  { id: "whatsapp",  label: "WhatsApp / Z-API",  icon: <MessageCircle className="h-4 w-4" /> },
  { id: "webhooks",  label: "Webhooks & URLs",   icon: <Webhook className="h-4 w-4" /> },
];

export function IntegracoesPage() {
  const [tab, setTab] = useState<Tab>("meta");
  const { stores } = useStores();

  const activeStores = stores.filter((s) => s.active !== false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Integrações</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure Meta Ads, WhatsApp Z-API e webhooks por loja
        </p>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 p-1 rounded-xl bg-secondary/50 border border-border w-fit">
        {TABS.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              tab === id
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* Conteúdo da aba */}
      {tab === "meta" && (
        <div className="space-y-3">
          {activeStores.length === 0 ? (
            <div className="card-base flex flex-col items-center justify-center py-16 text-center">
              <BarChart2 className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma loja ativa</p>
            </div>
          ) : (
            activeStores.map((store) => <MetaStoreRow key={store.id} store={store} />)
          )}
        </div>
      )}

      {tab === "whatsapp" && (
        <div className="space-y-3">
          {activeStores.length === 0 ? (
            <div className="card-base flex flex-col items-center justify-center py-16 text-center">
              <MessageCircle className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma loja ativa</p>
            </div>
          ) : (
            activeStores.map((store) => <ZapiStoreRow key={store.id} store={store} />)
          )}
        </div>
      )}

      {tab === "webhooks" && <WebhooksTab />}
    </div>
  );
}
