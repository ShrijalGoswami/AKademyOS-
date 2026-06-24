import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StudentSummary } from "@/types";

interface Props {
  students: StudentSummary[];
}

export function StudentManagementTable({ students }: Props) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Homework</TableHead>
            <TableHead>Offline Tests</TableHead>
            <TableHead>Quizzes</TableHead>
            <TableHead className="text-right">Grades</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-text-muted py-8">
                No students found.
              </TableCell>
            </TableRow>
          ) : (
            students.map((s) => (
              <TableRow
                key={s.id}
                className="cursor-pointer transition-colors hover:bg-surface-elevated"
              >
                <TableCell className="font-medium text-text-primary">
                  <Link href={`/dashboard/admin/students/${encodeURIComponent(s.email)}`} className="block">
                    {s.full_name ?? "—"}
                  </Link>
                </TableCell>
                <TableCell className="text-text-secondary text-sm">{s.email}</TableCell>
                <TableCell>
                  <Badge variant={s.homework_count > 0 ? "default" : "muted"}>
                    {s.homework_count} weeks
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={s.offline_test_count > 0 ? "warning" : "muted"}>
                    {s.offline_test_count} / 3
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={s.quiz_count > 0 ? "success" : "muted"}>
                    {s.quiz_count} quizzes
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/dashboard/admin/students/${encodeURIComponent(s.email)}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover"
                  >
                    View
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
