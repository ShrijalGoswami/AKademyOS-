import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  fetchHomeworkSheet,
  fetchOfflineTestSheet,
  fetchQuizSheet,
} from "@/lib/sheets";
import { ScoreType } from "@/types";

export async function GET(
  req: NextRequest,
  { params }: { params: { type: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const type = params.type as ScoreType;
  const supabase = createSupabaseAdminClient();

  try {
    const rows = await fetchRows(type);
    const validEmails = await getValidEmails(supabase);

    // Name-Matching Fallback for Offline Tests with empty email column
    if (type === "offline_test") {
      const { data: profiles } = await supabase.from("profiles").select("email, full_name");
      for (const r of rows as any) {
        if (!r.email && r.scholar_name) {
          const scholar = r.scholar_name.trim().toLowerCase();
          const matches = (profiles ?? []).filter((p) => {
            if (!p.full_name) return false;
            const name = p.full_name.trim().toLowerCase();
            return name === scholar || name.startsWith(scholar + " ") || name.includes(" " + scholar);
          });
          if (matches.length === 1) {
            r.email = matches[0].email;
          }
        }
      }
    }

    const invalidEmails = rows
      .map((r) => r.email)
      .filter((e) => !validEmails.has(e));

    return NextResponse.json({ rows, invalidEmails });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { type: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const type = params.type as ScoreType;
  const supabase = createSupabaseAdminClient();

  let rows: { email: string }[] = [];
  let rowsImported = 0;
  let rowsFailed = 0;
  const errors: string[] = [];

  try {
    rows = await fetchRows(type);
    const validEmails = await getValidEmails(supabase);

    // Name-Matching Fallback for Offline Tests with empty email column
    if (type === "offline_test") {
      const { data: profiles } = await supabase.from("profiles").select("email, full_name");
      for (const r of rows as any) {
        if (!r.email && r.scholar_name) {
          const scholar = r.scholar_name.trim().toLowerCase();
          const matches = (profiles ?? []).filter((p) => {
            if (!p.full_name) return false;
            const name = p.full_name.trim().toLowerCase();
            return name === scholar || name.startsWith(scholar + " ") || name.includes(" " + scholar);
          });
          if (matches.length === 1) {
            r.email = matches[0].email;
          }
        }
      }
    }

    const validRows = rows.filter((r) => validEmails.has(r.email));
    rowsFailed = rows.length - validRows.length;

    if (validRows.length > 0) {
      const upsertData = buildUpsertData(type, validRows as any);
      
      // Deduplicate upsertData to avoid PostgreSQL "ON CONFLICT DO UPDATE command cannot affect row a second time" error.
      const uniqueDataMap = new Map<string, any>();
      for (const row of upsertData) {
        const key = type === "quiz"
          ? `${row.user_email}_${row.week_number}_${row.quiz_title}`
          : type === "offline_test"
          ? `${row.user_email}_${row.week_number}_${row.subject}_${row.topic}`
          : `${row.user_email}_${row.week_number}`;
        uniqueDataMap.set(key, row);
      }
      const deduplicatedData = Array.from(uniqueDataMap.values());

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from(tableFor(type)) as any).upsert(deduplicatedData, {
        onConflict: 
          type === "quiz" 
            ? "user_email,week_number,quiz_title" 
            : type === "offline_test"
            ? "user_email,week_number,subject,topic"
            : "user_email,week_number",
      });
      if (error) {
        errors.push(error.message);
        rowsFailed = rows.length;
      } else {
        rowsImported = deduplicatedData.length;
        rowsFailed = rows.length - deduplicatedData.length;
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    errors.push(msg);
    rowsFailed = rows.length;
  }

  const status =
    rowsFailed === 0 ? "success" : rowsImported === 0 ? "failed" : "partial";

  const { data: log } = await supabase
    .from("import_logs")
    .insert({
      admin_email: session.user.email!,
      score_type: type,
      spreadsheet_id: spreadsheetIdFor(type),
      rows_imported: rowsImported,
      rows_failed: rowsFailed,
      status,
      error_details: errors.length ? { errors } : null,
    })
    .select()
    .single();

  return NextResponse.json({ rowsImported, rowsFailed, status, log });
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function fetchRows(type: ScoreType) {
  if (type === "homework") return fetchHomeworkSheet();
  if (type === "offline_test") return fetchOfflineTestSheet();
  if (type === "quiz") return fetchQuizSheet();
  throw new Error("Invalid type");
}

async function getValidEmails(supabase: ReturnType<typeof createSupabaseAdminClient>) {
  const { data } = await supabase.from("profiles").select("email");
  return new Set((data ?? []).map((p) => (p.email as string).trim().toLowerCase()));
}

function tableFor(type: ScoreType): string {
  const map: Record<ScoreType, string> = {
    homework: "homework_scores",
    offline_test: "offline_test_scores",
    quiz: "quiz_scores",
  };
  return map[type];
}

function spreadsheetIdFor(type: ScoreType): string {
  if (type === "homework") return process.env.GOOGLE_SHEETS_HOMEWORK_SPREADSHEET_ID ?? "";
  if (type === "offline_test") return process.env.GOOGLE_SHEETS_OFFLINE_TEST_SPREADSHEET_ID ?? "";
  return process.env.GOOGLE_SHEETS_QUIZ_SPREADSHEET_ID ?? "";
}

function buildUpsertData(type: ScoreType, rows: Record<string, unknown>[]) {
  if (type === "homework") {
    return rows.map((r) => ({
      user_email: r.email,
      week_number: r.week,
      mcq_score: r.mcq_score,
      mcq_max: r.mcq_max,
      short_answer_score: r.short_answer_score,
      short_answer_max: r.short_answer_max,
      long_answer_score: r.long_answer_score,
      long_answer_max: r.long_answer_max,
      published: false,
      updated_at: new Date().toISOString(),
    }));
  }
  if (type === "offline_test") {
    return rows.map((r) => ({
      user_email: r.email,
      week_number: r.week,
      subject: r.subject,
      topic: r.topic,
      score: r.score,
      max_score: r.max_score,
      published: false,
      updated_at: new Date().toISOString(),
    }));
  }
  return rows.map((r) => ({
    user_email: r.email,
    week_number: r.week,
    quiz_title: r.quiz_title,
    subject: r.subject,
    score: r.score,
    max_score: r.max_score,
    published: false,
    updated_at: new Date().toISOString(),
  }));
}
