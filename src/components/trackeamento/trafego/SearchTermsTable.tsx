import type { SearchTermRow } from "@/lib/types";
import { fmtBRL, fmtNum } from "./fmt";

interface Props {
  rows: SearchTermRow[];
}

export function SearchTermsTable({ rows }: Props) {
  const sorted = [...rows].sort((a, b) => b.conversions - a.conversions).slice(0, 20);

  return (
    <div>
      <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
        Termos de Pesquisa
      </p>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              <th className="text-left px-3 py-2 text-muted-foreground font-medium">Termo</th>
              <th className="text-right px-3 py-2 text-muted-foreground font-medium">Conversões</th>
              <th className="text-right px-3 py-2 text-muted-foreground font-medium">C/Lead</th>
              <th className="text-right px-3 py-2 text-muted-foreground font-medium">Cliques</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-center text-muted-foreground text-xs">
                  Não há dados
                </td>
              </tr>
            ) : sorted.map((row, i) => (
              <tr
                key={row.term}
                className={`border-b border-border last:border-0 hover:bg-secondary/30 transition-colors ${
                  i === 0 ? "bg-primary/5" : ""
                }`}
              >
                <td className="px-3 py-2 text-foreground font-medium">{row.term}</td>
                <td className="px-3 py-2 text-right font-semibold text-foreground">{row.conversions}</td>
                <td className="px-3 py-2 text-right text-muted-foreground">{fmtBRL(row.cpl)}</td>
                <td className="px-3 py-2 text-right text-muted-foreground">{fmtNum(row.clicks)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
