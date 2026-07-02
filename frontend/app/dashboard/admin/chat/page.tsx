"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { Search, MessageCircle, ArrowLeft } from "lucide-react";
import type { ChatConversationSummary, ChatMessage } from "@/types";

const POLL_INTERVAL_MS = 8000;

function initialsOf(name: string | null, email: string): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return email.slice(0, 2).toUpperCase();
}

function formatListTime(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const today = new Date();
  const sameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();
  return sameDay
    ? date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function AdminChatPage() {
  const [conversations, setConversations] = useState<ChatConversationSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const listLoaded = useRef(false);
  const selectedIdRef = useRef<string | null>(null);

  selectedIdRef.current = selectedId;

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/chat");
      if (!res.ok) throw new Error("Failed to load conversations");
      const data = await res.json();
      setConversations(data.conversations ?? []);
    } catch {
      // Keep the last good list on transient poll failures.
    } finally {
      if (!listLoaded.current) {
        setLoadingList(false);
        listLoaded.current = true;
      }
    }
  }, []);

  const loadThread = useCallback(async (conversationId: string, showSpinner: boolean) => {
    if (showSpinner) setLoadingThread(true);
    try {
      const res = await fetch(`/api/admin/chat/${conversationId}`);
      if (!res.ok) throw new Error("Failed to load conversation");
      const data = await res.json();
      if (selectedIdRef.current === conversationId) {
        setMessages(data.messages ?? []);
      }
    } catch {
      // Ignore transient errors during polling.
    } finally {
      if (showSpinner) setLoadingThread(false);
    }
  }, []);

  // Initial + polling refresh of the inbox list.
  useEffect(() => {
    loadConversations();
    const timer = setInterval(loadConversations, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [loadConversations]);

  // Poll the open thread for new student messages.
  useEffect(() => {
    if (!selectedId) return;
    const timer = setInterval(() => loadThread(selectedId, false), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [selectedId, loadThread]);

  const handleSelect = useCallback(
    async (conversationId: string) => {
      setSelectedId(conversationId);
      setMessages([]);
      await loadThread(conversationId, true);
      // Mark student messages as read and clear the unread badge locally.
      await fetch("/api/admin/chat/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId }),
      }).catch(() => undefined);
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, unread_admin: 0 } : c))
      );
    },
    [loadThread]
  );

  const handleSend = useCallback(
    async (message: string) => {
      if (!selectedId) return;
      const res = await fetch("/api/admin/chat/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: selectedId, message }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send reply");
      }
      const data = await res.json();
      const sent = data.message as ChatMessage;
      setMessages((prev) => [...prev, sent]);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedId
            ? { ...c, last_message: sent.message, last_message_at: sent.created_at }
            : c
        )
      );
    },
    [selectedId]
  );

  const query = searchQuery.toLowerCase();
  const filtered = conversations.filter(
    (c) =>
      (c.student_name ?? "").toLowerCase().includes(query) ||
      c.student_email.toLowerCase().includes(query)
  );

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="flex h-full flex-col bg-background">
      <Topbar title="Chats" subtitle="Reply to student conversations" />

      <div className="flex flex-1 overflow-hidden">
        {/* Conversation list */}
        <aside
          className={`flex w-full flex-col border-r border-border bg-surface md:w-80 lg:w-96 ${
            selectedId ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search students…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingList ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-12 text-center text-text-muted">
                <MessageCircle className="mb-2 h-9 w-9 text-text-muted/40" />
                <p className="text-sm font-medium">No conversations</p>
                <p className="mt-0.5 text-xs">
                  {searchQuery ? "Try a different search." : "Student chats will appear here."}
                </p>
              </div>
            ) : (
              filtered.map((c) => {
                const active = c.id === selectedId;
                return (
                  <button
                    key={c.id}
                    onClick={() => handleSelect(c.id)}
                    className={`flex w-full items-center gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors ${
                      active ? "bg-primary/5" : "hover:bg-background/60"
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {initialsOf(c.student_name, c.student_email)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-text-primary">
                          {c.student_name ?? c.student_email}
                        </p>
                        <span className="shrink-0 text-[10px] text-text-muted">
                          {formatListTime(c.last_message_at)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs text-text-secondary">
                          {c.last_message ?? "No messages yet"}
                        </p>
                        {c.unread_admin > 0 && (
                          <span className="flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                            {c.unread_admin}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Conversation detail */}
        <section
          className={`flex-1 flex-col bg-background ${selectedId ? "flex" : "hidden md:flex"}`}
        >
          {selected ? (
            <>
              <div className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3">
                <button
                  onClick={() => setSelectedId(null)}
                  className="text-text-secondary hover:text-text-primary md:hidden"
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {initialsOf(selected.student_name, selected.student_email)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-text-primary">
                    {selected.student_name ?? selected.student_email}
                  </p>
                  <p className="truncate text-xs text-text-muted">{selected.student_email}</p>
                </div>
              </div>

              <ChatMessages
                messages={messages}
                viewerRole="admin"
                loading={loadingThread}
                emptyHint="No messages yet in this conversation."
              />
              <ChatComposer onSend={handleSend} placeholder="Type a reply…" />
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center text-text-muted">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/5 text-primary">
                <MessageCircle className="h-7 w-7" />
              </div>
              <p className="text-sm font-semibold text-text-primary">Select a conversation</p>
              <p className="mt-0.5 max-w-xs text-xs">
                Choose a student from the list to view and reply to their messages.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
