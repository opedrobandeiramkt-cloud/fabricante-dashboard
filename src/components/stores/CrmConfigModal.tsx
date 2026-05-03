import { useState, useEffect } from "react";
import { X, Plus, Trash2, Loader2, CheckCircle2, XCircle, ChevronUp, ChevronDown, Wifi } from "lucide-react";
import { api } from "@/lib/api";
import type { StageMapEntry, StoreCrmConfig } from "@/lib/types";
import { FUNNEL_STAGES } from "@/lib/constants";

const DASH_KEY_OPTIONS = [
  { value: "",                    label: "— não registrar —" },
  ...FUNNEL_STAGES.map((s) => ({ value: s.key, label: s.label })),
];

interface Props {
  storeId:   string;
  storeName: string;
  onClose:   () => void;
}

export function CrmConfigModal({ storeId, storeName, onClose }: Props) {
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [testing,  setTesting]  = useState(false);
  const [existing, setExisting] = useState<StoreCrmConfig | null>(null);
  const [error,    setError]    = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const [panelId,   setPanelId]   = useState("");
  const [token,     setToken]     = useState("");
  const [stageMap,  setStageMap]  = useState<StageMapEntry[]>([]);
  const [priority,  setPriority]  = useState<string[]>([]);

  useEffect(() => {
    api.getCrmConfig(storeId)
      .then((cfg) => {
        setExisting(cfg);
        setPanelId(cfg.panelId);
        setStageMap(cfg.stageMap ?? []);
        setPriority(cfg.stagePriority ?? []);
      })
      .catch(() => {
        // config ainda não existe — começa em branco
      })
      .finally(() => setLoading(false));
  }, [storeId]);

  function addRow() {
    const newEntry: StageMapEntry = { tagId: "", stepId: "", dashKey: null };
    setStageMap((prev) => [...prev, newEntry]);
  }

  function updateRow(index: number, field: keyof StageMapEntry, value: string | null) {
    setStageMap((prev) => prev.map((row, i) =>
      i === index ? { ...row, [field]: value === "" ? null : value } : row
    ));
  }

  function removeRow(index: number) {
    const removed = stageMap[index];
    setStageMap((prev) => prev.filter((_, i) => i !== index));
    setPriority((prev) => prev.filter((id) => id !== removed.tagId));
  }

  function syncPriority(newMap: StageMapEntry[]) {
    const validTagIds = new Set(newMap.map((r) => r.tagId).filter(Boolean));
    setPriority((prev) => {
      const filtered = prev.filter((id) => validTagIds.has(id));
      const missing  = [...validTagIds].filter((id) => !filtered.includes(id));
      return [...filtered, ...missing];
    });
  }

  function handleTagIdChange(index: number, value: string) {
    const updated = stageMap.map((row, i) => i === index ? { ...row, tagId: value } : row);
    setStageMap(updated);
    syncPriority(updated);
  }

  function movePriority(index: number, dir: -1 | 1) {
    setPriority((prev) => {
      const next = [...prev];
      const swap = index + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[index], next[swap]] = [next[swap], next[index]];
      return next;
    });
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.testCrmConfig(storeId);
      setTestResult(res.ok
        ? { ok: true,  msg: `Conectado — ${res.agentCount} agente(s) encontrado(s) em ${res.latencyMs}ms` }
        : { ok: false, msg: res.error ?? "Falha na conexão" }
      );
    } catch {
      setTestResult({ ok: false, msg: "Erro ao testar" });
    } finally {
      setTesting(false);
    }
  }

  async function handleSave() {
    if (!panelId.trim()) { setError("Panel ID é obrigatório."); return; }
    if (!existing && !token.trim()) { setError("Token Helena é obrigatório na criação."); return; }
    const invalidRows = stageMap.filter((r) => !r.tagId.trim() || !r.stepId.trim());
    if (invalidRows.length > 0) { setError("Preencha Tag ID e Step ID em todas as linhas."); return; }

    setSaving(true);
    setError(null);
    try {
      await api.saveCrmConfig(storeId, {
        panelId: panelId.trim(),
        ...(token.trim() ? { helenaToken: token.trim() } : {}),
        stageMap,
        stagePriority: priority,
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
      <div className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-semibold text-foreground">Configurar CRM Helena</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{storeName}</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="p-6 space-y-6">

            {/* Panel ID + Token */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Panel ID</label>
                <input
                  value={panelId}
                  onChange={(e) => setPanelId(e.target.value)}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className="w-full px-3 py-2 text-sm font-mono bg-secondary/50 border border-border rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Token Helena
                  {existing?.hasToken && <span className="ml-2 text-[10px] text-[hsl(var(--success))] normal-case font-normal">já configurado</span>}
                </label>
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder={existing?.hasToken ? "••••••••• (manter atual)" : "pn_xxxxxxxx..."}
                  className="w-full px-3 py-2 text-sm font-mono bg-secondary/50 border border-border rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
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
                  <span className={`flex items-center gap-1.5 text-xs font-medium ${testResult.ok ? "text-[hsl(var(--success))]" : "text-[hsl(var(--danger))]"}`}>
                    {testResult.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                    {testResult.msg}
                  </span>
                )}
              </div>
            )}

            {/* Stage Map */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Mapeamento de Etapas</label>
                <button
                  onClick={addRow}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> Adicionar linha
                </button>
              </div>

              {stageMap.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center border border-dashed border-border rounded-lg">
                  Nenhuma etapa configurada. Clique em "Adicionar linha".
                </p>
              ) : (
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-px bg-border text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                    <div className="bg-secondary/50 px-3 py-2">Tag ID (Helena)</div>
                    <div className="bg-secondary/50 px-3 py-2">Step ID (Helena)</div>
                    <div className="bg-secondary/50 px-3 py-2">Etapa do Funil</div>
                    <div className="bg-secondary/50 px-3 py-2" />
                  </div>
                  <div className="divide-y divide-border bg-card">
                    {stageMap.map((row, i) => (
                      <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-px bg-border">
                        <input
                          value={row.tagId}
                          onChange={(e) => handleTagIdChange(i, e.target.value)}
                          placeholder="uuid-da-tag"
                          className="bg-card px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:bg-primary/5"
                        />
                        <input
                          value={row.stepId}
                          onChange={(e) => updateRow(i, "stepId", e.target.value)}
                          placeholder="uuid-do-step"
                          className="bg-card px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:bg-primary/5"
                        />
                        <select
                          value={row.dashKey ?? ""}
                          onChange={(e) => updateRow(i, "dashKey", e.target.value)}
                          className="bg-card px-3 py-2 text-xs text-foreground focus:outline-none focus:bg-primary/5"
                        >
                          {DASH_KEY_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                        <div className="bg-card flex items-center justify-center px-2">
                          <button onClick={() => removeRow(i)} className="text-muted-foreground hover:text-[hsl(var(--danger))] transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Prioridade */}
            {priority.length > 1 && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Prioridade (quando múltiplas tags chegam juntas)
                </label>
                <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
                  {priority.map((tagId, i) => {
                    const entry = stageMap.find((r) => r.tagId === tagId);
                    const label = entry?.dashKey
                      ? FUNNEL_STAGES.find((s) => s.key === entry.dashKey)?.label ?? entry.dashKey
                      : "— não registrar —";
                    return (
                      <div key={tagId} className="flex items-center gap-3 px-3 py-2 bg-card hover:bg-secondary/20">
                        <span className="text-xs font-mono text-muted-foreground w-5 text-center">{i + 1}</span>
                        <span className="flex-1 text-xs font-mono text-foreground truncate">{tagId || <span className="text-muted-foreground/50">tag vazia</span>}</span>
                        <span className="text-xs text-muted-foreground hidden sm:block">{label}</span>
                        <div className="flex items-center gap-0.5">
                          <button onClick={() => movePriority(i, -1)} disabled={i === 0} className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-30">
                            <ChevronUp className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => movePriority(i, 1)} disabled={i === priority.length - 1} className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-30">
                            <ChevronDown className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
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
