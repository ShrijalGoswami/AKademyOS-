import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createSupabaseAdminClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .eq("role", "student")
    .order("full_name");

  const emails = (profiles ?? []).map((p) => p.email).filter(Boolean) as string[];

  const [hwRes, otRes, qzRes] = await Promise.all([
    emails.length
      ? supabase.from("homework_scores").select("user_email").in("user_email", emails)
      : Promise.resolve({ data: [] }),
    emails.length
      ? supabase.from("offline_test_scores").select("user_email, week_number").in("user_email", emails)
      : Promise.resolve({ data: [] }),
    emails.length
      ? supabase.from("quiz_scores").select("user_email").in("user_email", emails)
      : Promise.resolve({ data: [] }),
  ]);

  const countMap = (arr: { user_email: string }[]) =>
    arr.reduce<Record<string, number>>((acc, r) => {
      acc[r.user_email] = (acc[r.user_email] ?? 0) + 1;
      return acc;
    }, {});

  const hwMap = countMap((hwRes.data ?? []) as { user_email: string }[]);
  const qzMap = countMap((qzRes.data ?? []) as { user_email: string }[]);

  // Count unique weeks for offline tests
  const otData = (otRes.data ?? []) as { user_email: string; week_number: number }[];
  const otMap: Record<string, number> = {};
  const otUniqueWeeks: Record<string, Set<number>> = {};
  for (const r of otData) {
    if (!otUniqueWeeks[r.user_email]) {
      otUniqueWeeks[r.user_email] = new Set();
    }
    otUniqueWeeks[r.user_email].add(r.week_number);
  }
  for (const email of Object.keys(otUniqueWeeks)) {
    otMap[email] = otUniqueWeeks[email].size;
  }

  const students = (profiles ?? []).map((p) => ({
    id: p.id,
    email: p.email ?? "",
    full_name: p.full_name,
    homework_count: p.email ? (hwMap[p.email] ?? 0) : 0,
    offline_test_count: p.email ? (otMap[p.email] ?? 0) : 0,
    quiz_count: p.email ? (qzMap[p.email] ?? 0) : 0,
  }));

  return NextResponse.json({ students });
}
