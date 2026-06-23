"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export interface TrendPoint {
  week: number;
  /** total score percentage for that week (0-100) */
  percent: number;
}

interface Props {
  data: TrendPoint[];
}

interface TooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string | number;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-surface-elevated p-3 text-xs shadow-xl">
      <p className="mb-1 font-semibold text-text-primary">Week {label}</p>
      <p className="text-text-secondary">
        Score: <span className="font-medium text-primary">{payload[0].value}%</span>
      </p>
    </div>
  );
};

export function ProgressTrendChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-text-muted">
        No published homework scores yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
        <XAxis
          dataKey="week"
          tickFormatter={(v) => `W${v}`}
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
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: "var(--border-color)" }} />
        <Line
          type="monotone"
          dataKey="percent"
          stroke="#047857"
          strokeWidth={2.5}
          dot={{ fill: "#047857", r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
