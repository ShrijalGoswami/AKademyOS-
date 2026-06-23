import Link from "next/link";
import { BookOpen, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthErrorPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-6 text-center max-w-md">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10 border border-danger/20">
          <AlertTriangle className="h-8 w-8 text-danger" />
        </div>
        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-bold text-text-primary">
            Access Denied
          </h1>
          <p className="text-text-secondary">
            Your account is not enrolled in AKademy. Please contact your administrator to
            get access.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>
    </main>
  );
}
