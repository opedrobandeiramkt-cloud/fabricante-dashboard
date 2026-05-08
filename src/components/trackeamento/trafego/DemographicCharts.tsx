import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";
import type { DemographicSlice } from "@/lib/types";

const AGE_COLORS    = ["#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#ec4899", "#f43f5e"];
const GENDER_COLORS = ["#3b82f6", "#ec4899"];
const DEVICE_COLORS = ["#6366f1", "#06b6d4", "#84cc16"];

const CHART_H = 150;

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[9px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
      {children}
    </p>
  );
}

function NoData() {
  return (
    <div
      className="flex items-center justify-center text-xs text-muted-foreground border border-dashed border-border rounded-lg"
      style={{ height: CHART_H }}
    >
      Não há dados
    </div>
  );
}

function pieLabel({ name, percent }: PieLabelRenderProps) {
  const pct = ((percent ?? 0) * 100).toFixed(0);
  if (Number(pct) < 5) return "";
  return `${String(name)} ${pct}%`;
}

export function AgeChart({ data }: { data: DemographicSlice[] }) {
  return (
    <div>
      <SectionTitle>Leads por Idade</SectionTitle>
      {data.length === 0 ? <NoData /> : (
        <ResponsiveContainer width="100%" height={CHART_H}>
          <PieChart>
            <Pie
              data={data}
              dataKey="leads"
              nameKey="bucket"
              cx="50%"
              cy="50%"
              outerRadius={52}
              label={pieLabel}
              labelLine={false}
              fontSize={9}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={AGE_COLORS[i % AGE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export function GenderChart({ data }: { data: DemographicSlice[] }) {
  return (
    <div>
      <SectionTitle>Leads por Gênero</SectionTitle>
      {data.length === 0 ? <NoData /> : (
        <ResponsiveContainer width="100%" height={CHART_H}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
          >
            <XAxis type="number" tick={{ fontSize: 9 }} />
            <YAxis type="category" dataKey="bucket" tick={{ fontSize: 9 }} width={52} />
            <Tooltip contentStyle={{ fontSize: 11 }} />
            <Bar dataKey="leads" name="Leads" radius={[0, 3, 3, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={GENDER_COLORS[i % GENDER_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export function DeviceChart({ data }: { data: DemographicSlice[] }) {
  return (
    <div>
      <SectionTitle>Leads por Dispositivo</SectionTitle>
      {data.length === 0 ? <NoData /> : (
        <ResponsiveContainer width="100%" height={CHART_H}>
          <PieChart>
            <Pie
              data={data}
              dataKey="leads"
              nameKey="bucket"
              cx="50%"
              cy="50%"
              outerRadius={52}
              label={pieLabel}
              labelLine={false}
              fontSize={9}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={DEVICE_COLORS[i % DEVICE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
