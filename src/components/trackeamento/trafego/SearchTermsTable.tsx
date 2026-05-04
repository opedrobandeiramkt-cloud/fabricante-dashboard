import type { SearchTermRow } from "@/lib/types";
import { fmtBRL, fmtNum } from "./fmt";

interface Props {
  rows: SearchTermRow[];
}

export function SearchTermsTable({ rows }: Props) {
  const sorted = [...rows].sort((a, b) => b.conversions - a.conversions).slice(0, 20);

  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Termos de Busca
      </p>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              <th className="text-left px-3 py-2 text-muted-foreground font-medium">Termo</th>
              <th className="text-right px-3 py-2 text-muted-foreground font-medium">Impressões</th>
              <th className="text-right px-3 py-2 text-muted-foreground font-medium">Cliques</th>
              <th className="text-right px-3 py-2 text-muted-foreground font-medium">Conversões</th>
              <th className="text-right px-3 py-2 text-muted-foreground font-medium">C/Lead</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr
                key={row.term}
                className={`border-b border-border last:border-0 hover:bg-secondary/30 transition-colors ${
                  i === 0 ? "bg-primary/5" : ""
                }`}
              >
                <td className="px-3 py-2 text-foreground font-medium">{row.term}</td>
                <td className="px-3 py-2 text-right text-muted-foreground">{fmtNum(row.impressions)}</td>
                <td className="px-3 py-2 text-right text-muted-foreground">{fmtNum(row.clicks)}</td>
                <td className="px-3 py-2 text-right font-semibold text-foreground">{row.conversions}</td>
                <td className="px-3 py-2 text-right text-muted-foreground">{fmtBRL(row.cpl)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
