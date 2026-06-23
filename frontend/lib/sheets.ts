import { google } from "googleapis";
import {
  HomeworkSheetRow,
  OfflineTestSheetRow,
  QuizSheetRow,
} from "@/types";

function getAuth() {
  return new google.auth.JWT({
    email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

async function readSheet(spreadsheetId: string, range: string): Promise<string[][]> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  const rows = res.data.values as string[][] | null | undefined;
  if (!rows || rows.length < 2) return [];
  return rows.slice(1); // skip header
}

export async function fetchHomeworkSheet(): Promise<HomeworkSheetRow[]> {
  const rows = await readSheet(
    process.env.GOOGLE_SHEETS_HOMEWORK_SPREADSHEET_ID!,
    "Sheet1!A:H"
  );
  return rows
    .filter((r) => r.length >= 8)
    .map((r) => ({
      email: String(r[0]).trim().toLowerCase(),
      week: parseInt(r[1], 10),
      mcq_score: parseFloat(r[2]) || 0,
      mcq_max: parseFloat(r[3]) || 100,
      short_answer_score: parseFloat(r[4]) || 0,
      short_answer_max: parseFloat(r[5]) || 100,
      long_answer_score: parseFloat(r[6]) || 0,
      long_answer_max: parseFloat(r[7]) || 100,
    }));
}

export async function fetchOfflineTestSheet(): Promise<OfflineTestSheetRow[]> {
  const rows = await readSheet(
    process.env.GOOGLE_SHEETS_OFFLINE_TEST_SPREADSHEET_ID!,
    "Sheet1!A:D"
  );
  return rows
    .filter((r) => r.length >= 4)
    .map((r) => ({
      email: String(r[0]).trim().toLowerCase(),
      week: parseInt(r[1], 10),
      score: parseFloat(r[2]) || 0,
      max_score: parseFloat(r[3]) || 100,
    }));
}

export async function fetchQuizSheet(): Promise<QuizSheetRow[]> {
  const rows = await readSheet(
    process.env.GOOGLE_SHEETS_QUIZ_SPREADSHEET_ID!,
    "Sheet1!A:E"
  );
  return rows
    .filter((r) => r.length >= 5)
    .map((r) => ({
      email: String(r[0]).trim().toLowerCase(),
      week: parseInt(r[1], 10),
      quiz_title: String(r[2]).trim(),
      score: parseFloat(r[3]) || 0,
      max_score: parseFloat(r[4]) || 100,
    }));
}
