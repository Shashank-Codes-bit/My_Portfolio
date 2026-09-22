"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { SITE } from "@/lib/site";
import Composer from "./Composer";
import Message from "./Message";
import Suggestions from "./Suggestions";
import { useRail, type Message as Msg } from "./RailProvider";

type Props = {
  variant: "hero" | "panel";
  onClose?: () => void;
  /** Rendered instead of the live list while it is empty (server render, before the intro starts). */
  fallback?: Msg[];
  /** Controlled draft shared with another composer (the dock). */
  draft?: string;
  onDraftChange?: (v: string) => void;
};

/**
 * The one chat window. Rendered in the hero (static, fixed height) and as the
 * bottom panel (fixed position). Same header, body, composer and footer; same
 * shared conversation from RailProvider.
 */
const ChatWindow = forwardRef<HTMLInputElement, Props>(function ChatWindow({ variant, onClose, fallback, draft, onDraftChange }, inputRef) {
  const { messages, status, apiDown, introRunning, finishIntro, ask, clear } = useRail();
  const bodyRef = useRef<HTMLDivElement>(null);
  const stick = useRef(true); // follow the newest words only while the reader is already at the bottom
  const [, force] = useState(0);
  const list = messages.length ? messages : (fallback ?? []);
  const conversing = messages.length > 0;

  useEffect(() => {
    const el = bodyRef.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const onScroll = () => {
    const el = bodyRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
    if (nearBottom !== stick.current) {
      stick.current = nearBottom;
      force((n) => n + 1);
    }
  };

  return (
    <>
      <div className="panel-head">
        <div className="flex items-baseline gap-2">
          <span className="text-[15px] font-semibold">Assistant</span>
          <span className="hidden text-[13px] text-ink-3 sm:inline">answers as me, only from this site, and cites it</span>
        </div>
        <div className="flex items-center gap-4">
          {conversing ? (
            <button type="button" onClick={clear} className="text-btn">
              Clear
            </button>
          ) : null}
          {variant === "panel" && onClose ? (
            <button type="button" onClick={onClose} className="text-btn">
              Close
            </button>
          ) : null}
        </div>
      </div>

      <div ref={bodyRef} onScroll={onScroll} className="panel-body">
        {list.length ? (
          list.map((m) => <Message key={m.id} message={m} />)
        ) : (
          <>
            <p className="text-[14.5px] text-ink-2">Ask me anything about my work. Try one of these, or type your own.</p>
            <Suggestions onPick={ask} />
          </>
        )}
        {introRunning ? (
          <button type="button" onClick={finishIntro} className="justify-self-start text-[12.5px] font-medium text-ink-3 underline underline-offset-[3px]">
            Skip the intro
          </button>
        ) : null}
        {apiDown ? (
          <p className="border-t border-line pt-4 text-[14.5px] leading-[1.55] text-ink-2">
            The assistant is offline right now. Everything it would have told you is on the pages themselves, and I read email:{" "}
            <a className="link" href={`mailto:${SITE.email}`}>
              {SITE.email}
            </a>
            .
          </p>
        ) : null}
      </div>

      <div className="panel-foot">
        {conversing && !introRunning && status === "idle" ? <Suggestions onPick={ask} compact /> : null}
        <Composer
          ref={inputRef}
          onSubmit={ask}
          onTyping={introRunning ? finishIntro : undefined}
          disabled={status === "streaming"}
          placeholder={conversing ? "Ask a follow-up…" : "Ask about my work…"}
          id={variant === "hero" ? "hero-ask" : undefined}
          value={draft}
          onChange={onDraftChange}
        />
        <p className="text-[12.5px] text-ink-3">
          Not covered here? Email{" "}
          <a className="link" href={`mailto:${SITE.email}`}>
            {SITE.email}
          </a>
          .
        </p>
      </div>
    </>
  );
});

export default ChatWindow;
