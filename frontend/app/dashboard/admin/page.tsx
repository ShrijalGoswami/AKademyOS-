import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ImportCard } from "@/components/admin/ImportCard";
import { StudentManagementTable } from "@/components/admin/StudentManagementTable";
import { ImportLogsTable } from "@/components/admin/ImportLogsTable";
import { BookOpen, ClipboardList, Zap } from "lucide-react";
import { ImportLog, StudentSummary } from "@/types";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") redirect("/");

  const supabase = createSupabaseAdminClient();

  const [studentsRes, logsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, full_name")
      .eq("role", "student")
      .order("full_name"),
    supabase
      .from("import_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const profiles = studentsRes.data ?? [];

  // Get score counts per student
  const emails = profiles.map((p) => p.email).filter(Boolean) as string[];
  const [hwCount, otCount, qzCount] = await Promise.all([
    emails.length
      ? supabase.from("homework_scores").select("user_email").in("user_email", emails)
      : Promise.resolve({ data: [] }),
    emails.length
      ? supabase.from("offline_test_scores").select("user_email").in("user_email", emails)
      : Promise.resolve({ data: [] }),
    emails.length
      ? supabase.from("quiz_scores").select("user_email").in("user_email", emails)
      : Promise.resolve({ data: [] }),
  ]);

  const hwMap = countBy((hwCount.data ?? []) as { user_email: string }[], "user_email");
  const otMap = countBy((otCount.data ?? []) as { user_email: string }[], "user_email");
  const qzMap = countBy((qzCount.data ?? []) as { user_email: string }[], "user_email");

  const students: StudentSummary[] = profiles.map((p) => ({
    id: p.id,
    email: p.email ?? "",
    full_name: p.full_name,
    homework_count: p.email ? (hwMap[p.email] ?? 0) : 0,
    offline_test_count: p.email ? (otMap[p.email] ?? 0) : 0,
    quiz_count: p.email ? (qzMap[p.email] ?? 0) : 0,
  }));

  const logs = (logsRes.data ?? []) as ImportLog[];

  return (
    <main className="min-h-screen bg-background">
      <div className="relative overflow-hidden bg-gradient-to-br from-surface to-background border-b border-border px-4 py-8 sm:px-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-0 top-0 h-64 w-64 rounded-full bg-accent/5 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl">
          <AdminHeader
            name={session.user.name ?? null}
            email={session.user.email ?? null}
            image={session.user.image ?? null}
          />
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 space-y-10">
        {/* Import cards */}
        <section>
          <h2 className="font-heading text-lg font-semibold text-text-primary mb-4">
            Score Imports
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <ImportCard
              title="Homework"
              icon={BookOpen}
              scoreType="homework"
              lastImport={logs.find((l) => l.score_type === "homework")?.created_at}
              rowCount={students.reduce((a, s) => a + s.homework_count, 0)}
            />
            <ImportCard
              title="Offline Tests"
              icon={ClipboardList}
              scoreType="offline_test"
              lastImport={logs.find((l) => l.score_type === "offline_test")?.created_at}
              rowCount={students.reduce((a, s) => a + s.offline_test_count, 0)}
            />
            <ImportCard
              title="Quizzes"
              icon={Zap}
              scoreType="quiz"
              lastImport={logs.find((l) => l.score_type === "quiz")?.created_at}
              rowCount={students.reduce((a, s) => a + s.quiz_count, 0)}
            />
          </div>
        </section>

        {/* Students table */}
        <section>
          <h2 className="font-heading text-lg font-semibold text-text-primary mb-4">
            Students ({students.length})
          </h2>
          <StudentManagementTable students={students} />
        </section>

        {/* Import logs */}
        <section>
          <h2 className="font-heading text-lg font-semibold text-text-primary mb-4">
            Import History
          </h2>
          <ImportLogsTable logs={logs} />
        </section>
      </div>
    </main>
  );
}

function countBy<T extends Record<string, unknown>>(arr: T[], key: keyof T): Record<string, number> {
  return arr.reduce<Record<string, number>>((acc, item) => {
    const k = String(item[key]);
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
}
