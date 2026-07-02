"use client";

import { useEffect, useRef } from "react";
import { Check, CheckCheck, MessageCircle } from "lucide-react";
import type { ChatMessage, ChatSenderRole } from "@/types";

interface Props {
  messages: ChatMessage[];
  // Which side is "me": messages from this role are shown on the right.
  viewerRole: ChatSenderRole;
  loading?: boolean;
  emptyHint?: string;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDayLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, today)) return "Today";
  if (sameDay(date, yesterday)) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Scrollable WhatsApp-style message list with day separators, timestamps,
 * read receipts and auto-scroll to the newest message. Shared by the student
 * and admin chat screens.
 */
export function ChatMessages({ messages, viewerRole, loading, emptyHint }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-text-muted">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center text-text-muted">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/5 text-primary">
          <MessageCircle className="h-7 w-7" />
        </div>
        <p className="text-sm font-semibold text-text-primary">No messages yet</p>
        <p className="mt-0.5 max-w-xs text-xs text-text-muted">
          {emptyHint ?? "Send a message to start the conversation."}
        </p>
      </div>
    );
  }

  let lastDay = "";

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-5 sm:px-6">
      {messages.map((m) => {
        const mine = m.sender_role === viewerRole;
        const day = formatDayLabel(m.created_at);
        const showDay = day !== lastDay;
        lastDay = day;

        return (
          <div key={m.id} className="flex flex-col">
            {showDay && (
              <div className="my-3 flex justify-center">
                <span className="rounded-full bg-surface-elevated px-3 py-1 text-[11px] font-medium text-text-muted shadow-sm">
                  {day}
                </span>
              </div>
            )}
            <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-sm sm:max-w-[70%] ${
                  mine
                    ? "rounded-br-md bg-primary text-white"
                    : "rounded-bl-md border border-border bg-surface text-text-primary"
                }`}
              >
                <p className="whitespace-pre-wrap break-words leading-relaxed">{m.message}</p>
                <div
                  className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                    mine ? "text-white/70" : "text-text-muted"
                  }`}
                >
                  <span>{formatTime(m.created_at)}</span>
                  {mine &&
                    (m.is_read ? (
                      <CheckCheck className="h-3.5 w-3.5" aria-label="Read" />
                    ) : (
                      <Check className="h-3.5 w-3.5" aria-label="Sent" />
                    ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
