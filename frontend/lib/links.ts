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
    key: "ai-agent",
    label: "AI Agent",
    description: "Ask the study assistant",
    url: "/dashboard/student/ask-ak",
    icon: Bot,
    internal: true,
  },
  {
    key: "akademy-plus",
    label: "Akademy+",
    description: "Premium learning hub",
    url: "https://akademyplus.vercel.app/login",
    icon: Sparkles,
  },
  {
    key: "eduquiz8",
    label: "Eduquiz8",
    description: "Practice quizzes",
    url: "https://educ8quizz.netlify.app/",
    icon: ListChecks,
  },
  {
    key: "homework",
    label: "Homework",
    description: "Submit & review homework",
    url: "https://akademy38homework.netlify.app/",
    icon: BookOpen,
  },
];
