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
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-text-muted py-8">
                No students found.
              </TableCell>
            </TableRow>
          ) : (
            students.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium text-text-primary">
                  {s.full_name ?? "—"}
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
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
