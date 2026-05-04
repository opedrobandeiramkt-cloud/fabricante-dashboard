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

interface Props {
  age: DemographicSlice[];
  gender: DemographicSlice[];
  device: DemographicSlice[];
}

const GENDER_COLORS = ["#3b82f6", "#ec4899"];
const DEVICE_COLORS = ["#6366f1", "#06b6d4", "#84cc16"];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">{children}</p>;
}

function pieLabel({ name, percent }: PieLabelRenderProps) {
  const pct = ((percent ?? 0) * 100).toFixed(0);
  return `${String(name)} ${pct}%`;
}

export function DemographicCharts({ age, gender, device }: Props) {
  return (
    <div className="space-y-5">
      {/* Faixa etária */}
      <div>
        <SectionTitle>Faixa Etária</SectionTitle>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart
            data={age}
            layout="vertical"
            margin={{ top: 0, right: 12, left: 4, bottom: 0 }}
          >
            <XAxis type="number" tick={{ fontSize: 10 }} />
            <YAxis type="category" dataKey="bucket" tick={{ fontSize: 10 }} width={38} />
            <Tooltip contentStyle={{ fontSize: 11 }} />
            <Bar dataKey="leads" name="Leads" fill="#3b82f6" radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gênero + Dispositivo */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <SectionTitle>Gênero</SectionTitle>
          <ResponsiveContainer width="100%" height={110}>
            <PieChart>
              <Pie
                data={gender}
                dataKey="leads"
                nameKey="bucket"
                cx="50%"
                cy="50%"
                outerRadius={42}
                label={pieLabel}
                labelLine={false}
                fontSize={10}
              >
                {gender.map((_, i) => (
                  <Cell key={i} fill={GENDER_COLORS[i % GENDER_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div>
          <SectionTitle>Dispositivo</SectionTitle>
          <ResponsiveContainer width="100%" height={110}>
            <PieChart>
              <Pie
                data={device}
                dataKey="leads"
                nameKey="bucket"
                cx="50%"
                cy="50%"
                outerRadius={42}
                label={pieLabel}
                labelLine={false}
                fontSize={10}
              >
                {device.map((_, i) => (
                  <Cell key={i} fill={DEVICE_COLORS[i % DEVICE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
