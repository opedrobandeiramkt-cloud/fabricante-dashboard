import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from "recharts";

interface Props {
  data: Array<{ platform: string; leads: number }>;
}

const PLATFORM_COLORS = ["#1877F2", "#E1306C", "#8B5CF6", "#F97316"];

export function LeadsByMetaPlatform({ data }: Props) {
  return (
    <div>
      <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
        Leads por Plataforma
      </p>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-[120px] text-xs text-muted-foreground border border-dashed border-border rounded-lg">
          Não há dados
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 12, left: 8, bottom: 0 }}
          >
            <XAxis type="number" tick={{ fontSize: 9 }} />
            <YAxis type="category" dataKey="platform" tick={{ fontSize: 9 }} width={90} />
            <Tooltip contentStyle={{ fontSize: 11 }} />
            <Bar dataKey="leads" radius={[0, 4, 4, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={PLATFORM_COLORS[i % PLATFORM_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
