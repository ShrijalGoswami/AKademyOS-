import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { LoginButton } from "@/components/shared/LoginButton";
import { BookOpen, BarChart2, Shield } from "lucide-react";

export default async function LandingPage() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect(session.user.role === "admin" ? "/dashboard/admin" : "/dashboard/student");
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-10 text-center max-w-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <span className="font-heading text-2xl font-bold text-text-primary tracking-tight">
            AKademy OS
          </span>
        </div>

        <div className="space-y-4">
          <h1 className="font-heading text-4xl font-bold leading-tight text-text-primary sm:text-5xl">
            Track your{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              academic progress
            </span>
          </h1>
          <p className="text-lg text-text-secondary max-w-lg mx-auto">
            View your homework scores, offline test results, and quiz performance in one
            beautiful dashboard.
          </p>
        </div>

        <LoginButton />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 w-full mt-4">
          {[
            {
              icon: BarChart2,
              title: "Visual Charts",
              desc: "Interactive bar graphs for all score categories",
            },
            {
              icon: BookOpen,
              title: "Weekly Tracking",
              desc: "Homework scores across 10 weeks",
            },
            {
              icon: Shield,
              title: "Admin Control",
              desc: "Admins import and publish scores securely",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="glass rounded-xl p-4 text-left hover:border-primary/30 transition-colors"
            >
              <Icon className="mb-2 h-5 w-5 text-primary" />
              <p className="font-semibold text-text-primary text-sm">{title}</p>
              <p className="text-xs text-text-muted mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
