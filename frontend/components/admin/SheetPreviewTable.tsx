"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HomeworkSheetRow, OfflineTestSheetRow, QuizSheetRow, ScoreType } from "@/types";

type AnyRow = HomeworkSheetRow | OfflineTestSheetRow | QuizSheetRow;

interface Props {
  type: ScoreType;
  rows: AnyRow[];
  invalidEmails: string[];
  onSave: () => void;
  saving: boolean;
}

export function SheetPreviewTable({ type, rows, invalidEmails, onSave, saving }: Props) {
  const invalidSet = new Set(invalidEmails);
  const validRows = rows.filter((r) => !invalidSet.has(r.email));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-sm text-success">
          <CheckCircle2 className="h-4 w-4" />
          {validRows.length} valid rows
        </div>
        {invalidEmails.length > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-danger">
            <AlertCircle className="h-4 w-4" />
            {invalidEmails.length} unrecognized emails
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Week</TableHead>
              {type === "homework" && (
                <>
                  <TableHead>MCQ</TableHead>
                  <TableHead>Short Ans</TableHead>
                  <TableHead>Long Ans</TableHead>
                </>
              )}
              {type === "offline_test" && <TableHead>Score</TableHead>}
              {type === "quiz" && (
                <>
                  <TableHead>Quiz Title</TableHead>
                  <TableHead>Score</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => {
              const invalid = invalidSet.has(row.email);
              return (
                <TableRow key={i} className={invalid ? "bg-danger/5" : ""}>
                  <TableCell>
                    <Badge variant={invalid ? "danger" : "success"}>
                      {invalid ? "Invalid" : "Valid"}
                    </Badge>
                  </TableCell>
                  <TableCell className={invalid ? "text-danger" : "text-text-secondary"}>
                    {row.email}
                  </TableCell>
                  <TableCell>{row.week}</TableCell>
                  {type === "homework" && (() => {
                    const r = row as HomeworkSheetRow;
                    return (
                      <>
                        <TableCell>{r.mcq_score}/{r.mcq_max}</TableCell>
                        <TableCell>{r.short_answer_score}/{r.short_answer_max}</TableCell>
                        <TableCell>{r.long_answer_score}/{r.long_answer_max}</TableCell>
                      </>
                    );
                  })()}
                  {type === "offline_test" && (() => {
                    const r = row as OfflineTestSheetRow;
                    return <TableCell>{r.score}/{r.max_score}</TableCell>;
                  })()}
                  {type === "quiz" && (() => {
                    const r = row as QuizSheetRow;
                    return (
                      <>
                        <TableCell>{r.quiz_title}</TableCell>
                        <TableCell>{r.score}/{r.max_score}</TableCell>
                      </>
                    );
                  })()}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Button onClick={onSave} disabled={saving || validRows.length === 0} className="w-full">
        {saving ? "Saving…" : `Save ${validRows.length} valid rows to Database`}
      </Button>
    </div>
  );
}
