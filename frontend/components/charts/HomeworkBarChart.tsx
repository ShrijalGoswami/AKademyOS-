"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { HomeworkChartData } from "@/types";

interface Props {
  scores: HomeworkChartData[];
}

const ALL_WEEKS = Array.from({ length: 10 }, (_, i) => i + 1);
const EMPTY_COLOR = "var(--border-color)";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const rowData = payload[0].payload;
  
  return (
    <div className="rounded-lg border border-border bg-surface-elevated p-3 shadow-xl text-xs max-w-sm">
      <p className="mb-2 font-semibold text-text-primary text-sm">Week {label}</p>
      {rowData.hasData ? (
        <div className="space-y-3">
          {/* Overall breakdown */}
          <div className="space-y-1">
            <p className="font-medium text-text-secondary text-[11px] mb-1">Overall Weekly Total:</p>
            {payload.map((p: any) => {
              let max = 0;
              if (p.name === "MCQ") max = rowData.mcqMax;
              else if (p.name === "Short Ans") max = rowData.shortMax;
              else if (p.name === "Long Ans") max = rowData.longMax;
              
              const displayValue = max === 0 ? "Not attempted" : `${p.value}/${max}`;
              
              return (
                <div key={p.name} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: p.fill }} />
                  <span className="text-text-secondary">{p.name}:</span>
                  <span className="font-medium text-text-primary">{displayValue}</span>
                </div>
              );
            })}
          </div>

          {/* Subject-wise breakdown */}
          {rowData.subjects && rowData.subjects.length > 0 && (
            <div className="pt-2 border-t border-border space-y-1.5">
              <p className="font-medium text-text-secondary text-[11px] mb-1">Subject Breakdown:</p>
              {rowData.subjects.map((s: any, idx: number) => (
                <div key={idx} className="space-y-0.5 pl-1.5 border-l-2 border-primary/20">
                  <p className="font-semibold text-text-primary uppercase text-[10px] tracking-wider">{s.subject}</p>
                  <p className="text-[10px] text-text-muted">
                    MCQ: <span className="text-text-secondary font-medium">{s.mcq}/{s.mcqMax}</span> |{" "}
                    Short: <span className="text-text-secondary font-medium">{s.short}/{s.shortMax}</span> |{" "}
                    Long: <span className="text-text-secondary font-medium">{s.long}/{s.longMax}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="text-text-muted">No homework scores published.</p>
      )}
    </div>
  );
};

export function HomeworkBarChart({ scores }: Props) {
  // Aggregate scores by week (summing up MCQ, Short, and Long scores/max scores)
  const weeklyAggregates: Record<number, {
    mcq: number;
    mcqMax: number;
    short: number;
    shortMax: number;
    long: number;
    longMax: number;
    subjects: { subject: string; mcq: number; mcqMax: number; short: number; shortMax: number; long: number; longMax: number }[];
  }> = {};

  for (const s of scores) {
    if (!weeklyAggregates[s.week]) {
      weeklyAggregates[s.week] = { mcq: 0, mcqMax: 0, short: 0, shortMax: 0, long: 0, longMax: 0, subjects: [] };
    }
    weeklyAggregates[s.week].mcq += s.mcq;
    weeklyAggregates[s.week].mcqMax += s.mcqMax;
    weeklyAggregates[s.week].short += s.short;
    weeklyAggregates[s.week].shortMax += s.shortMax;
    weeklyAggregates[s.week].long += s.long;
    weeklyAggregates[s.week].longMax += s.longMax;
    weeklyAggregates[s.week].subjects.push({
      subject: s.subject ?? "General",
      mcq: s.mcq,
      mcqMax: s.mcqMax,
      short: s.short,
      shortMax: s.shortMax,
      long: s.long,
      longMax: s.longMax,
    });
  }

  const data = ALL_WEEKS.map((w) => {
    const agg = weeklyAggregates[w];
    const hasData = !!agg;
    return {
      week: w,
      MCQ: agg?.mcq ?? 0,
      mcqMax: agg?.mcqMax ?? 0,
      "Short Ans": agg?.short ?? 0,
      shortMax: agg?.shortMax ?? 0,
      "Long Ans": agg?.long ?? 0,
      longMax: agg?.longMax ?? 0,
      hasData,
      subjects: agg?.subjects ?? [],
    };
  });

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
        <XAxis
          dataKey="week"
          tickFormatter={(v) => `W${v}`}
          tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
          axisLine={{ stroke: "var(--border-color)" }}
          tickLine={false}
        />
        <YAxis
          domain={[0, (dataMax: number) => Math.max(30, Math.ceil((dataMax || 0) / 10) * 10)]}
          tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(4,120,87,0.05)" }} />
        <Legend
          wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)", paddingTop: 8 }}
        />
        <Bar dataKey="MCQ" fill="#047857" radius={[3, 3, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.hasData ? "#047857" : EMPTY_COLOR} />
          ))}
        </Bar>
        <Bar dataKey="Short Ans" fill="#10B981" radius={[3, 3, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.hasData ? "#10B981" : EMPTY_COLOR} />
          ))}
        </Bar>
        <Bar dataKey="Long Ans" fill="#D97706" radius={[3, 3, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.hasData ? "#D97706" : EMPTY_COLOR} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
