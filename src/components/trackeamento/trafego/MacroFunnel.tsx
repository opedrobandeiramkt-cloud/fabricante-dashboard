import { Compass, Lightbulb, DollarSign } from "lucide-react";
import type { TrafegoFunnel } from "@/lib/types";
import { fmtBRL, fmtPct, fmtNum } from "./fmt";

interface Props {
  funnel: TrafegoFunnel;
}

const CLIPS = [
  "polygon(0 0, calc(100% - 28px) 0, 100% 50%, calc(100% - 28px) 100%, 0 100%)",
  "polygon(0 9%, calc(100% - 28px) 9%, 100% 50%, calc(100% - 28px) 91%, 0 91%)",
  "polygon(0 20%, 100% 27%, 100% 73%, 0 80%)",
];

const BG = [
  "hsl(213 75% 68%)",
  "hsl(213 75% 52%)",
  "hsl(213 75% 38%)",
];

const ICON_TOP    = ["0%",   "9%",   "23.5%"];
const CONTENT_TOP = ["11%",  "21%",  "33%"];
const CONTENT_BOT = ["4%",   "13%",  "22%"];

function MetricBlock({ label, value, delta }: { label: string; value: string; delta?: number }) {
  return (
    <div className="text-center">
      <p className="text-[10px] text-white/80 leading-tight">{label}</p>
      <p className="text-sm font-bold text-white leading-snug">{value}</p>
      {delta !== undefined ? (
        <p className={`text-[10px] font-semibold ${delta >= 0 ? "text-emerald-300" : "text-red-300"}`}>
          {delta >= 0 ? "+" : ""}{delta.toFixed(1)}%
        </p>
      ) : (
        <p className="text-[10px] text-white/50">N/A</p>
      )}
    </div>
  );
}

function MiniBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/20 rounded px-2 py-0.5 text-center">
      <p className="text-[9px] text-white/80 leading-tight">{label}</p>
      <p className="text-[10px] font-semibold text-white leading-tight">{value}</p>
    </div>
  );
}

function ConnectorBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-blue-600 text-white rounded-md px-3 py-2 text-center shadow-md">
      <p className="text-[8px] leading-tight whitespace-nowrap">{label}</p>
      <p className="text-xs font-bold leading-tight">{value}</p>
    </div>
  );
}

// ─── Layout mobile: 3 cartões empilhados ──────────────────────────────────────

function MobileStage({
  bg, icon, title, children,
}: {
  bg: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl p-4 overflow-hidden" style={{ background: bg }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="h-7 w-7 rounded-full ring-2 ring-white/40 flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(0,0,0,0.25)" }}>
          {icon}
        </div>
        <p className="text-[10px] font-semibold text-white/70 uppercase tracking-widest">{title}</p>
      </div>
      {children}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function MacroFunnel({ funnel }: Props) {
  const FUNNEL_H = 300;

  return (
    <div className="card-base p-5 flex flex-col h-full">
      <p className="text-sm font-semibold text-foreground mb-4 text-center">
        Jornada de Compra
      </p>

      {/* ── Mobile: cartões empilhados ── */}
      <div className="sm:hidden space-y-3">
        <MobileStage bg={BG[0]} icon={<Compass className="h-3.5 w-3.5 text-white" />} title="Descoberta">
          <div className="grid grid-cols-3 gap-2">
            <MetricBlock label="Impressões" value={fmtNum(funnel.impressions)} delta={funnel.impressionsDelta} />
            <div className="flex items-center justify-center">
              <MiniBadge label="CTR" value={funnel.ctr > 0 ? fmtPct(funnel.ctr) : "—"} />
            </div>
            <MetricBlock label="Cliques" value={fmtNum(funnel.clicks)} delta={funnel.clicksDelta} />
          </div>
        </MobileStage>

        <div className="flex justify-center py-0.5">
          <ConnectorBadge label="Custo por Lead" value={funnel.cpl > 0 ? fmtBRL(funnel.cpl) : "—"} />
        </div>

        <MobileStage bg={BG[1]} icon={<Lightbulb className="h-3.5 w-3.5 text-white" />} title="Consideração">
          <div className="grid grid-cols-2 gap-2">
            <MetricBlock label="Leads" value={fmtNum(funnel.leads)} delta={funnel.leadsDelta} />
            <MetricBlock label="Atendimentos" value={fmtNum(funnel.atendimentos)} />
          </div>
        </MobileStage>

        <div className="flex justify-center py-0.5">
          <ConnectorBadge label="Custo por Venda" value={funnel.cps > 0 ? fmtBRL(funnel.cps) : "—"} />
        </div>

        <MobileStage bg={BG[2]} icon={<DollarSign className="h-3.5 w-3.5 text-white" />} title="Decisão">
          <div className="grid grid-cols-3 gap-2">
            <MetricBlock
              label="Ticket Médio"
              value={funnel.ticketMedio > 0 ? fmtBRL(funnel.ticketMedio) : "—"}
            />
            <MetricBlock
              label="Vendas"
              value={funnel.vendas > 0 ? fmtNum(funnel.vendas) : "—"}
              delta={funnel.vendas > 0 ? funnel.vendasDelta : undefined}
            />
            <MetricBlock
              label="% Vendas"
              value={funnel.percentVendas > 0 ? fmtPct(funnel.percentVendas) : "—"}
            />
          </div>
        </MobileStage>
      </div>

      {/* ── Desktop/tablet: funil trapezoidal horizontal ── */}
      <div className="hidden sm:flex flex-1 relative" style={{ minHeight: FUNNEL_H, overflow: "visible" }}>
        <div className="absolute inset-0 grid gap-0" style={{ gridTemplateColumns: "1fr 100px 1fr 100px 1fr" }}>

          {/* Estágio 1: Descoberta */}
          <div className="relative h-full" style={{ overflow: "visible" }}>
            <div className="absolute inset-0" style={{ clipPath: CLIPS[0] }}>
              <div className="absolute inset-0" style={{ background: BG[0] }} />
              <div
                className="absolute inset-x-0 flex flex-col items-center pl-3 pr-9 gap-2"
                style={{ top: CONTENT_TOP[0], bottom: CONTENT_BOT[0] }}
              >
                <div className="flex-1 w-full flex flex-col justify-around">
                  <MetricBlock label="Impressões" value={fmtNum(funnel.impressions)} delta={funnel.impressionsDelta} />
                  <MiniBadge label="CTR" value={funnel.ctr > 0 ? fmtPct(funnel.ctr) : "—"} />
                  <MetricBlock label="Cliques" value={fmtNum(funnel.clicks)} delta={funnel.clicksDelta} />
                </div>
                <p className="text-[10px] text-white/70 font-medium">Descoberta</p>
              </div>
            </div>
            <div
              className="absolute z-20 w-10 h-10 rounded-full bg-blue-700 ring-2 ring-white/40 shadow-lg flex items-center justify-center"
              style={{ top: ICON_TOP[0], left: "50%", transform: "translateX(-50%) translateY(-50%)" }}
            >
              <Compass className="h-5 w-5 text-white" />
            </div>
          </div>

          {/* Conector: Custo por Lead */}
          <div className="flex items-center justify-center relative z-10">
            <ConnectorBadge label="Custo por Lead" value={funnel.cpl > 0 ? fmtBRL(funnel.cpl) : "—"} />
          </div>

          {/* Estágio 2: Consideração */}
          <div className="relative h-full">
            <div className="absolute inset-0" style={{ clipPath: CLIPS[1] }}>
              <div className="absolute inset-0" style={{ background: BG[1] }} />
              <div
                className="absolute inset-x-0 flex flex-col items-center pl-3 pr-9 gap-2"
                style={{ top: CONTENT_TOP[1], bottom: CONTENT_BOT[1] }}
              >
                <div className="flex-1 w-full flex flex-col justify-around">
                  <MetricBlock label="Leads" value={fmtNum(funnel.leads)} delta={funnel.leadsDelta} />
                  <MetricBlock label="Atendimentos" value={fmtNum(funnel.atendimentos)} />
                </div>
                <p className="text-[10px] text-white/70 font-medium">Consideração</p>
              </div>
            </div>
            <div
              className="absolute z-20 w-10 h-10 rounded-full bg-blue-600 ring-2 ring-white/40 shadow-lg flex items-center justify-center"
              style={{ top: ICON_TOP[1], left: "50%", transform: "translateX(-50%) translateY(-50%)" }}
            >
              <Lightbulb className="h-5 w-5 text-white" />
            </div>
          </div>

          {/* Conector: Custo por Venda */}
          <div className="flex items-center justify-center relative z-10">
            <ConnectorBadge label="Custo por Venda" value={funnel.cps > 0 ? fmtBRL(funnel.cps) : "—"} />
          </div>

          {/* Estágio 3: Decisão */}
          <div className="relative h-full">
            <div className="absolute inset-0" style={{ clipPath: CLIPS[2] }}>
              <div className="absolute inset-0" style={{ background: BG[2] }} />
              <div
                className="absolute inset-x-0 flex flex-col items-center px-3 gap-2"
                style={{ top: CONTENT_TOP[2], bottom: CONTENT_BOT[2] }}
              >
                <div className="flex-1 w-full flex flex-col justify-around">
                  <MetricBlock label="Ticket Médio" value={funnel.ticketMedio > 0 ? fmtBRL(funnel.ticketMedio) : "—"} />
                  <MetricBlock
                    label="Vendas Realizadas"
                    value={funnel.vendas > 0 ? fmtNum(funnel.vendas) : "—"}
                    delta={funnel.vendas > 0 ? funnel.vendasDelta : undefined}
                  />
                  <MetricBlock label="% Vendas" value={funnel.percentVendas > 0 ? fmtPct(funnel.percentVendas) : "—"} />
                </div>
                <p className="text-[10px] text-white/70 font-medium">Decisão</p>
              </div>
            </div>
            <div
              className="absolute z-20 w-10 h-10 rounded-full bg-blue-500 ring-2 ring-white/40 shadow-lg flex items-center justify-center"
              style={{ top: ICON_TOP[2], left: "50%", transform: "translateX(-50%) translateY(-50%)" }}
            >
              <DollarSign className="h-5 w-5 text-white" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
