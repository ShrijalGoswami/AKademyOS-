import { Bot, Sparkles, ListChecks, BookOpen, type LucideIcon } from "lucide-react";

export interface StudentLink {
  key: string;
  label: string;
  description: string;
  url: string;
  icon: LucideIcon;
  /** Internal app route (uses Next router, same tab) vs. external link (new tab). */
  internal?: boolean;
}

/**
 * External tools linked from the student dashboard "Quick Actions" section.
 *
 * Replace the `url` placeholders below with the real destinations. Each link
 * opens in a new tab.
 */
export const STUDENT_LINKS: StudentLink[] = [
  {
    key: "akademy-plus",
    label: "AKademy+",
    description: "Premium online video library",
    url: "https://akademyplus.vercel.app/login",
    icon: Sparkles,
  },
  {
    key: "eduquiz8",
    label: "Educ8",
    description: "Practice quizzes",
    url: "https://educ8quizz.netlify.app/",
    icon: ListChecks,
  },
  {
    key: "homework",
    label: "Homework",
    description: "Submit and review homework",
    url: "https://akademy38homework.netlify.app/",
    icon: BookOpen,
  },
  {
    key: "ai-agent",
    label: "A² (Ask AK)",
    description: "24/7 Online Academic Mentor",
    url: "/dashboard/student/ask-ak",
    icon: Bot,
    internal: true,
  },
];
