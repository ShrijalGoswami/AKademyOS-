"use client";

import { useState, useEffect, useCallback } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { CalendarEntry } from "@/types";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  FileText, 
  X,
  ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useParams } from "next/navigation";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

export default function AdminStudentCalendarPage() {
  const params = useParams();
  const rawEmail = params.email as string;
  const studentEmail = decodeURIComponent(rawEmail);

  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calendar display state
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  // Form modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<CalendarEntry | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Fetch student calendar entries
  const fetchStudentEntries = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/student/calendar?email=${encodeURIComponent(studentEmail)}`);
      if (!res.ok) {
        throw new Error("Failed to fetch student calendar");
      }
      const data = await res.json();
      setEntries(data.calendar_data || []);
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [studentEmail]);

  useEffect(() => {
    if (studentEmail) {
      fetchStudentEntries();
    }
  }, [studentEmail, fetchStudentEntries]);

  // Helper values
  const todayStr = new Date().toISOString().split("T")[0];
  const selectedDateStr = selectedDate.toISOString().split("T")[0];

  // Helper calculations for calendar grid
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const prevMonthDays = new Date(year, month, 0).getDate();
  const nextMonthDays = 42 - (firstDayIndex + daysInMonth);

  const calendarDays: Array<{ date: Date; isCurrentMonth: boolean }> = [];

  // Previous month filler days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarDays.push({
      date: new Date(year, month - 1, prevMonthDays - i),
      isCurrentMonth: false
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({
      date: new Date(year, month, i),
      isCurrentMonth: true
    });
  }

  // Next month filler days
  for (let i = 1; i <= nextMonthDays; i++) {
    calendarDays.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false
    });
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Open modal for viewing entry
  const openViewModal = (entry: CalendarEntry) => {
    setSelectedEntry(entry);
    setModalOpen(true);
  };

  // Entries for the selected date
  const selectedDateEntries = entries.filter(
    (e) => e.date === selectedDateStr
  );

  return (
    <>
      <Topbar 
        title="Student Calendar Inspector" 
        subtitle={`Read-only access to academic entries created by ${studentEmail}`} 
      />

      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        {/* Back Link */}
        <div>
          <Link
            href="/dashboard/admin/calendar"
            className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
            Back to Calendar Roster
          </Link>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 text-red-800 p-3 text-sm">
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Month View card */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
            {/* Calendar header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4 bg-background/50">
              <div className="flex items-center gap-4">
                <h2 className="font-heading text-lg font-semibold text-text-primary">
                  {MONTHS[month]} {year}
                </h2>
                <button
                  onClick={handleToday}
                  className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium hover:border-primary hover:text-primary transition-colors"
                >
                  Today
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrevMonth}
                  className="rounded-lg p-1.5 hover:bg-black/5 text-text-secondary transition-colors"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4.5 w-4.5" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="rounded-lg p-1.5 hover:bg-black/5 text-text-secondary transition-colors"
                  aria-label="Next month"
                >
                  <ChevronRight className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            {/* Calendar grid */}
            <div className="p-4">
              <div className="grid grid-cols-7 gap-1 text-center font-heading text-xs font-bold text-text-muted mb-2">
                {WEEKDAYS.map((day) => (
                  <div key={day} className="py-2">{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((cell, idx) => {
                  const cellDateStr = cell.date.toISOString().split("T")[0];
                  const isToday = cellDateStr === todayStr;
                  const isSelected = cellDateStr === selectedDateStr;
                  
                  // Get entries for this day
                  const dayEntries = entries.filter((e) => e.date === cellDateStr);

                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedDate(cell.date)}
                      className={cn(
                        "group relative aspect-square w-full rounded-lg p-1 flex flex-col items-center justify-between border transition-all text-left",
                        !cell.isCurrentMonth && "opacity-35 hover:opacity-75",
                        isSelected 
                          ? "border-primary bg-primary/5 shadow-inner" 
                          : "border-transparent hover:bg-background/80 hover:border-border",
                        isToday && !isSelected && "border-accent bg-accent/5"
                      )}
                    >
                      {/* Date number */}
                      <span className={cn(
                        "text-xs font-semibold rounded-full h-6 w-6 flex items-center justify-center",
                        isToday && "text-primary font-bold",
                        isSelected && "text-primary"
                      )}>
                        {cell.date.getDate()}
                      </span>

                      {/* Entry indicators */}
                      <div className="w-full flex justify-center gap-0.5 mt-auto pb-1">
                        {dayEntries.slice(0, 3).map((entry) => (
                          <div 
                            key={entry.entry_id} 
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              entry.date < todayStr ? "bg-text-muted" : "bg-primary"
                            )} 
                          />
                        ))}
                        {dayEntries.length > 3 && (
                          <span className="text-[8px] font-bold text-text-muted leading-none">+{dayEntries.length - 3}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Details / Timeline sidebar */}
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm flex flex-col min-h-[400px]">
            <div className="border-b border-border pb-3 mb-4">
              <h3 className="font-heading text-base font-semibold text-text-primary flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                Schedule for {selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </h3>
            </div>

            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-text-muted text-sm gap-2">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span>Loading entries...</span>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                {/* List of entries on selected date */}
                {selectedDateEntries.length > 0 ? (
                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-1">
                    {selectedDateEntries.map((entry) => {
                      const isPastEntry = entry.date < todayStr;
                      return (
                        <button 
                          key={entry.entry_id}
                          onClick={() => openViewModal(entry)}
                          className={cn(
                            "w-full text-left rounded-lg p-3.5 border transition-all hover:shadow-sm block",
                            isPastEntry 
                              ? "bg-background/50 border-border opacity-75"
                              : "bg-surface border-primary/20 hover:border-primary/45 glow-indigo"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-heading text-sm font-semibold text-text-primary truncate">{entry.title}</h4>
                            {isPastEntry && (
                              <span className="text-[9px] uppercase font-bold tracking-wider bg-text-muted/10 text-text-muted px-1.5 py-0.5 rounded shrink-0">Past</span>
                            )}
                          </div>
                          <p className="text-xs text-text-secondary mt-1 line-clamp-3 leading-relaxed whitespace-pre-line">{entry.description}</p>
                          <div className="flex items-center gap-1 mt-2.5 text-[10px] text-text-muted">
                            <Clock className="h-3 w-3" />
                            <span>Updated: {new Date(entry.updated_at).toLocaleDateString()}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-background/30 rounded-lg border border-dashed border-border">
                    <FileText className="h-8 w-8 text-text-muted/65 mb-2" />
                    <p className="text-xs text-text-secondary font-medium">No tasks scheduled for this day</p>
                  </div>
                )}
                
                {/* Admin Notice */}
                <div className="mt-auto pt-4 border-t border-border text-[10px] text-text-muted italic flex items-center justify-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                  Read-only Administrator View
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Timeline overview card for future events */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h3 className="font-heading text-base font-semibold text-text-primary mb-4">Student Schedule Timeline</h3>
          
          {loading ? (
            <div className="py-8 text-center text-sm text-text-muted">Loading timeline...</div>
          ) : (
            <div className="space-y-4">
              {entries.sort((a,b) => a.date.localeCompare(b.date)).length > 0 ? (
                <div className="relative border-l border-border pl-4 space-y-5 ml-2">
                  {entries
                    .sort((a,b) => a.date.localeCompare(b.date))
                    .map((entry) => {
                      const isPast = entry.date < todayStr;
                      return (
                        <div key={entry.entry_id} className="relative group">
                          {/* Dot indicator */}
                          <div className={cn(
                            "absolute -left-[21px] top-1.5 h-3.5 w-3.5 rounded-full border-2 bg-surface",
                            isPast ? "border-text-muted" : "border-primary"
                          )} />
                          
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-1",
                                  isPast ? "text-text-muted bg-text-muted/10" : "text-primary bg-primary/10"
                                )}>
                                  {new Date(entry.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                                </span>
                                {isPast && (
                                  <span className="inline-block text-[9px] font-bold text-text-muted bg-background border px-1.5 rounded mb-1 uppercase">Past</span>
                                )}
                              </div>
                              <h4 className="font-heading text-sm font-semibold text-text-primary">{entry.title}</h4>
                              <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{entry.description}</p>
                            </div>
                            <button
                              onClick={() => openViewModal(entry)}
                              className="self-start sm:self-center text-[11px] font-semibold text-primary hover:underline"
                            >
                              Inspect Details
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className="text-xs text-text-muted text-center py-6">No scheduled entries in database.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Details View Modal */}
      {modalOpen && selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl relative animate-in zoom-in-95 duration-200">
            {/* Close button */}
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="font-heading text-lg font-bold text-text-primary mb-2">
              Academic Task Details
            </h3>
            
            <p className="text-xs text-text-muted mb-4">
              Scheduled Date: <span className="font-semibold text-text-secondary">{new Date(selectedEntry.date + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
            </p>

            <div className="space-y-4">
              <div>
                <span className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                  Title
                </span>
                <div className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary font-medium">
                  {selectedEntry.title}
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                  Description
                </span>
                <div className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary whitespace-pre-line leading-relaxed min-h-[100px]">
                  {selectedEntry.description}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-[10px] text-text-muted pt-2">
                <div>
                  <span className="font-semibold block">Created At:</span>
                  <span>{new Date(selectedEntry.created_at).toLocaleString()}</span>
                </div>
                <div>
                  <span className="font-semibold block">Last Updated:</span>
                  <span>{new Date(selectedEntry.updated_at).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-border bg-surface px-5 py-2 text-sm font-medium text-text-secondary hover:bg-background transition-colors"
                >
                  Close Window
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
