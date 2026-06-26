"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SheetPreviewTable } from "@/components/admin/SheetPreviewTable";
import { ImportLogsTable } from "@/components/admin/ImportLogsTable";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { SidebarToggle } from "@/components/layout/SidebarToggle";
import { ScoreType, ImportLog } from "@/types";

type PreviewState = {
  rows: unknown[];
  invalidEmails: string[];
} | null;

export default function ImportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const type = params.type as ScoreType;

  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<PreviewState>(null);
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const titles: Record<ScoreType, string> = {
    homework: "Homework Scores",
    offline_test: "Offline Test Scores",
    quiz: "Quiz Scores",
  };

  const handleFetch = async () => {
    setFetching(true);
    setMessage(null);
    setPreview(null);
    try {
      const res = await fetch(`/api/admin/import/${type}?preview=true`);
      const data = await res.json();
      if (res.ok) {
        setPreview({ rows: data.rows, invalidEmails: data.invalidEmails });
      } else {
        setMessage({ text: data.error ?? "Failed to fetch sheet", ok: false });
      }
    } catch {
      setMessage({ text: "Network error", ok: false });
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    if (!preview) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/import/${type}`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: `Saved ${data.rowsImported} rows (${data.rowsFailed} failed)`, ok: true });
        setLogs((prev) => [data.log, ...prev]);
        setPreview(null);
      } else {
        setMessage({ text: data.error ?? "Save failed", ok: false });
      }
    } catch {
      setMessage({ text: "Network error", ok: false });
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/publish/${type}`, { method: "POST" });
      const data = await res.json();
      setMessage({
        text: res.ok ? `Published ${data.count} scores` : (data.error ?? "Publish failed"),
        ok: res.ok,
      });
    } catch {
      setMessage({ text: "Network error", ok: false });
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="border-b border-border bg-surface px-4 py-4 sm:px-8">
        <div className="mx-auto max-w-5xl flex items-center gap-3">
          <SidebarToggle />
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/admin")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-heading text-xl font-bold text-text-primary">
              {titles[type] ?? "Import"}
            </h1>
            <p className="text-sm text-text-secondary">
              Fetch from Google Sheets, review, then save and publish
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8 space-y-8">
        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleFetch} disabled={fetching} className="gap-2">
            {fetching ? <LoadingSpinner size="sm" /> : <Download className="h-4 w-4" />}
            Fetch from Sheet
          </Button>
          <Button variant="success" onClick={handlePublish} className="gap-2">
            <Send className="h-4 w-4" />
            Publish to Students
          </Button>
        </div>

        {message && (
          <p className={`text-sm px-1 ${message.ok ? "text-success" : "text-danger"}`}>
            {message.ok ? "✓" : "✗"} {message.text}
          </p>
        )}

        {/* Preview table */}
        {preview && (
          <section>
            <h2 className="font-heading text-lg font-semibold text-text-primary mb-4">
              Preview ({preview.rows.length} rows)
            </h2>
            <SheetPreviewTable
              type={type}
              rows={preview.rows as any}
              invalidEmails={preview.invalidEmails}
              onSave={handleSave}
              saving={saving}
            />
          </section>
        )}

        {/* Import logs */}
        {logs.length > 0 && (
          <section>
            <h2 className="font-heading text-lg font-semibold text-text-primary mb-4">
              Import History
            </h2>
            <ImportLogsTable logs={logs} />
          </section>
        )}
      </div>
    </main>
  );
}
