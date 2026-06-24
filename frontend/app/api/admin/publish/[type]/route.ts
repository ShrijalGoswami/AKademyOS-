import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ScoreType } from "@/types";

const TABLE_MAP: Record<ScoreType, string> = {
  homework: "homework_scores",
  offline_test: "offline_test_scores",
  quiz: "quiz_scores",
};

export async function POST(
  req: NextRequest,
  { params }: { params: { type: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const type = params.type as ScoreType;
  const table = TABLE_MAP[type];
  if (!table) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const supabase = createSupabaseAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase.from(table).update({ published: true }).eq("published", false);
  if (body.weekNumber) {
    query = query.eq("week_number", body.weekNumber);
  }

  const { data, error } = await query.select("*");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ count: data ? data.length : 0 });
}
