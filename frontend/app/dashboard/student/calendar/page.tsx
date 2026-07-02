"use client";

import { useState, useEffect } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { CalendarEntry } from "@/types";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  FileText, 
  Edit3, 
  X,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

export default function StudentCalendarPage() {
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Calendar display state
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  // Form modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDate, setFormDate] = useState("");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Fetch calendar entries
  const fetchEntries = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/student/calendar");
      if (!res.ok) {
        throw new Error("Failed to fetch calendar entries");
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
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  // Helper values
  const todayStr = new Date().toISOString().split("T")[0];
  const selectedDateStr = selectedDate.toISOString().split("T")[0];

  // Helper calculations for calendar grid
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const prevMonthDays = new Date(year, month, 0).getDate();
  const nextMonthDays = 42 - (firstDayIndex + daysInMonth); // Total grid size is 42 (6 rows of 7 days)

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

  // Open modal for creating new entry
  const openCreateModal = () => {
    if (selectedDateStr < todayStr) return; // Prevent creating past tasks
    setModalMode("create");
    setFormTitle("");
    setFormDescription("");
    setFormDate(selectedDateStr);
    setError(null);
    setModalOpen(true);
  };

  // Open modal for editing existing entry
  const openEditModal = (entry: CalendarEntry) => {
    if (entry.date < todayStr) return; // Prevent editing past tasks
    setModalMode("edit");
    setEditingEntryId(entry.entry_id);
    setFormTitle(entry.title);
    setFormDescription(entry.description);
    setFormDate(entry.date);
    setError(null);
    setModalOpen(true);
  };

  // Open modal for viewing entry
  const openViewModal = (entry: CalendarEntry) => {
    setModalMode("view");
    setFormTitle(entry.title);
    setFormDescription(entry.description);
    setFormDate(entry.date);
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!formTitle.trim() || !formDescription.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    if (formDate < todayStr) {
      setError("Cannot schedule tasks in the past.");
      return;
    }

    try {
      const endpoint = "/api/student/calendar";
      const method = modalMode === "create" ? "POST" : "PUT";
      const payload = modalMode === "create" 
        ? { title: formTitle, description: formDescription, date: formDate }
        : { entry_id: editingEntryId, title: formTitle, description: formDescription, date: formDate };

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to save entry");
      }

      setSuccessMsg(modalMode === "create" ? "Entry created successfully!" : "Entry updated successfully!");
      setModalOpen(false);
      fetchEntries();

      // Clear toast message after 3 seconds
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Failed to save entry";
      setError(message);
    }
  };

  // Entries for the selected date
  const selectedDateEntries = entries.filter(
    (e) => e.date === selectedDateStr
  );

  return (
    <>
      <Topbar title="Academic Calendar" subtitle="Keep track of your upcoming homework, quizzes, and exams" />

      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        {/* Success toast alert */}
        {successMsg && (
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-3 pr-4 shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span className="text-sm font-medium">{successMsg}</span>
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
              {selectedDateStr === todayStr && (
                <span className="inline-block mt-1 text-[10px] uppercase font-bold tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded">Today</span>
              )}
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
                        <div 
                          key={entry.entry_id}
                          className={cn(
                            "rounded-lg p-3.5 border transition-all hover:shadow-sm",
                            isPastEntry 
                              ? "bg-background/50 border-border opacity-75"
                              : "bg-surface border-primary/20 hover:border-primary/45 glow-indigo"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-heading text-sm font-semibold text-text-primary truncate">{entry.title}</h4>
                            {isPastEntry ? (
                              <button
                                onClick={() => openViewModal(entry)}
                                className="text-[9px] uppercase font-bold tracking-wider bg-text-muted/10 text-text-muted hover:text-primary transition-colors px-1.5 py-0.5 rounded"
                                title="Inspect entry"
                              >
                                Locked
                              </button>
                            ) : (
                              <button
                                onClick={() => openEditModal(entry)}
                                className="text-text-muted hover:text-primary transition-colors p-0.5"
                                title="Edit entry"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-text-secondary mt-1 line-clamp-3 leading-relaxed whitespace-pre-line">{entry.description}</p>
                          <div className="flex items-center gap-1 mt-2.5 text-[10px] text-text-muted">
                            <Clock className="h-3 w-3" />
                            <span>Updated: {new Date(entry.updated_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-background/30 rounded-lg border border-dashed border-border mb-4">
                    <FileText className="h-8 w-8 text-text-muted/65 mb-2" />
                    <p className="text-xs text-text-secondary font-medium">No academic tasks scheduled</p>
                    <p className="text-[10px] text-text-muted mt-0.5">Tests, quizzes, or homework due today</p>
                  </div>
                )}

                {/* Add button */}
                {selectedDateStr >= todayStr && (
                  <button
                    onClick={openCreateModal}
                    className="w-full mt-auto flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white shadow hover:bg-primary-hover transition-colors"
                  >
                    <Plus className="h-4.5 w-4.5" />
                    Add Academic Task
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Timeline overview card for future events */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h3 className="font-heading text-base font-semibold text-text-primary mb-4">Upcoming Schedule Timeline</h3>
          
          {loading ? (
            <div className="py-8 text-center text-sm text-text-muted">Loading timeline...</div>
          ) : (
            <div className="space-y-4">
              {entries.filter(e => e.date >= todayStr).sort((a,b) => a.date.localeCompare(b.date)).length > 0 ? (
                <div className="relative border-l border-border pl-4 space-y-5 ml-2">
                  {entries
                    .filter(e => e.date >= todayStr)
                    .sort((a,b) => a.date.localeCompare(b.date))
                    .map((entry) => (
                      <div key={entry.entry_id} className="relative group">
                        {/* Dot indicator */}
                        <div className="absolute -left-[21px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-primary bg-surface group-hover:bg-primary transition-colors" />
                        
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                          <div>
                            <span className="inline-block text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full mb-1">
                              {new Date(entry.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                            </span>
                            <h4 className="font-heading text-sm font-semibold text-text-primary">{entry.title}</h4>
                            <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{entry.description}</p>
                          </div>
                          <button
                            onClick={() => openEditModal(entry)}
                            className="self-start sm:self-center flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary-hover transition-colors"
                          >
                            <Edit3 className="h-3 w-3" />
                            Edit
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-xs text-text-muted text-center py-6">No upcoming schedule entries.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Form Modal */}
      {modalOpen && (
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
              {modalMode === "create" && "Schedule New Task"}
              {modalMode === "edit" && "Edit Academic Task"}
              {modalMode === "view" && "View Academic Task"}
            </h3>
            
            <p className="text-xs text-text-muted mb-4">
              For date: <span className="font-semibold text-text-secondary">{new Date(formDate + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
            </p>

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 text-red-800 p-3 text-xs">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                  Title
                </label>
                <input
                  id="title"
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  disabled={modalMode === "view"}
                  placeholder="e.g. Chapter 4 Math Quiz"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-background disabled:opacity-75"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  disabled={modalMode === "view"}
                  placeholder="e.g. Covers vectors, linear algebra, and matrices. Read pages 120-145 in handbook."
                  rows={4}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-background disabled:opacity-75 resize-none"
                  required
                />
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-secondary hover:bg-background hover:text-text-primary transition-colors"
                >
                  {modalMode === "view" ? "Close" : "Cancel"}
                </button>
                {modalMode !== "view" && (
                  <button
                    type="submit"
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
                  >
                    Save Changes
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
