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
    <div className="rounded-lg border border-border bg-surface-elevated p-3 shadow-xl text-xs">
      <p className="mb-2 font-semibold text-text-primary">Week {label}</p>
      {rowData.hasData ? (
        payload.map((p: any) => {
          let max = 0;
          if (p.name === "MCQ") max = rowData.mcqMax;
          else if (p.name === "Short Ans") max = rowData.shortMax;
          else if (p.name === "Long Ans") max = rowData.longMax;
          
          const displayValue = max === 0 ? "Not attempted" : `${p.value}/${max}`;
          
          return (
            <div key={p.name} className="flex items-center gap-2 mb-1">
              <span className="h-2 w-2 rounded-full" style={{ background: p.fill }} />
              <span className="text-text-secondary">{p.name}:</span>
              <span className="font-medium text-text-primary">{displayValue}</span>
            </div>
          );
        })
      ) : (
        <p className="text-text-muted">No homework scores published.</p>
      )}
    </div>
  );
};

export function HomeworkBarChart({ scores }: Props) {
  const scoreMap = Object.fromEntries(scores.map((s) => [s.week, s]));

  const data = ALL_WEEKS.map((w) => {
    const s = scoreMap[w];
    return {
      week: w,
      MCQ: s?.mcq ?? 0,
      mcqMax: s?.mcqMax ?? 0,
      "Short Ans": s?.short ?? 0,
      shortMax: s?.shortMax ?? 0,
      "Long Ans": s?.long ?? 0,
      longMax: s?.longMax ?? 0,
      hasData: !!s,
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
