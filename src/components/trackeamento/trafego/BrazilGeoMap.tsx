import type { GeoMetricRow } from "@/lib/types";
import { fmtBRL, fmtNum } from "./fmt";

interface Props {
  data: GeoMetricRow[];
}

// Grid visual aproximado por região — não geograficamente preciso, apenas mapa de calor
const STATE_GRID: Array<{ state: string; col: number; row: number }> = [
  { state: "RR", col: 3, row: 0 },
  { state: "AP", col: 5, row: 0 },
  { state: "AM", col: 2, row: 1 },
  { state: "PA", col: 4, row: 1 },
  { state: "MA", col: 6, row: 1 },
  { state: "AC", col: 1, row: 2 },
  { state: "RO", col: 2, row: 2 },
  { state: "TO", col: 5, row: 2 },
  { state: "PI", col: 6, row: 2 },
  { state: "CE", col: 7, row: 2 },
  { state: "RN", col: 8, row: 2 },
  { state: "PB", col: 8, row: 3 },
  { state: "PE", col: 7, row: 3 },
  { state: "AL", col: 8, row: 4 },
  { state: "SE", col: 7, row: 4 },
  { state: "MT", col: 3, row: 3 },
  { state: "GO", col: 4, row: 3 },
  { state: "DF", col: 5, row: 3 },
  { state: "BA", col: 6, row: 4 },
  { state: "MS", col: 3, row: 4 },
  { state: "MG", col: 5, row: 4 },
  { state: "ES", col: 6, row: 5 },
  { state: "SP", col: 4, row: 5 },
  { state: "RJ", col: 5, row: 5 },
  { state: "PR", col: 3, row: 6 },
  { state: "SC", col: 3, row: 7 },
  { state: "RS", col: 3, row: 8 },
];

const CELL_SIZE = 36;
const COLS = 10;
const ROWS = 9;
const W = COLS * CELL_SIZE;
const H = ROWS * CELL_SIZE;

function hexBlue(intensity: number): string {
  const v = Math.round(30 + intensity * 180);
  const r = Math.round(30 + (1 - intensity) * 100);
  const g = Math.round(60 + (1 - intensity) * 80);
  const b = Math.round(v + (1 - intensity) * 20);
  return `rgb(${r},${g},${Math.min(b, 255)})`;
}

export function BrazilGeoMap({ data }: Props) {
  const maxLeads = Math.max(...data.map((d) => d.leads), 1);
  const byState = new Map(data.map((d) => [d.state, d]));

  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Distribuição Geográfica
      </p>
      <div className="overflow-x-auto">
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="mx-auto">
          {STATE_GRID.map(({ state, col, row }) => {
            const row_ = byState.get(state);
            const intensity = row_ ? row_.leads / maxLeads : 0;
            const x = col * CELL_SIZE;
            const y = row * CELL_SIZE;
            const fill = intensity > 0 ? hexBlue(intensity) : "#334155";
            const textColor = intensity > 0.5 ? "#fff" : "#94a3b8";

            return (
              <g key={state}>
                <rect
                  x={x + 2}
                  y={y + 2}
                  width={CELL_SIZE - 4}
                  height={CELL_SIZE - 4}
                  rx={4}
                  fill={fill}
                  className="transition-colors"
                >
                  {row_ && (
                    <title>
                      {state}: {fmtNum(row_.leads)} leads | {fmtBRL(row_.spend)}
                    </title>
                  )}
                </rect>
                <text
                  x={x + CELL_SIZE / 2}
                  y={y + CELL_SIZE / 2 + 4}
                  textAnchor="middle"
                  fontSize={9}
                  fontWeight="600"
                  fill={textColor}
                  style={{ pointerEvents: "none" }}
                >
                  {state}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      {/* Legenda de intensidade */}
      <div className="flex items-center gap-2 mt-2 justify-center">
        <span className="text-xs text-muted-foreground">Menos leads</span>
        <div
          className="h-3 w-24 rounded"
          style={{ background: "linear-gradient(to right, #334155, #1e3a8a)" }}
        />
        <span className="text-xs text-muted-foreground">Mais leads</span>
      </div>
    </div>
  );
}
