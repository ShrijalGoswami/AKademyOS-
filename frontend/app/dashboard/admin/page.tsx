export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { Topbar } from "@/components/layout/Topbar";
import { StatCard } from "@/components/layout/StatCard";
import { ImportCard } from "@/components/admin/ImportCard";
import { StudentManagementTable } from "@/components/admin/StudentManagementTable";
import { ImportLogsTable } from "@/components/admin/ImportLogsTable";
import { ClassProgressChart, ClassProgressDatum } from "@/components/admin/ClassProgressChart";
import { BookOpen, Zap, Users, TrendingUp } from "lucide-react";
import { ImportLog, StudentSummary } from "@/types";

interface HwRow {
  user_email: string;
  published: boolean;
  subject: string | null;
  mcq_score: number;
  short_answer_score: number;
  long_answer_score: number;
  mcq_max: number;
  short_answer_max: number;
  long_answer_max: number;
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") redirect("/");

  const supabase = createSupabaseAdminClient();

  const [studentsRes, logsRes] = await Promise.all([
    supabase.from("profiles").select("id, email, full_name").eq("role", "student").order("full_name"),
    supabase.from("import_logs").select("*").order("created_at", { ascending: false }).limit(20),
  ]);

  const profiles = studentsRes.data ?? [];
  const emails = profiles.map((p) => p.email).filter(Boolean) as string[];

  const [hwRes, otRes, qzRes] = await Promise.all([
    emails.length
      ? supabase
          .from("homework_scores")
          .select("user_email, published, subject, mcq_score, short_answer_score, long_answer_score, mcq_max, short_answer_max, long_answer_max")
          .in("user_email", emails)
      : Promise.resolve({ data: [] }),
    emails.length
      ? supabase.from("offline_test_scores").select("user_email, published, week_number").in("user_email", emails)
      : Promise.resolve({ data: [] }),
    emails.length
      ? supabase.from("quiz_scores").select("user_email, published").in("user_email", emails)
      : Promise.resolve({ data: [] }),
  ]);

  const hwRows = (hwRes.data ?? []) as HwRow[];
  const otRows = (otRes.data ?? []) as { user_email: string; published: boolean; week_number: number }[];
  const qzRows = (qzRes.data ?? []) as { user_email: string; published: boolean }[];

  const isHwPublished = hwRows.length > 0 && hwRows.every((r) => r.published);
  const isOtPublished = otRows.length > 0 && otRows.every((r) => r.published);
  const isQzPublished = qzRows.length > 0 && qzRows.every((r) => r.published);

  const countBy = (arr: { user_email: string }[]) =>
    arr.reduce<Record<string, number>>((acc, r) => {
      acc[r.user_email] = (acc[r.user_email] ?? 0) + 1;
      return acc;
    }, {});

  const hwCountMap = countBy(hwRows);
  const qzMap = countBy(qzRows);

  // Count unique weeks for offline tests
  const otMap: Record<string, number> = {};
  const otUniqueWeeks: Record<string, Set<number>> = {};
  for (const r of otRows) {
    if (!otUniqueWeeks[r.user_email]) {
      otUniqueWeeks[r.user_email] = new Set();
    }
    otUniqueWeeks[r.user_email].add(r.week_number);
  }
  for (const email of Object.keys(otUniqueWeeks)) {
    otMap[email] = otUniqueWeeks[email].size;
  }

  // Per-student homework percentage (sum of all weeks)
  const pctSum: Record<string, { sum: number; n: number }> = {};
  for (const r of hwRows) {
    const total = r.mcq_score + r.short_answer_score + r.long_answer_score;
    const max = r.mcq_max + r.short_answer_max + r.long_answer_max;
    const pct = max > 0 ? (total / max) * 100 : 0;
    const cur = pctSum[r.user_email] ?? { sum: 0, n: 0 };
    pctSum[r.user_email] = { sum: cur.sum + pct, n: cur.n + 1 };
  }

  const students: StudentSummary[] = profiles.map((p) => ({
    id: p.id,
    email: p.email ?? "",
    full_name: p.full_name,
    homework_count: p.email ? (hwCountMap[p.email] ?? 0) : 0,
    offline_test_count: p.email ? (otMap[p.email] ?? 0) : 0,
    quiz_count: p.email ? (qzMap[p.email] ?? 0) : 0,
  }));

  const classProgress: ClassProgressDatum[] = students
    .filter((s) => pctSum[s.email]?.n)
    .map((s) => ({
      name: (s.full_name ?? s.email).split(" ")[0].slice(0, 10),
      percent: Math.round(pctSum[s.email].sum / pctSum[s.email].n),
    }));

  const classAvg = classProgress.length
    ? Math.round(classProgress.reduce((a, d) => a + d.percent, 0) / classProgress.length)
    : 0;

  const logs = (logsRes.data ?? []) as ImportLog[];

  return (
    <>
      <Topbar title="Teacher Dashboard" subtitle="Overview of every student's performance" />

      <div className="space-y-10 p-6">
        {/* Stat cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} value={students.length} label="Active Students" sublabel="all enrolled" />
          <StatCard icon={BookOpen} value={hwRows.length} label="Homework Records" iconColor="text-accent" iconBg="bg-accent/10" />
          <StatCard icon={Zap} value={qzRows.length} label="Quiz Records" iconColor="text-warning" iconBg="bg-warning/10" />
          <StatCard icon={TrendingUp} value={`${classAvg}%`} label="Class Avg (Homework)" iconColor="text-primary" iconBg="bg-primary/10" />
        </section>

        {/* Class progress chart */}
        <section>
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="mb-4 font-heading text-lg font-semibold text-text-primary">Class Progress</h2>
            <ClassProgressChart data={classProgress} />
          </div>
        </section>

        {/* Students table */}
        <section id="students" className="scroll-mt-6">
          <h2 className="mb-4 font-heading text-lg font-semibold text-text-primary">
            Students ({students.length})
          </h2>
          <StudentManagementTable students={students} />
        </section>

        {/* Imports */}
        <section id="imports" className="scroll-mt-6 space-y-6">
          <div>
            <h2 className="mb-4 font-heading text-lg font-semibold text-text-primary">Score Imports</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <ImportCard
                title="Homework"
                scoreType="homework"
                lastImport={logs.find((l) => l.score_type === "homework")?.created_at}
                rowCount={students.reduce((a, s) => a + s.homework_count, 0)}
                initialIsPublished={isHwPublished}
              />
              <ImportCard
                title="Offline Tests"
                scoreType="offline_test"
                lastImport={logs.find((l) => l.score_type === "offline_test")?.created_at}
                rowCount={students.reduce((a, s) => a + s.offline_test_count, 0)}
                initialIsPublished={isOtPublished}
              />
              <ImportCard
                title="Quizzes"
                scoreType="quiz"
                lastImport={logs.find((l) => l.score_type === "quiz")?.created_at}
                rowCount={students.reduce((a, s) => a + s.quiz_count, 0)}
                initialIsPublished={isQzPublished}
              />
            </div>
          </div>

          <div>
            <h2 className="mb-4 font-heading text-lg font-semibold text-text-primary">Import History</h2>
            <ImportLogsTable logs={logs} />
          </div>
        </section>
      </div>
    </>
  );
}
