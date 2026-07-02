"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Topbar } from "@/components/layout/Topbar";
import { StudentCalendarActivity } from "@/types";
import { 
  Calendar as CalendarIcon, 
  Search, 
  ChevronRight, 
  Users, 
  Clock, 
  Activity,
  FileText
} from "lucide-react";

export default function AdminCalendarDashboard() {
  const [activities, setActivities] = useState<StudentCalendarActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchActivity = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/calendar/activity");
      if (!res.ok) {
        throw new Error("Failed to fetch student calendar activity");
      }
      const data = await res.json();
      setActivities(data.activity || []);
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, []);

  const filteredActivities = activities.filter((act) => {
    const query = searchQuery.toLowerCase();
    return (
      act.full_name.toLowerCase().includes(query) ||
      act.email.toLowerCase().includes(query)
    );
  });

  return (
    <>
      <Topbar title="Calendar Monitoring" subtitle="View student activity logs and open individual student calendars" />

      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        {/* Stat metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Active Calendars</p>
              <h3 className="font-heading text-2xl font-bold text-text-primary mt-0.5">{activities.length}</h3>
              <p className="text-[10px] text-text-muted mt-0.5">Students with calendar logs</p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Total Task Entries</p>
              <h3 className="font-heading text-2xl font-bold text-text-primary mt-0.5">
                {activities.reduce((acc, curr) => acc + curr.entry_count, 0)}
              </h3>
              <p className="text-[10px] text-text-muted mt-0.5">Scheduled tasks across all rosters</p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm flex items-center gap-4 sm:col-span-2 lg:col-span-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10 text-warning">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Last Update</p>
              <h3 className="font-heading text-sm font-semibold text-text-primary mt-1 truncate max-w-[220px]">
                {activities.length > 0
                  ? new Date(activities[0].last_modified_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                  : "No updates yet"}
              </h3>
              <p className="text-[10px] text-text-muted mt-1">Most recent student modification</p>
            </div>
          </div>
        </div>

        {/* Activity list search & card */}
        <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
          {/* Header search controls */}
          <div className="border-b border-border px-5 py-4 bg-background/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <h3 className="font-heading text-base font-semibold text-text-primary self-start sm:self-center">
              Student Activity Logs
            </h3>
            
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Table list */}
          {loading ? (
            <div className="py-12 text-center text-sm text-text-muted flex flex-col items-center justify-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span>Fetching activity records...</span>
            </div>
          ) : error ? (
            <div className="py-12 text-center text-sm text-red-600 p-4">{error}</div>
          ) : filteredActivities.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-background/30 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    <th className="px-5 py-3">Student Name</th>
                    <th className="px-5 py-3">Email Address</th>
                    <th className="px-5 py-3">Task Count</th>
                    <th className="px-5 py-3">Last Modified</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {filteredActivities.map((act) => {
                    const initials = act.full_name
                      ? act.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                      : "ST";
                    
                    return (
                      <tr key={act.email} className="hover:bg-background/20 transition-colors">
                        <td className="px-5 py-4 font-medium text-text-primary flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {initials}
                          </div>
                          <span>{act.full_name}</span>
                        </td>
                        <td className="px-5 py-4 text-text-secondary">{act.email}</td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1 rounded bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 text-xs font-medium">
                            <FileText className="h-3.5 w-3.5" />
                            {act.entry_count} entries
                          </span>
                        </td>
                        <td className="px-5 py-4 text-text-muted">
                          {new Date(act.last_modified_at).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/dashboard/admin/calendar/student/${encodeURIComponent(act.email)}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover transition-colors"
                          >
                            Open Calendar
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center text-text-muted flex flex-col items-center justify-center p-6">
              <CalendarIcon className="h-10 w-10 text-text-muted/50 mb-2" />
              <p className="text-sm font-semibold">No student calendar activity</p>
              <p className="text-xs text-text-muted mt-0.5">Students who schedule tasks will appear here</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
