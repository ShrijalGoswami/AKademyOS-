"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { QuizChartData } from "@/types";

interface Props {
  scores: QuizChartData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-lg border border-border bg-surface-elevated p-3 shadow-xl text-xs">
      <p className="mb-1 font-semibold text-text-primary">Week {label}</p>
      {d.payload.quizTitle && (
        <p className="text-text-muted mb-1">{d.payload.quizTitle}</p>
      )}
      <p className="text-text-secondary">
        Score: <span className="font-medium text-text-primary">{d.value}</span>
        <span className="text-text-muted"> / {d.payload.maxScore}</span>
      </p>
    </div>
  );
};

export function QuizBarChart({ scores }: Props) {
  const data = scores.map((s) => ({
    week: s.week,
    Score: s.score,
    quizTitle: s.quizTitle,
    maxScore: s.maxScore,
  }));

  if (data.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center text-text-muted text-sm">
        No quiz scores published yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }} barCategoryGap="40%">
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
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(16,185,129,0.05)" }} />
        <Bar dataKey="Score" fill="#10B981" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
