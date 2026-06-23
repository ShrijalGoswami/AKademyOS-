"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export interface ClassProgressDatum {
  name: string;
  percent: number;
}

interface Props {
  data: ClassProgressDatum[];
}

const COLORS = ["#6366F1", "#8B5CF6", "#10B981", "#3B82F6", "#EF4444", "#F59E0B", "#047857"];

interface TooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string | number;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-surface-elevated p-3 text-xs shadow-xl">
      <p className="mb-1 font-semibold text-text-primary">{label}</p>
      <p className="text-text-secondary">
        Avg: <span className="font-medium text-primary">{payload[0].value}%</span>
      </p>
    </div>
  );
};

export function ClassProgressChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-text-muted">
        No homework scores to chart yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }} barCategoryGap="25%">
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
          axisLine={{ stroke: "var(--border-color)" }}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(4,120,87,0.05)" }} />
        <Bar dataKey="percent" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
