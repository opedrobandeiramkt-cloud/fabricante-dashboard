import { Megaphone, ExternalLink } from "lucide-react";
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

function AdThumbnail({ url, name }: { url?: string; name: string }) {
  if (!url) {
    return (
      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
        <Megaphone className="h-4 w-4 text-muted-foreground opacity-40" />
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={name}
      className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-border"
      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
    />
  );
}

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
            const adLibraryUrl = ad.externalId
              ? `https://www.facebook.com/ads/library/?id=${ad.externalId}`
              : null;

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
                  <div className="flex items-center gap-3">
                    <AdThumbnail url={ad.thumbnailUrl} name={ad.name} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium text-foreground truncate" title={ad.name}>{ad.name}</p>
                        {adLibraryUrl && (
                          <a
                            href={adLibraryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                            title="Ver anúncio na biblioteca do Meta"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, background: "#1877F2" }}
                        />
                      </div>
                    </div>
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
