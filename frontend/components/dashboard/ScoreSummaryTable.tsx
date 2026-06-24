import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn, getScoreColor, formatScore } from "@/lib/utils";
import { HomeworkScore, OfflineTestScore, QuizScore } from "@/types";

type ActiveTab = "homework" | "offline" | "quiz";

interface Props {
  activeTab: ActiveTab;
  homework: HomeworkScore[];
  offlineTests: OfflineTestScore[];
  quizzes: QuizScore[];
}

export function ScoreSummaryTable({ activeTab, homework, offlineTests, quizzes }: Props) {
  if (activeTab === "homework") {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Week</TableHead>
            <TableHead>MCQ</TableHead>
            <TableHead>Short Answer</TableHead>
            <TableHead>Long Answer</TableHead>
            <TableHead>Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {homework.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-text-muted py-8">
                No homework scores published yet.
              </TableCell>
            </TableRow>
          ) : (
            homework.map((s) => {
              const total = s.mcq_score + s.short_answer_score + s.long_answer_score;
              const totalMax = s.mcq_max + s.short_answer_max + s.long_answer_max;
              return (
                <TableRow key={s.id}>
                  <TableCell className="font-medium text-text-primary">Week {s.week_number}</TableCell>
                  <TableCell className={cn(getScoreColor(s.mcq_score, s.mcq_max))}>
                    {formatScore(s.mcq_score, s.mcq_max)}
                  </TableCell>
                  <TableCell className={cn(getScoreColor(s.short_answer_score, s.short_answer_max))}>
                    {formatScore(s.short_answer_score, s.short_answer_max)}
                  </TableCell>
                  <TableCell className={cn(getScoreColor(s.long_answer_score, s.long_answer_max))}>
                    {formatScore(s.long_answer_score, s.long_answer_max)}
                  </TableCell>
                  <TableCell className={cn("font-semibold", getScoreColor(total, totalMax))}>
                    {formatScore(total, totalMax)}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    );
  }

  if (activeTab === "offline") {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Test</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Percentage</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {offlineTests.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-text-muted py-8">
                No offline test scores published yet.
              </TableCell>
            </TableRow>
          ) : (
            offlineTests.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium text-text-primary">Week {s.week_number} Test</TableCell>
                <TableCell className={cn(getScoreColor(s.score, s.max_score))}>
                  {s.score} / {s.max_score}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      s.max_score > 0 && (s.score / s.max_score) >= 0.8
                        ? "success"
                        : s.max_score > 0 && (s.score / s.max_score) >= 0.6
                        ? "warning"
                        : "danger"
                    }
                  >
                    {s.max_score > 0 ? Math.round((s.score / s.max_score) * 100) : 0}%
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Week</TableHead>
          <TableHead>Subject</TableHead>
          <TableHead>Topic</TableHead>
          <TableHead>Score</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Percentage</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {quizzes.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-text-muted py-8">
              No quiz scores published yet.
            </TableCell>
          </TableRow>
        ) : (
          quizzes.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="font-medium text-text-primary">Week {s.week_number}</TableCell>
              <TableCell className="text-text-secondary uppercase font-semibold text-xs tracking-wider">{s.subject ?? "—"}</TableCell>
              <TableCell className="text-text-primary">{s.quiz_title ?? "—"}</TableCell>
              <TableCell className={cn(getScoreColor(s.score, s.max_score))}>
                {s.score}
              </TableCell>
              <TableCell className="text-text-secondary">
                {s.max_score}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    s.max_score > 0 && (s.score / s.max_score) >= 0.8
                      ? "success"
                      : s.max_score > 0 && (s.score / s.max_score) >= 0.6
                      ? "warning"
                      : "danger"
                  }
                >
                  {s.max_score > 0 ? Math.round((s.score / s.max_score) * 100) : 0}%
                </Badge>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
