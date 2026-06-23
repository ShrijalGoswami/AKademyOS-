import { Bot, Sparkles, ListChecks, BookOpen, type LucideIcon } from "lucide-react";

export interface StudentLink {
  key: string;
  label: string;
  description: string;
  url: string;
  icon: LucideIcon;
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
    url: "https://REPLACE_ME/ai-agent",
    icon: Bot,
  },
  {
    key: "akademy-plus",
    label: "Akademy+",
    description: "Premium learning hub",
    url: "https://REPLACE_ME/akademy-plus",
    icon: Sparkles,
  },
  {
    key: "eduquiz8",
    label: "Eduquiz8",
    description: "Practice quizzes",
    url: "https://REPLACE_ME/eduquiz8",
    icon: ListChecks,
  },
  {
    key: "homework",
    label: "Homework",
    description: "Submit & review homework",
    url: "https://REPLACE_ME/homework",
    icon: BookOpen,
  },
];
