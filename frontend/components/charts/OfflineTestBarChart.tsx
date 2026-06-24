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
    <div className="rounded-lg border border-border bg-surface-elevated p-3 shadow-xl text-xs max-w-sm">
      <p className="mb-1 font-semibold text-text-primary text-sm">Week {label}</p>
      {d.payload.hasData ? (
        <div className="space-y-2">
          <div>
            <p className="text-text-secondary">
              Overall Percentage: <span className="font-semibold text-text-primary">{d.value}%</span>
            </p>
            <p className="text-text-muted">
              Total Score: <span className="font-medium text-text-secondary">{d.payload.rawScore}</span>
              <span> / {d.payload.maxScore}</span>
            </p>
          </div>
          {d.payload.tests && d.payload.tests.length > 0 && (
            <div className="mt-2 pt-2 border-t border-border space-y-1.5">
              <p className="font-medium text-text-secondary text-[11px] mb-1">Details:</p>
              {d.payload.tests.map((t: any, idx: number) => {
                const displayName = t.subject && t.topic && t.subject !== t.topic
                  ? `${t.subject} - ${t.topic}`
                  : t.subject || t.topic || "Test";
                return (
                  <div key={idx} className="flex items-center justify-between gap-4 text-[10px] text-text-muted">
                    <span className="truncate max-w-[220px]">• {displayName}</span>
                    <span className="font-semibold text-text-secondary whitespace-nowrap">{t.score} / {t.maxScore}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <p className="text-text-muted">No test scores published.</p>
      )}
    </div>
  );
};

export function OfflineTestBarChart({ scores }: Props) {
  // Aggregate scores by week (summing up scores and max scores, and collecting details)
  const weeklyAggregates: Record<number, { 
    score: number; 
    maxScore: number; 
    tests: { subject: string; topic: string; score: number; maxScore: number }[] 
  }> = {};
  
  for (const s of scores) {
    if (!weeklyAggregates[s.week]) {
      weeklyAggregates[s.week] = { score: 0, maxScore: 0, tests: [] };
    }
    weeklyAggregates[s.week].score += s.score;
    weeklyAggregates[s.week].maxScore += s.maxScore;
    weeklyAggregates[s.week].tests.push({
      subject: s.subject ?? "",
      topic: s.topic ?? "",
      score: s.score,
      maxScore: s.maxScore,
    });
  }

  const data = TEST_WEEKS.map((w) => {
    const agg = weeklyAggregates[w];
    const hasData = !!agg;
    const percentage = hasData && agg.maxScore > 0 
      ? Math.round((agg.score / agg.maxScore) * 100) 
      : 0;

    return {
      week: w,
      Score: percentage, // Plot percentage out of 100
      rawScore: agg?.score ?? 0,
      maxScore: agg?.maxScore ?? 0,
      tests: agg?.tests ?? [],
      hasData,
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
          tickFormatter={(v) => `${v}%`}
          tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(20, 103, 5, 0.05)" }} />
        <Bar dataKey="Score" fill="#0ec21aff" radius={[4, 4, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.hasData ? "#0ec21aff" : EMPTY_COLOR} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
