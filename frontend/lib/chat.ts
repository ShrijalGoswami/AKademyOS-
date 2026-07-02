import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChatConversation } from "@/types";

/**
 * Fetch the single private conversation for a student, creating it on first
 * access. Every student has exactly one conversation (unique student_id).
 *
 * Must be called with the service-role client (see lib/supabase/admin.ts).
 */
export async function getOrCreateConversation(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  studentId: string,
  studentEmail: string
): Promise<ChatConversation> {
  const { data: existing, error: selectError } = await supabase
    .from("chat_conversations")
    .select("*")
    .eq("student_id", studentId)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return existing as ChatConversation;

  const { data: created, error: insertError } = await supabase
    .from("chat_conversations")
    .insert({ student_id: studentId, student_email: studentEmail })
    .select("*")
    .single();

  if (insertError) throw insertError;
  return created as ChatConversation;
}
