import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  return NextResponse.json({
    homeworkScores: hwRes.data ?? [],
    offlineTestScores: otRes.data ?? [],
    quizScores: qzRes.data ?? [],
  });
}
