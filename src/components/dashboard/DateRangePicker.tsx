import { useState, useRef, useEffect } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, ChevronDown, CalendarDays } from "lucide-react";
import type { Period } from "@/lib/types";

interface Props {
  period:    Period;
  dateFrom?: string;
  dateTo?:   string;
  onChange:  (period: Period, from?: string, to?: string) => void;
}

const SHORTCUTS: Array<{ key: Exclude<Period, "custom">; label: string; short: string }> = [
  { key: "7d",  label: "Últimos 7 dias",   short: "7 dias"   },
  { key: "30d", label: "Últimos 30 dias",  short: "30 dias"  },
  { key: "90d", label: "Últimos 90 dias",  short: "90 dias"  },
  { key: "12m", label: "Últimos 12 meses", short: "12 meses" },
];

const MONTHS = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];
const WEEKDAYS = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
function fromYMD(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
function displayLabel(period: Period, from?: string, to?: string): string {
  if (period !== "custom") {
    return { "7d": "7 dias", "30d": "30 dias", "90d": "90 dias", "12m": "12 meses" }[period];
  }
  if (!from || !to) return "Personalizado";
  const fmt  = (s: string) => fromYMD(s).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  const fmtY = (s: string) => fromYMD(s).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  return from === to ? fmtY(from) : `${fmt(from)} — ${fmtY(to)}`;
}

export function DateRangePicker({ period, dateFrom, dateTo, onChange }: Props) {
  const [open,        setOpen]        = useState(false);
  const [isMobile,    setIsMobile]    = useState(false);
  const [viewDate,    setViewDate]    = useState(() => {
    const base = dateFrom ? fromYMD(dateFrom) : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const [pendingFrom, setPendingFrom] = useState<string | null>(dateFrom ?? null);
  const [pendingTo,   setPendingTo]   = useState<string | null>(dateTo   ?? null);
  const [pickingEnd,  setPickingEnd]  = useState(false);
  const [hovered,     setHovered]     = useState<string | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef   = useRef<HTMLDivElement>(null);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});

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

  function openPicker() {
    setPendingFrom(dateFrom ?? null);
    setPendingTo(dateTo ?? null);
    setPickingEnd(false);
    setHovered(null);
    const base = dateFrom ? fromYMD(dateFrom) : new Date();
    setViewDate(new Date(base.getFullYear(), base.getMonth(), 1));

    if (triggerRef.current) {
      const rect  = triggerRef.current.getBoundingClientRect();
      const mobile = window.innerWidth < 520;
      setIsMobile(mobile);

      if (mobile) {
        setPanelStyle({
          position: "fixed",
          top:   rect.bottom + 8,
          left:  8,
          right: 8,
        });
      } else {
        setPanelStyle({
          position: "fixed",
          top:   rect.bottom + 8,
          right: window.innerWidth - rect.right,
        });
      }
    }
    setOpen(true);
  }

  function applyShortcut(key: Exclude<Period, "custom">) {
    onChange(key);
    setOpen(false);
  }

  function handleDayClick(str: string) {
    if (!pickingEnd) {
      setPendingFrom(str);
      setPendingTo(null);
      setPickingEnd(true);
    } else {
      if (pendingFrom && str < pendingFrom) {
        setPendingFrom(str);
        setPendingTo(null);
      } else {
        setPendingTo(str);
        setPickingEnd(false);
      }
    }
  }

  function handleApply() {
    const from = pendingFrom;
    const to   = pendingTo ?? pendingFrom;
    if (from && to) onChange("custom", from, to);
    setOpen(false);
  }

  const effectiveTo = pickingEnd ? (hovered ?? pendingTo) : pendingTo;
  const [rangeStart, rangeEnd] =
    pendingFrom && effectiveTo
      ? pendingFrom <= effectiveTo
        ? [pendingFrom, effectiveTo]
        : [effectiveTo, pendingFrom]
      : [pendingFrom, null];

  function getCellState(str: string) {
    const isStart  = str === rangeStart;
    const isEnd    = str === rangeEnd;
    const inRange  = !!(rangeStart && rangeEnd && str > rangeStart && str < rangeEnd);
    const isSingle = isStart && isEnd;
    return { isStart, isEnd, inRange, isSingle };
  }

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const today = ymd(new Date());

  const startOffset = new Date(year, month, 1).getDay();
  const totalDays   = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ day: number; str: string } | null> = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => {
      const d   = i + 1;
      const str = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      return { day: d, str };
    }),
  ];

  const hint = pickingEnd
    ? "Selecione a data final"
    : pendingFrom
    ? `Início: ${fromYMD(pendingFrom).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}`
    : "Selecione a data inicial";

  // ── Calendário (compartilhado entre mobile e desktop) ──────────────────────
  const calendarGrid = (
    <div className="flex flex-col gap-3">
      {/* Navegação de mês */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setViewDate(addMonths(viewDate, -1))}
          className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-foreground select-none">
          {MONTHS[month]} {year}
        </span>
        <button
          onClick={() => setViewDate(addMonths(viewDate, 1))}
          className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Dias da semana + células */}
      <div className="grid grid-cols-7">
        {WEEKDAYS.map((w) => (
          <div key={w} className="h-7 flex items-center justify-center text-[10px] font-medium text-muted-foreground/50 select-none">
            {w}
          </div>
        ))}
        {cells.map((cell, i) => {
          if (!cell) return <div key={`x${i}`} className="h-8" />;
          const { day, str } = cell;
          const { isStart, isEnd, inRange, isSingle } = getCellState(str);
          const isFuture = str > today;
          const isToday  = str === today;
          const showRangeBg  = inRange || (isStart && rangeEnd && !isSingle) || (isEnd && rangeStart && !isSingle);
          const roundedL = isStart && rangeEnd && !isSingle;
          const roundedR = isEnd   && rangeStart && !isSingle;
          return (
            <div key={str} className="relative h-8 flex items-center justify-center">
              {showRangeBg && (
                <div className={`absolute inset-y-1 bg-primary/15 ${
                  roundedL ? "left-1/2 right-0" :
                  roundedR ? "left-0 right-1/2" :
                  "left-0 right-0"
                }`} />
              )}
              <button
                onClick={() => !isFuture && handleDayClick(str)}
                onMouseEnter={() => pickingEnd && !isFuture && setHovered(str)}
                onMouseLeave={() => setHovered(null)}
                disabled={isFuture}
                className={`relative z-10 w-7 h-7 rounded-full text-xs font-medium transition-all select-none ${
                  isFuture
                    ? "text-muted-foreground/25 cursor-not-allowed"
                    : isStart || isEnd
                    ? "bg-primary text-primary-foreground font-bold shadow-sm"
                    : isToday
                    ? "ring-1 ring-primary/60 text-primary hover:bg-secondary"
                    : "text-foreground hover:bg-secondary cursor-pointer"
                }`}
              >
                {day}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-muted-foreground text-center min-h-[18px] leading-tight">
        {hint}
      </p>

      <div className="flex items-center gap-2 border-t border-border pt-3">
        <button
          onClick={() => setOpen(false)}
          className="flex-1 h-8 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleApply}
          disabled={!pendingFrom}
          className="flex-1 h-8 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Aplicar
        </button>
      </div>
    </div>
  );

  const panel = open && (
    <div
      ref={panelRef}
      style={panelStyle}
      className="z-[9999] bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
    >
      {isMobile ? (
        // ── Layout mobile: coluna ──────────────────────────────────────────
        <div className="flex flex-col">
          {/* Chips de atalho */}
          <div className="flex gap-1.5 px-3 pt-3 pb-2 overflow-x-auto">
            {SHORTCUTS.map((s) => (
              <button
                key={s.key}
                onClick={() => applyShortcut(s.key)}
                className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                  period === s.key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {s.short}
              </button>
            ))}
          </div>
          <div className="px-3 pb-3">
            {calendarGrid}
          </div>
        </div>
      ) : (
        // ── Layout desktop: linha (sidebar + calendário) ───────────────────
        <div className="flex">
          <div className="w-44 border-r border-border p-2 flex flex-col gap-0.5 flex-shrink-0">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/50 px-3 py-2">
              Atalhos
            </p>
            {SHORTCUTS.map((s) => (
              <button
                key={s.key}
                onClick={() => applyShortcut(s.key)}
                className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors relative ${
                  period === s.key
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
                }`}
              >
                {period === s.key && (
                  <span className="absolute left-0 inset-y-2 w-0.5 rounded-r-full bg-primary" />
                )}
                {s.label}
              </button>
            ))}
          </div>
          <div className="w-[272px] p-4">
            {calendarGrid}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        onClick={openPicker}
        className="flex items-center gap-2 h-8 px-3 text-xs font-medium rounded-lg border border-border bg-secondary/50 hover:bg-secondary text-foreground transition-colors whitespace-nowrap"
      >
        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        <span>{displayLabel(period, dateFrom, dateTo)}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>

      {panel && createPortal(panel, document.body)}
    </>
  );
}
