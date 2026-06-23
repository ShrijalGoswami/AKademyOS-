import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { StudentHeader } from "@/components/dashboard/StudentHeader";
import { ScoreGraphTabs } from "@/components/dashboard/ScoreGraphTabs";
import { ScoreSummaryTable } from "@/components/dashboard/ScoreSummaryTable";
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
    supabase
      .from("homework_scores")
      .select("*")
      .eq("user_email", email)
      .eq("published", true)
      .order("week_number"),
    supabase
      .from("offline_test_scores")
      .select("*")
      .eq("user_email", email)
      .eq("published", true)
      .order("week_number"),
    supabase
      .from("quiz_scores")
      .select("*")
      .eq("user_email", email)
      .eq("published", true)
      .order("week_number"),
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
  }));

  const quizChartData: QuizChartData[] = quizzes.map((s) => ({
    week: s.week_number,
    quizTitle: s.quiz_title ?? "",
    score: s.score,
    maxScore: s.max_score,
  }));

  return (
    <main className="min-h-screen bg-background">
      {/* Header gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-surface to-background border-b border-border px-4 py-8 sm:px-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-5xl">
          <StudentHeader
            name={session.user.name ?? null}
            email={email}
            image={session.user.image ?? null}
          />
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8 space-y-8">
        {/* Charts section */}
        <section>
          <h2 className="font-heading text-lg font-semibold text-text-primary mb-4">
            Score Overview
          </h2>
          <ScoreGraphTabs
            homework={homeworkChartData}
            offlineTests={offlineTestChartData}
            quizzes={quizChartData}
          />
        </section>

        {/* Summary table section */}
        <section>
          <h2 className="font-heading text-lg font-semibold text-text-primary mb-4">
            Detailed Scores
          </h2>
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <ScoreSummaryTable
              activeTab="homework"
              homework={homework}
              offlineTests={offlineTests}
              quizzes={quizzes}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
