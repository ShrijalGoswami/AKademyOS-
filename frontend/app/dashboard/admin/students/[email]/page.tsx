import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { Topbar } from "@/components/layout/Topbar";
import { ScoreGraphTabs } from "@/components/dashboard/ScoreGraphTabs";
import { ScoreSummaryTable } from "@/components/dashboard/ScoreSummaryTable";
import { Badge } from "@/components/ui/badge";
import {
  HomeworkScore,
  OfflineTestScore,
  QuizScore,
  HomeworkChartData,
  OfflineTestChartData,
  QuizChartData,
} from "@/types";

export default async function AdminStudentDetail({
  params,
}: {
  params: { email: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") redirect("/");

  const email = decodeURIComponent(params.email);
  const supabase = createSupabaseAdminClient();

  // Admin sees ALL scores for this student (published and unpublished).
  const [profileRes, hwRes, otRes, qzRes] = await Promise.all([
    supabase.from("profiles").select("full_name, email").eq("email", email).single(),
    supabase.from("homework_scores").select("*").eq("user_email", email).order("week_number"),
    supabase.from("offline_test_scores").select("*").eq("user_email", email).order("week_number"),
    supabase.from("quiz_scores").select("*").eq("user_email", email).order("week_number"),
  ]);

  const profile = profileRes.data;
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

  return (
    <>
      <Topbar title={profile?.full_name ?? email} subtitle="Student grade detail" />

      <div className="space-y-8 p-6">
        <Link
          href="/dashboard/admin#students"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to all students
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-heading text-xl font-bold text-text-primary">
            {profile?.full_name ?? "Unknown student"}
          </h2>
          <Badge variant="outline">{email}</Badge>
          <Badge variant="muted">Admin view · all records</Badge>
        </div>

        {/* Charts */}
        <section>
          <h3 className="mb-4 font-heading text-lg font-semibold text-text-primary">Score Overview</h3>
          <ScoreGraphTabs
            homework={homeworkChartData}
            offlineTests={offlineTestChartData}
            quizzes={quizChartData}
          />
        </section>

        {/* Detailed marks tables */}
        <section className="space-y-6">
          <h3 className="font-heading text-lg font-semibold text-text-primary">Detailed Scores</h3>
          {(
            [
              { key: "homework", title: "Homework" },
              { key: "offline", title: "Offline Tests" },
              { key: "quiz", title: "Quizzes" },
            ] as const
          ).map(({ key, title }) => (
            <div key={key}>
              <h4 className="mb-2 text-sm font-medium text-text-secondary">{title}</h4>
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
