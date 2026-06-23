"use client";

import { BookOpen, ClipboardList, Zap } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { HomeworkBarChart } from "@/components/charts/HomeworkBarChart";
import { OfflineTestBarChart } from "@/components/charts/OfflineTestBarChart";
import { QuizBarChart } from "@/components/charts/QuizBarChart";
import {
  HomeworkChartData,
  OfflineTestChartData,
  QuizChartData,
} from "@/types";

interface Props {
  homework: HomeworkChartData[];
  offlineTests: OfflineTestChartData[];
  quizzes: QuizChartData[];
}

export function ScoreGraphTabs({ homework, offlineTests, quizzes }: Props) {
  return (
    <Tabs defaultValue="homework" className="w-full">
      <TabsList className="mb-2">
        <TabsTrigger value="homework">
          <BookOpen className="h-4 w-4" />
          Homework
        </TabsTrigger>
        <TabsTrigger value="offline">
          <ClipboardList className="h-4 w-4" />
          Offline Test
        </TabsTrigger>
        <TabsTrigger value="quiz">
          <Zap className="h-4 w-4" />
          Quiz
        </TabsTrigger>
      </TabsList>

      <TabsContent value="homework">
        <div className="rounded-xl border border-border bg-surface p-4 glow-blue">
          <HomeworkBarChart scores={homework} />
        </div>
      </TabsContent>

      <TabsContent value="offline">
        <div className="rounded-xl border border-border bg-surface p-4" style={{ boxShadow: "0 0 20px rgba(245,158,11,0.1)" }}>
          <OfflineTestBarChart scores={offlineTests} />
        </div>
      </TabsContent>

      <TabsContent value="quiz">
        <div className="rounded-xl border border-border bg-surface p-4" style={{ boxShadow: "0 0 20px rgba(16,185,129,0.1)" }}>
          <QuizBarChart scores={quizzes} />
        </div>
      </TabsContent>
    </Tabs>
  );
}
