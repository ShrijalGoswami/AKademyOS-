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
    "Sheet1!A:J"
  );

  const parseColumnPair = (scoreVal: string | undefined, maxVal: string | undefined, defaultMax = 100) => {
    if (scoreVal === undefined || maxVal === undefined) return { score: 0, max: 0 };
    
    const cleanScore = scoreVal.trim();
    const cleanMax = maxVal.trim();
    
    if (
      !cleanScore || 
      !cleanMax || 
      /n\/a/i.test(cleanScore) || 
      /n\/a/i.test(cleanMax) || 
      /no\s*attempt/i.test(cleanScore)
    ) {
      return { score: 0, max: 0 }; // 0 max indicates Not attempted
    }
    
    const scoreNum = parseFloat(cleanScore);
    const maxNum = parseFloat(cleanMax);
    
    return {
      score: isNaN(scoreNum) ? 0 : scoreNum,
      max: isNaN(maxNum) ? defaultMax : maxNum,
    };
  };

  return rows
    .filter((r) => r.length >= 4) // Ensure we at least have Scholar, Year, Email, and Week columns
    .map((r) => {
      const mcq = parseColumnPair(r[4], r[5], 100);
      const short = parseColumnPair(r[6], r[7], 100);
      const long = parseColumnPair(r[8], r[9], 100);

      return {
        scholar_name: String(r[0] || "").trim(),
        email: String(r[2] || "").trim().toLowerCase(),
        week: parseInt(String(r[3] || "").replace(/\D/g, ""), 10) || 1,
        mcq_score: mcq.score,
        mcq_max: mcq.max,
        short_answer_score: short.score,
        short_answer_max: short.max,
        long_answer_score: long.score,
        long_answer_max: long.max,
      };
    });
}

export async function fetchOfflineTestSheet(): Promise<OfflineTestSheetRow[]> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = process.env.GOOGLE_SHEETS_OFFLINE_TEST_SPREADSHEET_ID;
  if (!spreadsheetId) {
    throw new Error("GOOGLE_SHEETS_OFFLINE_TEST_SPREADSHEET_ID is not configured");
  }

  // 1. Get all sheet names dynamically
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const sheetNames = meta.data.sheets
    ?.map((s) => s.properties?.title)
    .filter(Boolean) as string[] || [];

  const offlineRows: OfflineTestSheetRow[] = [];

  // Helper to parse cell score (e.g., "8/11" or "2.5/6/2026" date-format bug)
  const parseScoreAndMax = (val: string | undefined): { score: number; maxScore: number } | null => {
    if (!val) return null;
    const cleanVal = val.trim();
    if (!cleanVal || /no\s*attempt/i.test(cleanVal)) return null;

    // Match date-formatted score bug (e.g. 2.5/6/2026)
    const dateMatch = cleanVal.match(/^([\d.]+)\/([\d.]+)\/\d{4}$/);
    if (dateMatch) {
      return {
        score: parseFloat(dateMatch[1]),
        maxScore: parseFloat(dateMatch[2]),
      };
    }

    // Match standard fraction (e.g. 8/11)
    const fractionMatch = cleanVal.match(/^([\d.]+)\s*\/\s*([\d.]+)$/);
    if (fractionMatch) {
      return {
        score: parseFloat(fractionMatch[1]),
        maxScore: parseFloat(fractionMatch[2]),
      };
    }

    return null;
  };

  // 2. Process each sheet
  for (const sheetName of sheetNames) {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:Z`,
    });

    const rows = res.data.values || [];
    if (rows.length < 2) continue;

    const headers = rows[0];
    
    // Find index of the email column (containing "email" case-insensitively)
    const emailIdx = headers.findIndex((h) => h?.toLowerCase().includes("email"));
    const actualEmailIdx = emailIdx >= 0 ? emailIdx : 2;

    // Find index of the week column (containing "week" case-insensitively)
    const weekIdx = headers.findIndex((h) => h?.toLowerCase().includes("week"));

    // Find all subject/topic columns (index >= 3 and not the week column)
    const subjectCols: { colIdx: number; subject: string; topic: string }[] = [];
    for (let i = 3; i < headers.length; i++) {
      if (i === weekIdx) continue;
      const header = headers[i]?.trim();
      if (!header) continue;

      // Parse subject and topic
      let subject = header;
      let topic = "General";
      if (header.includes(" - ")) {
        const parts = header.split(" - ");
        subject = parts[0].trim();
        topic = parts[1].trim();
      }
      subjectCols.push({ colIdx: i, subject, topic });
    }

    // Parse each student row
    for (let rIdx = 1; rIdx < rows.length; rIdx++) {
      const r = rows[rIdx];
      if (!r || r.length === 0) continue;

      const scholarName = r[0]?.trim();
      if (!scholarName || scholarName.toLowerCase().includes("scholar")) continue; // Skip header fallback

      // Extract email (might be empty, which we will resolve in the API route using name matching)
      const email = r[actualEmailIdx] ? String(r[actualEmailIdx]).trim().toLowerCase() : "";

      // Extract week number
      let week = 1;
      if (weekIdx >= 0 && r[weekIdx]) {
        week = parseInt(String(r[weekIdx]).replace(/\D/g, ""), 10) || 1;
      }

      // Extract scores for each subject/topic column
      for (const col of subjectCols) {
        const cellValue = r[col.colIdx];
        const scoreInfo = parseScoreAndMax(cellValue);
        if (scoreInfo) {
          offlineRows.push({
            email,
            week,
            subject: col.subject,
            topic: col.topic,
            score: scoreInfo.score,
            max_score: scoreInfo.maxScore,
            scholar_name: scholarName,
          });
        }
      }
    }
  }

  return offlineRows;
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
