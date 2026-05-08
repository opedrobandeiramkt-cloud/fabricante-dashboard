import type { AdCreativeRow } from "@/lib/types";
import { fmtBRL, fmtNum } from "./fmt";

interface Props {
  ads: AdCreativeRow[];
}

export function TopAdsTable({ ads }: Props) {
  const sorted = [...ads].sort((a, b) => b.messages - a.messages);

  return (
    <div>
      <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
        Melhores Anúncios
      </p>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              <th className="text-left px-3 py-2 text-muted-foreground font-medium">Anúncio</th>
              <th className="text-right px-3 py-2 text-muted-foreground font-medium">Leads</th>
              <th className="text-right px-3 py-2 text-muted-foreground font-medium">Mensagens</th>
              <th className="text-right px-3 py-2 text-muted-foreground font-medium">C/Leads</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-center text-muted-foreground text-xs">
                  Não há dados
                </td>
              </tr>
            ) : sorted.map((ad) => (
              <tr
                key={ad.name}
                className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
              >
                <td className="px-3 py-2 text-foreground font-medium max-w-[140px] truncate">{ad.name}</td>
                <td className="px-3 py-2 text-right font-semibold text-foreground">{ad.leads}</td>
                <td className="px-3 py-2 text-right text-muted-foreground">{fmtNum(ad.messages)}</td>
                <td className="px-3 py-2 text-right text-muted-foreground">{fmtBRL(ad.cpl)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
