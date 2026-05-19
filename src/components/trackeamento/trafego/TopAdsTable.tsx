import { Megaphone } from "lucide-react";
import type { AdCreativeRow } from "@/lib/types";
import { fmtBRL, fmtNum } from "./fmt";

interface Props {
  ads: AdCreativeRow[];
}

const RANK_STYLES = [
  "text-[hsl(var(--warning))] font-bold",
  "text-slate-400 font-bold",
  "text-amber-700 font-bold",
];

export function TopAdsTable({ ads }: Props) {
  const sorted = [...ads].sort((a, b) => b.leads - a.leads);
  const maxLeads = Math.max(...sorted.map((a) => a.leads), 1);

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2.5 py-10 text-muted-foreground border border-dashed border-border rounded-xl">
        <Megaphone className="h-6 w-6 opacity-30" />
        <p className="text-xs">Sem dados de anúncios no período</p>
        <p className="text-[10px] text-muted-foreground/60">Os anúncios aparecem após a próxima sincronização do N8N</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-secondary/40">
            <th className="text-center px-3 py-3 text-muted-foreground font-medium w-10">#</th>
            <th className="text-left px-4 py-3 text-muted-foreground font-medium">Anúncio</th>
            <th className="text-right px-4 py-3 text-muted-foreground font-medium">Leads</th>
            <th className="text-right px-4 py-3 text-muted-foreground font-medium hidden sm:table-cell">Mensagens</th>
            <th className="text-right px-4 py-3 text-muted-foreground font-medium hidden md:table-cell">Investido</th>
            <th className="text-right px-4 py-3 text-muted-foreground font-medium">CPL</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((ad, i) => {
            const pct = maxLeads > 0 ? (ad.leads / maxLeads) * 100 : 0;
            return (
              <tr
                key={`${ad.name}-${i}`}
                className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors"
              >
                <td className="px-3 py-3 text-center">
                  <span className={`text-xs font-mono ${RANK_STYLES[i] ?? "text-muted-foreground"}`}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </td>
                <td className="px-4 py-3 max-w-0 w-full">
                  <p className="font-medium text-foreground truncate" title={ad.name}>{ad.name}</p>
                  <div className="mt-1.5 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: "#1877F2" }}
                    />
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-semibold text-foreground">{fmtNum(ad.leads)}</span>
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground hidden sm:table-cell">
                  {fmtNum(ad.messages)}
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground hidden md:table-cell">
                  {fmtBRL(ad.spend)}
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground">
                  {ad.leads > 0 ? fmtBRL(ad.cpl) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
