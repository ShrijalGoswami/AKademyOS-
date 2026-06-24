import { DefaultSession } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

// ─── Auth ────────────────────────────────────────────────────────────────────

export type UserRole = "student" | "admin" | "teacher" | "parent";
export type ScoreType = "homework" | "offline_test" | "quiz";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      role: UserRole;
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role: UserRole;
    userId: string;
  }
}

// ─── Supabase row types ───────────────────────────────────────────────────────

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: UserRole;
  created_at: string;
}

export interface HomeworkScore {
  id: string;
  user_email: string;
  week_number: number;
  mcq_score: number;
  short_answer_score: number;
  long_answer_score: number;
  mcq_max: number;
  short_answer_max: number;
  long_answer_max: number;
  published: boolean;
  updated_at: string;
}

export interface OfflineTestScore {
  id: string;
  user_email: string;
  week_number: 1 | 5 | 10;
  score: number;
  max_score: number;
  published: boolean;
  updated_at: string;
}

export interface QuizScore {
  id: string;
  user_email: string;
  week_number: number;
  quiz_title: string | null;
  subject: string | null;
  score: number;
  max_score: number;
  published: boolean;
  updated_at: string;
}

export interface ImportLog {
  id: string;
  admin_email: string;
  score_type: ScoreType;
  spreadsheet_id: string | null;
  rows_imported: number;
  rows_failed: number;
  status: "success" | "partial" | "failed";
  error_details: Record<string, unknown> | null;
  created_at: string;
}

// ─── Chart data shapes ───────────────────────────────────────────────────────

export interface HomeworkChartData {
  week: number;
  mcq: number;
  short: number;
  long: number;
  mcqMax: number;
  shortMax: number;
  longMax: number;
}

export interface OfflineTestChartData {
  week: 1 | 5 | 10;
  score: number;
  maxScore: number;
}

export interface QuizChartData {
  week: number;
  quizTitle: string;
  score: number;
  maxScore: number;
}

// ─── Google Sheets row shapes ────────────────────────────────────────────────

export interface HomeworkSheetRow {
  email: string;
  week: number;
  mcq_score: number;
  mcq_max: number;
  short_answer_score: number;
  short_answer_max: number;
  long_answer_score: number;
  long_answer_max: number;
}

export interface OfflineTestSheetRow {
  email: string;
  week: number;
  score: number;
  max_score: number;
}

export interface QuizSheetRow {
  email: string;
  week: number;
  quiz_title: string;
  subject: string;
  score: number;
  max_score: number;
}

// ─── API response types ───────────────────────────────────────────────────────

export interface ImportPreviewResult {
  valid: HomeworkSheetRow[] | OfflineTestSheetRow[] | QuizSheetRow[];
  invalidEmails: string[];
  validCount: number;
  invalidCount: number;
  errors: string[];
}

export interface StudentSummary {
  id: string;
  email: string;
  full_name: string | null;
  homework_count: number;
  offline_test_count: number;
  quiz_count: number;
}
