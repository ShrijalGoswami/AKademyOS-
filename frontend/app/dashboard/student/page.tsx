export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { Topbar } from "@/components/layout/Topbar";
import { StatCard } from "@/components/layout/StatCard";
import { ScoreGraphTabs } from "@/components/dashboard/ScoreGraphTabs";
import { ScoreSummaryTable } from "@/components/dashboard/ScoreSummaryTable";
import { ProgressTrendChart, TrendPoint } from "@/components/dashboard/ProgressTrendChart";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { TrendingUp, BookOpen, Zap, ClipboardList } from "lucide-react";
import {
  HomeworkScore,
  OfflineTestScore,
  QuizScore,
  HomeworkChartData,
  OfflineTestChartData,
  QuizChartData,
} from "@/types";

export default async function StudentDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  const email = session.user.email!;
  const supabase = createSupabaseAdminClient();

  const [hwRes, otRes, qzRes] = await Promise.all([
    supabase.from("homework_scores").select("*").eq("user_email", email).eq("published", true).order("week_number"),
    supabase.from("offline_test_scores").select("*").eq("user_email", email).eq("published", true).order("week_number"),
    supabase.from("quiz_scores").select("*").eq("user_email", email).eq("published", true).order("week_number"),
  ]);

  const homework = (hwRes.data ?? []) as HomeworkScore[];
  const offlineTests = (otRes.data ?? []) as OfflineTestScore[];
  const quizzes = (qzRes.data ?? []) as QuizScore[];

  const homeworkChartData: HomeworkChartData[] = homework.map((s) => ({
    week: s.week_number,
    mcq: s.mcq_score,
    short: s.short_answer_score,
    long: s.long_answer_score,
    mcqMax: s.mcq_max,
    shortMax: s.short_answer_max,
    longMax: s.long_answer_max,
  }));

  const offlineTestChartData: OfflineTestChartData[] = offlineTests.map((s) => ({
    week: s.week_number as 1 | 5 | 10,
    score: s.score,
    maxScore: s.max_score,
    subject: s.subject,
    topic: s.topic,
  }));

  const quizChartData: QuizChartData[] = quizzes.map((s) => ({
    week: s.week_number,
    quizTitle: s.quiz_title ?? "",
    score: s.score,
    maxScore: s.max_score,
  }));

  // Weekly homework total % → progress trend + average
  const trend: TrendPoint[] = homework.map((s) => {
    const total = s.mcq_score + s.short_answer_score + s.long_answer_score;
    const max = s.mcq_max + s.short_answer_max + s.long_answer_max;
    return { week: s.week_number, percent: max > 0 ? Math.round((total / max) * 100) : 0 };
  });
  const avgScore = trend.length
    ? Math.round(trend.reduce((a, t) => a + t.percent, 0) / trend.length)
    : 0;

  const firstName = session.user.name?.split(" ")[0] ?? "there";

  return (
    <>
      <Topbar title="Student Dashboard" subtitle={`Good to see you, ${firstName} 👋`} />

      <div className="space-y-8 p-6">
        {/* Stat cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={TrendingUp} value={`${avgScore}%`} label="Average Homework Score" sublabel={`across ${trend.length} week${trend.length === 1 ? "" : "s"}`} />
          <StatCard icon={BookOpen} value={homework.length} label="Homework Weeks" iconColor="text-accent" iconBg="bg-accent/10" />
          <StatCard icon={Zap} value={quizzes.length} label="Quizzes Completed" iconColor="text-warning" iconBg="bg-warning/10" />
          <StatCard icon={ClipboardList} value={new Set(offlineTests.map((t) => t.week_number)).size} label="Offline Tests Taken" iconColor="text-primary" iconBg="bg-primary/10" />
        </section>

        {/* Score overview charts */}
        <section id="scores" className="scroll-mt-6">
          <h2 className="mb-4 font-heading text-lg font-semibold text-text-primary">Score Overview</h2>
          <ScoreGraphTabs
            homework={homeworkChartData}
            offlineTests={offlineTestChartData}
            quizzes={quizChartData}
          />
        </section>

        {/* Quick actions */}
        <section id="quick-links" className="scroll-mt-6">
          <h2 className="mb-4 font-heading text-lg font-semibold text-text-primary">Quick Actions</h2>
          <QuickActions />
        </section>

        {/* Progress trend */}
        <section>
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="mb-4 font-heading text-lg font-semibold text-text-primary">Progress Trend</h2>
            <ProgressTrendChart data={trend} />
          </div>
        </section>

        {/* Detailed marks tables */}
        <section className="space-y-6">
          <h2 className="font-heading text-lg font-semibold text-text-primary">Detailed Scores</h2>
          {(
            [
              { key: "homework", title: "Homework" },
              { key: "offline", title: "Offline Tests" },
              { key: "quiz", title: "Quizzes" },
            ] as const
          ).map(({ key, title }) => (
            <div key={key}>
              <h3 className="mb-2 text-sm font-medium text-text-secondary">{title}</h3>
              <div className="overflow-hidden rounded-xl border border-border bg-surface">
                <ScoreSummaryTable
                  activeTab={key}
                  homework={homework}
                  offlineTests={offlineTests}
                  quizzes={quizzes}
                />
              </div>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
