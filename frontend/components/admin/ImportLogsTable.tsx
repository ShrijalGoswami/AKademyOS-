import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ImportLog } from "@/types";
import { LocalDate } from "@/components/shared/LocalDate";

interface Props {
  logs: ImportLog[];
}

export function ImportLogsTable({ logs }: Props) {
  if (logs.length === 0) {
    return (
      <p className="text-center text-text-muted text-sm py-6">No import history yet.</p>
    );
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Imported</TableHead>
            <TableHead>Failed</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Admin</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="text-text-muted text-xs">
                <LocalDate date={log.created_at} />
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {log.score_type.replace("_", " ")}
                </Badge>
              </TableCell>
              <TableCell className="text-success">{log.rows_imported}</TableCell>
              <TableCell className={log.rows_failed > 0 ? "text-danger" : "text-text-muted"}>
                {log.rows_failed}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    log.status === "success"
                      ? "success"
                      : log.status === "partial"
                      ? "warning"
                      : "danger"
                  }
                >
                  {log.status}
                </Badge>
              </TableCell>
              <TableCell className="text-text-muted text-xs">{log.admin_email}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
