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
    "Sheet1!A:K"
  );
  
  let currentWeek: number | null = null;
  const quizRows: QuizSheetRow[] = [];
  
  for (const r of rows) {
    if (r.length === 0) continue;
    
    const isStudentRow = r[0] && r[0].includes("@");
    
    if (!isStudentRow) {
      // Check if this row is a week header (e.g., "WEEK 2", "Week 3", etc.)
      const rowText = r.join(" ").trim();
      const weekMatch = rowText.match(/WEEK\s*(\d+)/i);
      if (weekMatch) {
        currentWeek = parseInt(weekMatch[1], 10);
      }
      continue; // Skip non-student rows (headers/metadata)
    }
    
    // If it's a regular student data row
    if (r.length >= 8) {
      const email = String(r[0]).trim().toLowerCase();
      
      // 1. If there's a dedicated Week column (index 10 / column K)
      // 2. Else if we scanned a WEEK header row
      // 3. Else fallback to Year column (index 2)
      let week = 1;
      if (r.length >= 11 && r[10]) {
        week = parseInt(String(r[10]).replace(/\D/g, ""), 10) || 1;
      } else if (currentWeek !== null) {
        week = currentWeek;
      } else {
        week = parseInt(String(r[2]).replace(/\D/g, ""), 10) || 1;
      }
        
      quizRows.push({
        email,
        week,
        subject: String(r[3]).trim(), // Column D
        quiz_title: String(r[4]).trim(), // Column E (Topic)
        score: parseFloat(r[6]) || 0, // Column G
        max_score: parseFloat(r[7]) || 100, // Column H
      });
    }
  }
  
  return quizRows;
}
