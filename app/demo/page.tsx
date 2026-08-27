"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";

type Msg = { role: "user" | "assistant" | "error"; content: string };

export default function DemoPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(async () => {
    if (!input.trim() || streaming) return;
    const userMsg: Msg = { role: "user", content: input };
    setMessages((m) => [...m, userMsg, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
        signal: ctrl.signal,
      });

      if (!res.ok || !res.body) {
        const err = await res.text().catch(() => "unknown_error");
        setMessages((m) => [...m.slice(0, -1), { role: "error", content: err }]);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "text") {
              acc += parsed.text;
              setMessages((m) => [...m.slice(0, -1), { role: "assistant", content: acc }]);
            }
          } catch {
            /* keep-alive comment or malformed line — skip */
          }
        }
      }
    } catch (e) {
      const msg = (e as Error).name === "AbortError" ? "aborted" : (e as Error).message;
      setMessages((m) => [...m.slice(0, -1), { role: "error", content: msg }]);
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [input, messages, streaming]);

  return (
    <main className="container">
      <p><Link href="/">← back</Link></p>
      <h1 style={{ fontSize: 28 }}>Chat with Claude (SSE, resumable)</h1>
      <p className="muted">
        This demo talks to <code>/api/chat</code>. Try mid-stream cancel with the button.
      </p>

      <div className="chat">
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            {m.content || (m.role === "assistant" && streaming ? "…" : "")}
          </div>
        ))}
      </div>

      <div className="composer">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) send();
          }}
          placeholder="Ask something…"
          disabled={streaming}
        />
        {streaming ? (
          <button className="btn secondary" onClick={() => abortRef.current?.abort()}>Cancel</button>
        ) : (
          <button className="btn" onClick={send} disabled={!input.trim()}>Send</button>
        )}
      </div>
    </main>
  );
}
