"use client";

import { forwardRef, useState, type FormEvent } from "react";

export const SendIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 10h11M11 5l5 5-5 5" />
  </svg>
);

type Props = {
  onSubmit: (text: string) => void;
  onTyping?: () => void;
  onFocus?: () => void;
  disabled?: boolean;
  placeholder?: string;
  showKbd?: boolean;
  id?: string;
  /** Controlled draft, so two composers (dock + panel) can share one text. */
  value?: string;
  onChange?: (v: string) => void;
};

/**
 * The one input on the site. Stage or paper styling comes from the surrounding `.on-paper`.
 * The arrow is never inert: with an empty box it acts like a click on the composer (onFocus);
 * with text it sends. Disabled only while an answer streams.
 */
const Composer = forwardRef<HTMLInputElement, Props>(function Composer(
  { onSubmit, onTyping, onFocus, disabled, placeholder = "Ask about my work…", showKbd, id, value, onChange },
  ref,
) {
  const [local, setLocal] = useState("");
  const draft = value ?? local;
  const setDraft = onChange ?? setLocal;
  const hasText = draft.trim().length > 0;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!hasText || disabled) return;
    onSubmit(draft.trim());
    setDraft("");
  };

  return (
    <form onSubmit={submit} className="composer" aria-label="Ask the assistant">
      <input
        ref={ref}
        id={id}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          if (e.target.value) onTyping?.();
        }}
        onFocus={onFocus}
        placeholder={placeholder}
        aria-label="Ask about Shashank's work"
        maxLength={500}
        autoComplete="off"
        enterKeyHint="send"
      />
      {showKbd ? <span className="kbd hidden sm:inline" aria-hidden>/</span> : null}
      <button
        type={hasText ? "submit" : "button"}
        className="send"
        disabled={disabled}
        aria-label={hasText ? "Send" : "Open the assistant"}
        onClick={
          hasText
            ? undefined
            : () => {
                onFocus?.();
                if (ref && typeof ref !== "function") ref.current?.focus();
              }
        }
      >
        <SendIcon />
      </button>
    </form>
  );
});

export default Composer;
