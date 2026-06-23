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
import { OfflineTestChartData } from "@/types";

interface Props {
  scores: OfflineTestChartData[];
}

const TEST_WEEKS = [1, 5, 10] as const;
const EMPTY_COLOR = "var(--border-color)";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-lg border border-border bg-surface-elevated p-3 shadow-xl text-xs">
      <p className="mb-1 font-semibold text-text-primary">Week {label}</p>
      <p className="text-text-secondary">
        Score: <span className="font-medium text-text-primary">{d.value}</span>
        {d.payload.maxScore > 0 && (
          <span className="text-text-muted"> / {d.payload.maxScore}</span>
        )}
      </p>
    </div>
  );
};

export function OfflineTestBarChart({ scores }: Props) {
  const scoreMap = Object.fromEntries(scores.map((s) => [s.week, s]));

  const data = TEST_WEEKS.map((w) => {
    const s = scoreMap[w];
    return {
      week: w,
      Score: s?.score ?? 0,
      maxScore: s?.maxScore ?? 100,
      hasData: !!s,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }} barCategoryGap="50%">
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
        <XAxis
          dataKey="week"
          tickFormatter={(v) => `Week ${v}`}
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
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(245,158,11,0.05)" }} />
        <Bar dataKey="Score" radius={[4, 4, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.hasData ? "#F59E0B" : EMPTY_COLOR} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
