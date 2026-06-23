"use client";

import { useState } from "react";
import { RefreshCw, Send, LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ScoreType } from "@/types";

interface Props {
  title: string;
  icon: LucideIcon;
  scoreType: ScoreType;
  lastImport?: string;
  rowCount?: number;
  publishedCount?: number;
}

export function ImportCard({
  title,
  icon: Icon,
  scoreType,
  lastImport,
  rowCount = 0,
  publishedCount = 0,
}: Props) {
  const [fetching, setFetching] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleFetch = async () => {
    setFetching(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/import/${scoreType}`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setMessage(`✓ Imported ${data.rowsImported} rows (${data.rowsFailed} failed)`);
      } else {
        setMessage(`✗ ${data.error ?? "Import failed"}`);
      }
    } catch {
      setMessage("✗ Network error");
    } finally {
      setFetching(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/publish/${scoreType}`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setMessage(`✓ Published ${data.count} scores`);
      } else {
        setMessage(`✗ ${data.error ?? "Publish failed"}`);
      }
    } catch {
      setMessage("✗ Network error");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Card className="glass hover:border-primary/30 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <CardTitle>{title}</CardTitle>
          </div>
          <Badge variant={publishedCount > 0 ? "success" : "muted"}>
            {publishedCount > 0 ? "Published" : "Unpublished"}
          </Badge>
        </div>
        <CardDescription>
          {lastImport
            ? `Last import: ${new Date(lastImport).toLocaleDateString()}`
            : "No imports yet"}
          {rowCount > 0 && ` · ${rowCount} rows`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleFetch}
            disabled={fetching || publishing}
            className="flex-1 gap-2"
          >
            {fetching ? <LoadingSpinner size="sm" /> : <RefreshCw className="h-4 w-4" />}
            Fetch from Sheet
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePublish}
            disabled={fetching || publishing}
            className="flex-1 gap-2"
          >
            {publishing ? <LoadingSpinner size="sm" /> : <Send className="h-4 w-4" />}
            Publish
          </Button>
        </div>
        {message && (
          <p className={`text-xs px-1 ${message.startsWith("✓") ? "text-success" : "text-danger"}`}>
            {message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
