"use client";
import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/chat";

export function WorldChat({
  messages,
  online,
  active = true,
  onSend,
}: {
  messages: ChatMessage[];
  online: boolean;
  active?: boolean;
  onSend(text: string): Promise<void>;
}) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const list = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  const composing = useRef(false);
  useEffect(() => {
    if (active && atBottom.current && list.current)
      list.current.scrollTop = list.current.scrollHeight;
  }, [messages, active]);
  async function send() {
    if (sending || !online || !draft.trim() || composing.current) return;
    setSending(true);
    setError("");
    try {
      await onSend(draft);
      setDraft("");
      atBottom.current = true;
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "전송하지 못했어요. 다시 시도해 주세요.",
      );
    } finally {
      setSending(false);
    }
  }
  return (
    <section className="world-chat" aria-label="월드 전체 채팅">
      <div className="chat-heading">
        <h2>
          <span>◌</span> 모닥불 채팅
        </h2>
        <span className="tag">WORLD</span>
      </div>
      <p className="chat-notice">
        접속 중 대화만 표시 · 기록은 저장되지 않아요
      </p>
      <div
        className="chat-messages"
        ref={list}
        role="log"
        aria-label="채팅 메시지"
        aria-live="polite"
        aria-relevant="additions"
        onScroll={() => {
          const el = list.current;
          if (active && el)
            atBottom.current =
              el.scrollHeight - el.scrollTop - el.clientHeight < 40;
        }}
      >
        {!messages.length && (
          <div className="chat-empty">
            <span>☕</span>
            <p>작은 인사로 시작하는 모험.</p>
            <small>함께 있는 동료에게 말을 걸어보세요.</small>
          </div>
        )}
        {messages.map((m) => (
          <article className="chat-message" key={`${m.session_id}:${m.id}`}>
            <header>
              <strong>{m.nickname}</strong>
              <time>
                {new Date(m.receivedAt).toLocaleTimeString("ko-KR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
              </time>
            </header>
            <p>{m.text}</p>
          </article>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <label className="sr-only" htmlFor="world-chat-input">
          월드에 메시지 보내기
        </label>
        <div className="chat-compose">
          <input
            id="world-chat-input"
            autoComplete="off"
            maxLength={200}
            value={draft}
            readOnly={sending}
            placeholder={
              online
                ? "모두에게 인사해 보세요…"
                : "다시 연결되면 보낼 수 있어요"
            }
            onChange={(e) => setDraft(e.target.value)}
            onCompositionStart={() => {
              composing.current = true;
            }}
            onCompositionEnd={() => {
              composing.current = false;
            }}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Escape") e.currentTarget.blur();
              if (
                e.key === "Enter" &&
                (e.nativeEvent.isComposing ||
                  composing.current ||
                  e.keyCode === 229)
              )
                e.preventDefault();
            }}
          />
          <button
            type="submit"
            aria-label="메시지 전송"
            disabled={!online || sending || !draft.trim()}
          >
            ↑
          </button>
        </div>
        <div className="chat-input-note">
          <span>{sending ? "전송 중…" : "Enter 전송 · 1초 간격"}</span>
          <span>{draft.length}/200</span>
        </div>
        {error && (
          <p className="chat-error" role="alert">
            {error}
          </p>
        )}
      </form>
    </section>
  );
}
