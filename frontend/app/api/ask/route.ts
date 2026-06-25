import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { lookupStudent } from "@/lib/sheets";

/**
 * Secure server-side proxy for the Ask AK chat → external AI tutor agent.
 *
 * The browser only ever sends { subject, question }. Everything the agent
 * trusts (identity, year level, GATE flag) is derived here, server-side, and
 * the X-Service-Key + agent URL stay on the server (no NEXT_PUBLIC_ prefix),
 * so neither is ever exposed to the client.
 *
 * Request schema confirmed from the agent's OpenAPI spec (AskRequest):
 *   question: string (required, min 1)
 *   year_level: integer (required)        — supported: 3, 5, 7, 8 (+GATE)
 *   is_gate: boolean (default false)
 *   subject: "maths" | "science" | "english" | null
 *   channel: "web" | "mobile" | "whatsapp" (default "web")
 *   student_id / conversation_id: string | null
 */

// Map the chat UI's subject labels → the agent's lowercase Subject enum.
const SUBJECT_MAP: Record<string, "maths" | "science" | "english"> = {
  Maths: "maths",
  Science: "science",
  English: "english",
};

// The agent only supports these year levels. Any other year (e.g. 4, 6, 9) is
// mapped to the NEAREST supported year; ties resolve DOWN (iterating ascending
// with a strict `<` keeps the lower year) so a child never gets content pitched
// above their level. e.g. 4→3, 6→5, 2→3, 10→8.
const SUPPORTED_YEARS = [3, 5, 7, 8] as const;
function toSupportedYear(year: number): number {
  let best: number = SUPPORTED_YEARS[0];
  let bestDist = Infinity;
  for (const y of SUPPORTED_YEARS) {
    const d = Math.abs(y - year);
    if (d < bestDist) {
      bestDist = d;
      best = y;
    }
  }
  return best;
}

// Render's free tier can cold-start slowly — cap the wait so the request
// can't hang forever (the client surfaces this as a friendly retry message).
const AGENT_TIMEOUT_MS = 45_000;

export async function POST(req: NextRequest) {
  // 1. Identify the logged-in student server-side. No session → 401.
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Accept ONLY { subject, question } from the client body.
  let body: { subject?: unknown; question?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) {
    return NextResponse.json({ error: "Question is required" }, { status: 400 });
  }

  // Map the label here, server-side. Unknown/missing → null (agent allows it).
  const subject =
    typeof body.subject === "string" ? SUBJECT_MAP[body.subject] ?? null : null;

  const channel = "web";

  // 3. Resolve the student's REAL year level + GATE flag, server-side, from the
  //    roster sheet keyed by their authenticated email. The client is never
  //    trusted for any of this.
  const email = session.user?.email;
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let record;
  try {
    record = await lookupStudent(email);
  } catch (err) {
    // Sheet not configured / not reachable / not shared with the service
    // account → transient system error, safe to retry. Never falls through
    // to a default year.
    console.error("[ask] student directory lookup failed:", err);
    return NextResponse.json(
      { error: "We couldn't check your year level just now. Please try again in a moment." },
      { status: 503 }
    );
  }

  const rawYear = record?.yearLevel ?? null;
  if (!record || rawYear == null) {
    // Email not in the roster, or year missing/unparseable. Do NOT silently
    // default to a year — surface a friendly, visible message instead so the
    // missing record gets noticed and fixed. (Logged for operators too.)
    console.warn(
      `[ask] no usable year level for ${email} (inRoster=${!!record}, rawYear=${rawYear})`
    );
    return NextResponse.json(
      {
        notice: true,
        answer:
          "I couldn't find your year level yet, so I can't tailor my answer safely. " +
          "Please ask your teacher to add you to the student list — then I'll be ready to help! 🙌",
      },
      { status: 200 }
    );
  }

  const year_level = toSupportedYear(rawYear); // clamp to the agent's {3,5,7,8}
  const is_gate = record.isGate;

  // 4. Config — server-only env vars, never sent to the browser.
  const agentUrl = process.env.TUTOR_AGENT_URL;
  const serviceKey = process.env.TUTOR_SERVICE_KEY;
  if (!agentUrl || !serviceKey) {
    return NextResponse.json(
      { error: "Tutor service is not configured" },
      { status: 500 }
    );
  }

  // Stable per-student id so follow-up questions thread together. Stays server-side.
  const studentId = session.user?.id ?? session.user?.email ?? undefined;

  // 5. Call the agent with a hard timeout.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AGENT_TIMEOUT_MS);

  try {
    const res = await fetch(`${agentUrl}/ask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Service-Key": serviceKey,
      },
      body: JSON.stringify({
        question,
        year_level,
        is_gate,
        subject,
        channel,
        student_id: studentId,
        conversation_id: studentId,
      }),
      signal: controller.signal,
    });

    // Rate limited → return the agent's friendly message, flagged so the UI
    // can show it as a normal bubble (HTTP 200, not a scary error).
    if (res.status === 429) {
      const data = await res.json().catch(() => ({} as Record<string, unknown>));
      const message =
        (data.answer as string) ??
        (data.message as string) ??
        (typeof data.detail === "string" ? data.detail : undefined) ??
        "AK is helping lots of students right now — please try again in a moment.";
      return NextResponse.json({ rateLimited: true, answer: message }, { status: 200 });
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({} as Record<string, unknown>));
      const detail = data.detail ?? data.error;
      const msg =
        typeof detail === "string" ? detail : "The tutor could not answer right now.";
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    // Success → pass the agent's answer JSON straight back to the client.
    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (err: unknown) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return NextResponse.json(
      {
        error: aborted
          ? "The tutor took too long to respond. Please try again."
          : "Could not reach the tutor service. Please try again.",
      },
      { status: 504 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
