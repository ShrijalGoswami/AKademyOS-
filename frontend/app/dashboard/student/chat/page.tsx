"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatComposer } from "@/components/chat/ChatComposer";
import type { ChatMessage } from "@/types";

const POLL_INTERVAL_MS = 8000;

export default function StudentChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initialLoad = useRef(true);

  const loadChat = useCallback(async () => {
    try {
      const res = await fetch("/api/chat");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load chat");
      }
      const data = await res.json();
      setMessages(data.messages ?? []);
      setError(null);
    } catch (err: unknown) {
      if (initialLoad.current) {
        setError(err instanceof Error ? err.message : "Failed to load chat");
      }
    } finally {
      if (initialLoad.current) {
        setLoading(false);
        initialLoad.current = false;
      }
    }
  }, []);

  useEffect(() => {
    loadChat();
    const timer = setInterval(loadChat, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [loadChat]);

  const handleSend = useCallback(async (message: string) => {
    const res = await fetch("/api/chat/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to send message");
    }
    const data = await res.json();
    setMessages((prev) => [...prev, data.message as ChatMessage]);
  }, []);

  return (
    <div className="flex h-full flex-col bg-background">
      <Topbar title="Chat with Teacher" subtitle="Your private conversation with the Admin" />

      <div className="flex flex-1 flex-col overflow-hidden">
        {error ? (
          <div className="flex flex-1 items-center justify-center px-6 text-center">
            <div>
              <p className="text-sm font-semibold text-danger">{error}</p>
              <button
                onClick={() => {
                  initialLoad.current = true;
                  setLoading(true);
                  loadChat();
                }}
                className="mt-3 rounded-lg border border-primary/20 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:border-primary"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <ChatMessages
            messages={messages}
            viewerRole="student"
            loading={loading}
            emptyHint="Say hello to your teacher — messages are private between you and the Admin."
          />
        )}
        <ChatComposer onSend={handleSend} disabled={loading || !!error} />
      </div>
    </div>
  );
}
