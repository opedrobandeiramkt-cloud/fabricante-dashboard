import { useState, useRef, useEffect } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Store, Check, X, Lock } from "lucide-react";
import { useStores } from "@/contexts/StoresContext";

interface StoreFilterProps {
  selected:       string[];
  onChange:       (ids: string[]) => void;
  restrictToIds?: string[];
}

export function StoreFilter({ selected, onChange, restrictToIds }: StoreFilterProps) {
  const [open, setOpen]       = useState(false);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef   = useRef<HTMLDivElement>(null);
  const { stores } = useStores();

  const activeStores  = stores.filter((s) => s.active !== false);
  const visibleStores = restrictToIds
    ? activeStores.filter((s) => restrictToIds.includes(s.id))
    : activeStores;
  const isRestricted = !!restrictToIds;

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      const inTrigger = triggerRef.current?.contains(e.target as Node);
      const inPanel   = panelRef.current?.contains(e.target as Node);
      if (!inTrigger && !inPanel) setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  function openFilter() {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const panelW = Math.min(256, window.innerWidth - 16);
    const idealLeft = rect.right - panelW;
    const left = Math.max(8, idealLeft);
    setPanelStyle({
      position: "fixed",
      top:   rect.bottom + 4,
      left,
      width: panelW,
      maxWidth: "calc(100vw - 16px)",
    });
    setOpen((v) => !v);
  }

  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  }

  function selectAll() { onChange([]); }

  const label =
    selected.length === 0
      ? isRestricted
        ? `${visibleStores.length} loja${visibleStores.length !== 1 ? "s" : ""}`
        : "Todas as lojas"
      : selected.length === 1
      ? stores.find((s) => s.id === selected[0])?.name ?? "1 loja"
      : `${selected.length} lojas`;

  if (isRestricted && visibleStores.length === 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border text-sm text-muted-foreground">
        <Store className="h-4 w-4" />
        <span className="max-w-[160px] truncate text-foreground">{visibleStores[0].name}</span>
        <Lock className="h-3 w-3 text-muted-foreground/60" />
      </div>
    );
  }

  const dropdown = open && (
    <div
      ref={panelRef}
      style={panelStyle}
      className="z-[9999] bg-card border border-border rounded-lg shadow-xl overflow-hidden"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-medium text-muted-foreground">
          {isRestricted ? "Suas lojas" : "Filtrar por loja"}
        </span>
        {selected.length > 0 && !isRestricted && (
          <button
            onClick={selectAll}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            <X className="h-3 w-3" /> Limpar
          </button>
        )}
      </div>

      {!isRestricted && (
        <button
          onClick={selectAll}
          className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-secondary/50 transition-colors ${
            selected.length === 0 ? "text-primary" : "text-foreground"
          }`}
        >
          <div className={`h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 ${
            selected.length === 0 ? "bg-primary border-primary" : "border-border"
          }`}>
            {selected.length === 0 && <Check className="h-2.5 w-2.5 text-white" />}
          </div>
          Todas as lojas
        </button>
      )}

      <div className="max-h-56 overflow-y-auto">
        {visibleStores.map((store) => {
          const checked = selected.includes(store.id);
          return (
            <button
              key={store.id}
              onClick={() => toggle(store.id)}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-secondary/50 transition-colors text-left"
            >
              <div className={`h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 ${
                checked ? "bg-primary border-primary" : "border-border"
              }`}>
                {checked && <Check className="h-2.5 w-2.5 text-white" />}
              </div>
              <div>
                <p className={`leading-tight ${checked ? "text-foreground font-medium" : "text-foreground"}`}>
                  {store.name}
                </p>
                <p className="text-xs text-muted-foreground">{store.city} — {store.state}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        onClick={openFilter}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border text-sm text-foreground hover:bg-secondary transition-colors whitespace-nowrap"
      >
        <Store className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="max-w-[140px] truncate">{label}</span>
        {selected.length > 0 && !isRestricted && (
          <span className="h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center flex-shrink-0">
            {selected.length}
          </span>
        )}
        {isRestricted && <Lock className="h-3 w-3 text-muted-foreground/60 flex-shrink-0" />}
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>

      {dropdown && createPortal(dropdown, document.body)}
    </>
  );
}
