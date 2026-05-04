import type { AdCreativeRow } from "@/lib/types";
import { fmtBRL, fmtNum } from "./fmt";

interface Props {
  ads: AdCreativeRow[];
}

const TYPE_COLORS: Record<string, string> = {
  image:    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  video:    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  carousel: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  facebook:  "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  reels:     "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  google:    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  stories:   "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
};

function Badge({ label, colorClass }: { label: string; colorClass: string }) {
  return (
    <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded ${colorClass}`}>
      {label}
    </span>
  );
}

export function TopAdsTable({ ads }: Props) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Criativos com Melhor Performance
      </p>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              <th className="text-left px-3 py-2 text-muted-foreground font-medium">Anúncio</th>
              <th className="text-left px-3 py-2 text-muted-foreground font-medium">Tipo</th>
              <th className="text-left px-3 py-2 text-muted-foreground font-medium">Plataforma</th>
              <th className="text-right px-3 py-2 text-muted-foreground font-medium">Leads</th>
              <th className="text-right px-3 py-2 text-muted-foreground font-medium">Msgs</th>
              <th className="text-right px-3 py-2 text-muted-foreground font-medium">Gasto</th>
              <th className="text-right px-3 py-2 text-muted-foreground font-medium">C/Lead</th>
            </tr>
          </thead>
          <tbody>
            {ads.map((ad) => (
              <tr
                key={ad.name}
                className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
              >
                <td className="px-3 py-2 text-foreground font-medium max-w-[140px] truncate">{ad.name}</td>
                <td className="px-3 py-2">
                  <Badge
                    label={ad.type}
                    colorClass={TYPE_COLORS[ad.type] ?? "bg-secondary text-foreground"}
                  />
                </td>
                <td className="px-3 py-2">
                  <Badge
                    label={ad.subPlatform}
                    colorClass={PLATFORM_COLORS[ad.subPlatform] ?? "bg-secondary text-foreground"}
                  />
                </td>
                <td className="px-3 py-2 text-right font-semibold text-foreground">{ad.leads}</td>
                <td className="px-3 py-2 text-right text-muted-foreground">{fmtNum(ad.messages)}</td>
                <td className="px-3 py-2 text-right text-muted-foreground">{fmtBRL(ad.spend)}</td>
                <td className="px-3 py-2 text-right text-muted-foreground">{fmtBRL(ad.cpl)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
