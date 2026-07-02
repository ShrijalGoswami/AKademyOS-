"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import { Send } from "lucide-react";

interface Props {
  onSend: (message: string) => Promise<void> | void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Message input + send button shared by the student and admin chat screens.
 * Enter sends, Shift+Enter inserts a newline.
 */
export function ChatComposer({ onSend, disabled, placeholder }: Props) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);

  const canSend = value.trim().length > 0 && !sending && !disabled;

  async function submit() {
    const message = value.trim();
    if (!message || sending || disabled) return;
    setSending(true);
    try {
      await onSend(message);
      setValue("");
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    submit();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 border-t border-border bg-surface px-3 py-3 sm:px-4"
    >
      <textarea
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder ?? "Type a message…"}
        className="max-h-32 min-h-[2.5rem] flex-1 resize-none rounded-2xl border border-border bg-background px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={!canSend}
        aria-label="Send message"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Send className="h-4 w-4" />
      </button>
    </form>
  );
}
