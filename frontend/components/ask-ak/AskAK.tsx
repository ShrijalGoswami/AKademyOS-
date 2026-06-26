"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { SidebarToggle } from "@/components/layout/SidebarToggle";

/**
 * Ask AK — AI Tutor chat UI (A² · "Your Academic Mentor")
 *
 * Self-contained functional component. Uses ONLY inline styles (no Tailwind,
 * no UI library) so it can be dropped into any React/Next.js page.
 *
 * NOTE: This currently returns a MOCK tutor reply. The single spot to wire up
 * the real agent is marked below with `// TODO: call agent /ask here`.
 */

// ---- Brand palette -------------------------------------------------------
const COLORS = {
  cream: "#F5F0E1",
  creamSoft: "#FBF8F0",
  forest: "#1a4d3a",
  forestSoft: "#2a6b51",
  forestTint: "#e6efe9",
  white: "#FFFFFF",
  textDark: "#23332b",
  textMuted: "#6b7c72",
  border: "#e3dcc7",
  // Playful secondary accents (used lightly to complement green + cream)
  gold: "#f4b740",
  goldSoft: "#fdf0d0",
  teal: "#4fb0a5",
  tealSoft: "#dcf0ed",
};

const SUBJECTS = [
  { name: "Maths", emoji: "➗" },
  { name: "Science", emoji: "🔬" },
  { name: "English", emoji: "📖" },
] as const;
type Subject = (typeof SUBJECTS)[number]["name"];

// Kid-level example questions for the friendly empty-state chips.
const EXAMPLE_QUESTIONS = [
  "How do fractions work?",
  "Why is the sky blue?",
  "What's a noun?",
  "Tell me a fun science fact!",
];

type Sender = "ak" | "student";
interface Message {
  id: number;
  sender: Sender;
  text: string;
}

let messageId = 1;

/**
 * remark-math only renders `$$…$$` as centered *display* math when the `$$`
 * delimiters sit on their own lines; a one-liner `$$\frac{1}{4}$$` (which the
 * tutor commonly emits) is otherwise treated as inline. Normalise those onto
 * their own lines so block equations display properly. Inline `$…$` untouched.
 */
function normalizeBlockMath(text: string): string {
  return text.replace(/\$\$([\s\S]+?)\$\$/g, (_m, inner) => `\n\n$$\n${inner.trim()}\n$$\n\n`);
}

/**
 * Renders an assistant message as Markdown + math.
 * - remark-gfm  → tables, lists, strikethrough, autolinks
 * - remark-math + rehype-katex → $inline$ and $$block$$ LaTeX (KaTeX)
 * Styling lives in the `.askak-md` rules in the <style> block below so it
 * stays inside the cream/green chat bubble and never overflows on mobile.
 */
function MarkdownMessage({ text }: { text: string }) {
  return (
    <div className="askak-md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {normalizeBlockMath(text)}
      </ReactMarkdown>
    </div>
  );
}

export default function AskAK() {
  const [subject, setSubject] = useState<Subject>("Maths");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep the conversation scrolled to the newest message.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isTyping]);

  /**
   * Fetch a tutor reply from the secure server-side proxy (/api/ask).
   *
   * We send ONLY { subject, question }. The route derives identity, year level,
   * GATE flag and channel server-side, and the service key never reaches here.
   *
   * Returns the answer text on success. A rate-limited response comes back as a
   * friendly 200 message (shown as a normal bubble). Hard failures throw, and
   * `sendText` renders them as a friendly error bubble.
   */
  async function getTutorReply(question: string, currentSubject: Subject): Promise<string> {
    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: currentSubject, question }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error ?? "Something went wrong reaching AK.");
    }
    // Both normal answers and rate-limit messages arrive as `answer` (HTTP 200).
    return data.answer ?? "Sorry, I couldn't come up with an answer just now.";
  }

  async function sendText(raw: string) {
    const text = raw.trim();
    if (!text || isTyping) return;

    const studentMsg: Message = { id: messageId++, sender: "student", text };
    setMessages((prev) => [...prev, studentMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const reply = await getTutorReply(text, subject);
      setMessages((prev) => [...prev, { id: messageId++, sender: "ak", text: reply }]);
    } catch (err) {
      // Friendly error bubble — never leave the chat stuck on the typing dots.
      const msg = err instanceof Error ? err.message : "Network error.";
      setMessages((prev) => [
        ...prev,
        { id: messageId++, sender: "ak", text: `⚠️ ${msg}\nPlease try again in a moment.` },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  function handleSend() {
    sendText(input);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Tapping an example chip fills the input (and focuses it) so kids can edit/send.
  function handleExampleTap(q: string) {
    setInput(q);
    inputRef.current?.focus();
  }

  const isEmpty = messages.length === 0;

  return (
    <div style={styles.page}>
      {/* Mobile-only menu button to open the dashboard sidebar drawer */}
      <div className="fixed left-3 top-3 z-30 md:hidden">
        <SidebarToggle />
      </div>
      <div style={styles.card}>
        {/* ---- Header ---- */}
        {/* The logo image already contains the "Ask AK" wordmark + "Your
            Academic Mentor" tagline, so we show ONLY the logo (no adjacent
            text) to avoid the wording appearing twice. */}
        <header style={styles.header}>
          <div style={styles.logoWrap}>
            <img
              src="/ask-ak-logo.jpeg"
              alt="Ask AK — Your Academic Mentor"
              style={styles.logoImg}
              onError={(e) => {
                // Fallback shown ONLY if the logo image fails to load, so the
                // header isn't empty.
                (e.currentTarget as HTMLImageElement).style.display = "none";
                const sib = e.currentTarget.nextElementSibling as HTMLElement | null;
                if (sib) sib.style.display = "flex";
              }}
            />
            <div style={styles.logoFallback}>
              <span style={{ ...styles.mascot, ...styles.fallbackMascot }}>A²</span>
              <span style={styles.fallbackText}>Ask AK</span>
            </div>
          </div>
        </header>

        {/* ---- Subject selector ---- */}
        <div style={styles.subjects}>
          {SUBJECTS.map(({ name, emoji }) => {
            const active = name === subject;
            return (
              <button
                key={name}
                type="button"
                onClick={() => setSubject(name)}
                aria-pressed={active}
                className="askak-pill"
                style={{
                  ...styles.pill,
                  ...(active ? styles.pillActive : {}),
                }}
              >
                <span style={styles.pillEmoji}>{emoji}</span>
                {name}
              </button>
            );
          })}
        </div>

        {/* ---- Chat area ---- */}
        <div ref={scrollRef} style={styles.chat}>
          {/* Friendly welcome / empty-state */}
          <div style={styles.welcome}>
            <div style={{ ...styles.mascot, ...styles.welcomeMascot }}>A²</div>
            <h2 style={styles.welcomeHeading}>
              Meet A² 👋 — Your 24/7 AKademy38 Academic Mentor!
            </h2>
            <p style={styles.welcomeSub}>
              Pick a subject and ask me anything in Maths, Science, or English — I&apos;m
              always here to help!
            </p>

            {isEmpty && (
              <div style={styles.chips}>
                {EXAMPLE_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleExampleTap(q)}
                    className="askak-chip"
                    style={styles.chip}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          {messages.map((m) =>
            m.sender === "ak" ? (
              <div key={m.id} style={styles.rowAk}>
                <div style={styles.avatar}>A²</div>
                <div style={styles.bubbleAk}>
                  <MarkdownMessage text={m.text} />
                </div>
              </div>
            ) : (
              <div key={m.id} style={styles.rowStudent}>
                <div style={styles.bubbleStudent}>{m.text}</div>
              </div>
            )
          )}

          {isTyping && (
            <div style={styles.rowAk}>
              <div style={styles.avatar}>A²</div>
              <div style={{ ...styles.bubbleAk, ...styles.typing }}>
                <Dot color={COLORS.forest} />
                <Dot color={COLORS.gold} delay={0.2} />
                <Dot color={COLORS.teal} delay={0.4} />
              </div>
            </div>
          )}
        </div>

        {/* ---- Input ---- */}
        <div style={styles.inputBar}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask an ${subject} question…`}
            style={styles.input}
            aria-label="Ask AK a question"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="askak-send"
            style={{
              ...styles.sendBtn,
              ...(!input.trim() || isTyping ? styles.sendBtnDisabled : {}),
            }}
            aria-label="Send"
          >
            ➤
          </button>
        </div>
      </div>

      {/* Keyframes + hover effects (inline styles can't hold @keyframes/:hover). */}
      <style>{`
        @keyframes askak-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes askak-pop {
          0% { transform: scale(0.4); opacity: 0; }
          60% { transform: scale(1.12); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes askak-wave {
          0%, 60%, 100% { transform: rotate(0deg); }
          15% { transform: rotate(18deg); }
          30% { transform: rotate(-12deg); }
          45% { transform: rotate(14deg); }
        }
        .askak-wave { display: inline-block; transform-origin: 70% 70%;
          animation: askak-wave 2.2s ease-in-out 0.4s 2; }
        .askak-pill { transition: transform .15s ease, box-shadow .15s ease, background .15s ease; }
        .askak-pill:hover { transform: translateY(-2px) scale(1.03); }
        .askak-chip { transition: transform .15s ease, box-shadow .15s ease, background .15s ease; }
        .askak-chip:hover { transform: translateY(-2px); background: ${COLORS.goldSoft};
          box-shadow: 0 4px 12px rgba(244,183,64,0.35); }
        .askak-send:not(:disabled):hover { transform: scale(1.1) rotate(6deg);
          box-shadow: 0 6px 16px rgba(26,77,58,0.35); }
        .askak-send:not(:disabled):active { transform: scale(0.95); }

        /* ---- Markdown answer styling (assistant bubbles only) ---- */
        .askak-md { font-size: 15.5px; line-height: 1.6; color: ${COLORS.textDark};
          word-break: break-word; overflow-wrap: anywhere; }
        .askak-md > :first-child { margin-top: 0; }
        .askak-md > :last-child { margin-bottom: 0; }
        .askak-md p { margin: 0 0 10px; }
        .askak-md h1, .askak-md h2, .askak-md h3, .askak-md h4 {
          color: ${COLORS.forest}; font-weight: 900; line-height: 1.3; margin: 14px 0 8px; }
        .askak-md h1 { font-size: 19px; }
        .askak-md h2 { font-size: 17.5px; }
        .askak-md h3 { font-size: 16px; }
        .askak-md h4 { font-size: 15px; }
        .askak-md ul, .askak-md ol { margin: 6px 0 10px; padding-left: 22px; }
        .askak-md li { margin: 3px 0; }
        .askak-md li::marker { color: ${COLORS.forestSoft}; }
        .askak-md strong { font-weight: 800; color: ${COLORS.forest}; }
        .askak-md em { font-style: italic; }
        .askak-md a { color: ${COLORS.teal}; text-decoration: underline; font-weight: 700; }
        .askak-md blockquote { margin: 8px 0; padding: 4px 12px;
          border-left: 4px solid ${COLORS.gold}; background: ${COLORS.goldSoft};
          border-radius: 8px; }
        .askak-md hr { border: none; border-top: 1px solid ${COLORS.border}; margin: 12px 0; }
        .askak-md code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          font-size: 0.88em; background: ${COLORS.forestTint}; color: ${COLORS.forest};
          padding: 1px 6px; border-radius: 6px; }
        .askak-md pre { background: ${COLORS.forestTint}; border: 1px solid ${COLORS.border};
          border-radius: 12px; padding: 12px 14px; margin: 8px 0;
          overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .askak-md pre code { background: none; padding: 0; color: ${COLORS.textDark}; font-size: 13.5px; }
        /* Wide tables scroll horizontally inside the bubble on narrow screens */
        .askak-md table { display: block; max-width: 100%; width: max-content; min-width: 60%;
          overflow-x: auto; -webkit-overflow-scrolling: touch; border-collapse: collapse;
          margin: 8px 0; font-size: 14px; }
        .askak-md th, .askak-md td { border: 1px solid ${COLORS.border}; padding: 7px 11px;
          text-align: left; white-space: nowrap; }
        .askak-md th { background: ${COLORS.forestTint}; color: ${COLORS.forest}; font-weight: 800; }
        .askak-md tr:nth-child(even) td { background: ${COLORS.creamSoft}; }
        .askak-md img { max-width: 100%; height: auto; border-radius: 8px; }
        /* KaTeX math — block equations scroll instead of overflowing */
        .askak-md .katex { font-size: 1.04em; }
        .askak-md .katex-display { margin: 10px 0; padding: 4px 2px;
          overflow-x: auto; overflow-y: hidden; }
      `}</style>
    </div>
  );
}

function Dot({ color, delay = 0 }: { color: string; delay?: number }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 9,
        height: 9,
        borderRadius: "50%",
        background: color,
        animation: `askak-bounce 1.2s ${delay}s infinite ease-in-out`,
      }}
    />
  );
}

// ---- Styles --------------------------------------------------------------
const styles: { [k: string]: React.CSSProperties } = {
  page: {
    // Fill the dashboard content area (parent is h-screen + overflow-y-auto,
    // no Topbar on this page) so the chat uses the whole available height.
    height: "100%",
    minHeight: "100%",
    width: "100%",
    // Soft cream gradient + very light dot pattern — fun but stays readable.
    background: `
      radial-gradient(circle at 18px 18px, rgba(26,77,58,0.045) 2px, transparent 2px),
      radial-gradient(1200px 600px at 100% 0%, ${COLORS.tealSoft} 0%, transparent 55%),
      radial-gradient(1000px 500px at 0% 100%, ${COLORS.goldSoft} 0%, transparent 55%),
      linear-gradient(160deg, ${COLORS.creamSoft} 0%, ${COLORS.cream} 100%)`,
    backgroundSize: "36px 36px, cover, cover, cover",
    display: "flex",
    alignItems: "stretch", // card stretches to fill the height...
    justifyContent: "center", // ...while staying centred at its capped width
    padding: "clamp(12px, 2.2vh, 28px)",
    boxSizing: "border-box",
    fontFamily:
      "'Nunito', 'Quicksand', system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  card: {
    width: "100%",
    // Noticeably wider than before (was 580) but capped so text lines stay
    // comfortably readable for children.
    maxWidth: 880,
    height: "100%", // fill the stretched page area top-to-bottom
    minHeight: 0, // let the inner chat area scroll instead of overflowing
    display: "flex",
    flexDirection: "column",
    background: COLORS.creamSoft,
    border: `2px solid ${COLORS.border}`,
    borderRadius: 28,
    boxShadow: "0 18px 50px rgba(26, 77, 58, 0.18)",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "18px 22px",
    background: `linear-gradient(135deg, ${COLORS.forest} 0%, ${COLORS.forestSoft} 100%)`,
    color: COLORS.white,
  },
  logoWrap: { display: "flex", alignItems: "center", minWidth: 0, flexShrink: 1 },
  logoImg: {
    // Sized by height so the full wordmark+tagline logo reads cleanly; width
    // auto keeps its aspect ratio, maxWidth stops it overflowing on mobile.
    height: 50,
    width: "auto",
    maxWidth: "min(72vw, 320px)",
    borderRadius: 14,
    objectFit: "contain",
    background: COLORS.creamSoft,
    padding: "4px 8px",
    boxSizing: "border-box",
    boxShadow: "0 0 0 2px rgba(255,255,255,0.4)",
    display: "block",
  },
  mascot: {
    // Friendly mascot badge — soft glow + a cheerful pop/bounce on load.
    background: `linear-gradient(140deg, ${COLORS.gold} 0%, #ffd277 100%)`,
    color: COLORS.forest,
    boxShadow: `0 0 0 4px rgba(255,255,255,0.35), 0 6px 16px rgba(244,183,64,0.5)`,
    animation: "askak-pop 0.6s cubic-bezier(.2,1.3,.5,1) both",
  },
  // Fallback (image-load failure only): a small A² mark + "Ask AK" wordmark.
  logoFallback: {
    display: "none",
    alignItems: "center",
    gap: 12,
  },
  fallbackMascot: {
    width: 44,
    height: 44,
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
    fontSize: 20,
    flexShrink: 0,
  },
  fallbackText: { fontSize: 22, fontWeight: 900, letterSpacing: 0.3, color: COLORS.white },
  subjects: {
    display: "flex",
    gap: 10,
    padding: "16px 20px",
    background: COLORS.creamSoft,
    borderBottom: `1px solid ${COLORS.border}`,
    flexWrap: "wrap",
  },
  pill: {
    flex: "1 1 auto",
    minWidth: 96,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "11px 14px",
    borderRadius: 999,
    border: `2px solid ${COLORS.forest}`,
    background: COLORS.white,
    color: COLORS.forest,
    fontSize: 15,
    fontWeight: 800,
    cursor: "pointer",
  },
  pillActive: {
    background: `linear-gradient(135deg, ${COLORS.forest} 0%, ${COLORS.forestSoft} 100%)`,
    color: COLORS.white,
    boxShadow: "0 4px 12px rgba(26, 77, 58, 0.3)",
  },
  pillEmoji: { fontSize: 17, lineHeight: 1 },
  chat: {
    flex: 1,
    minHeight: 0, // critical: lets this flex child scroll instead of growing the card
    overflowY: "auto",
    padding: "20px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  welcome: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: 10,
    padding: "12px 12px 6px",
  },
  welcomeMascot: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 26,
    fontWeight: 900,
  },
  welcomeHeading: {
    margin: "4px 0 0",
    fontSize: 20,
    fontWeight: 900,
    color: COLORS.forest,
    lineHeight: 1.3,
    maxWidth: 420,
  },
  welcomeSub: {
    margin: 0,
    fontSize: 15,
    fontWeight: 600,
    color: COLORS.textMuted,
    lineHeight: 1.5,
    maxWidth: 400,
  },
  chips: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 9,
    marginTop: 8,
  },
  chip: {
    padding: "9px 15px",
    borderRadius: 999,
    border: `2px solid ${COLORS.gold}`,
    background: COLORS.white,
    color: COLORS.textDark,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
  rowAk: { display: "flex", alignItems: "flex-end", gap: 9, maxWidth: "86%" },
  rowStudent: {
    display: "flex",
    justifyContent: "flex-end",
    alignSelf: "flex-end",
    maxWidth: "86%",
  },
  avatar: {
    flexShrink: 0,
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: `linear-gradient(140deg, ${COLORS.gold} 0%, #ffd277 100%)`,
    color: COLORS.forest,
    fontSize: 13,
    fontWeight: 900,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 3px 8px rgba(244,183,64,0.45)",
  },
  bubbleAk: {
    background: COLORS.white,
    color: COLORS.textDark,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "20px 20px 20px 6px",
    padding: "12px 16px",
    fontSize: 15.5,
    lineHeight: 1.55,
    // Content is Markdown (block elements); flow + wrapping handled by `.askak-md`.
    wordBreak: "break-word",
    overflowWrap: "anywhere",
    maxWidth: "100%",
    minWidth: 0,
    boxShadow: "0 4px 14px rgba(26,77,58,0.08)",
  },
  bubbleStudent: {
    background: `linear-gradient(135deg, ${COLORS.forest} 0%, ${COLORS.forestSoft} 100%)`,
    color: COLORS.white,
    borderRadius: "20px 20px 6px 20px",
    padding: "12px 16px",
    fontSize: 15.5,
    lineHeight: 1.55,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    boxShadow: "0 4px 14px rgba(26,77,58,0.22)",
  },
  typing: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "14px 18px",
  },
  inputBar: {
    display: "flex",
    gap: 10,
    padding: "14px 16px",
    background: COLORS.creamSoft,
    borderTop: `1px solid ${COLORS.border}`,
  },
  input: {
    flex: 1,
    padding: "14px 18px",
    borderRadius: 999,
    border: `2px solid ${COLORS.border}`,
    background: COLORS.white,
    color: COLORS.textDark,
    fontSize: 15.5,
    fontWeight: 600,
    outline: "none",
  },
  sendBtn: {
    flexShrink: 0,
    width: 52,
    height: 52,
    borderRadius: "50%",
    border: "none",
    background: `linear-gradient(135deg, ${COLORS.forest} 0%, ${COLORS.forestSoft} 100%)`,
    color: COLORS.white,
    fontSize: 20,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s ease",
  },
  sendBtnDisabled: {
    background: "#c2ccc6",
    cursor: "not-allowed",
    boxShadow: "none",
  },
};
