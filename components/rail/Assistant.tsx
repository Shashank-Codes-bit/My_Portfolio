"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import ChatWindow from "./ChatWindow";
import Composer from "./Composer";
import { useRail } from "./RailProvider";

/**
 * The assistant everywhere except inside the landing hero:
 * a docked composer at the bottom of the viewport, and a modal panel that rises
 * from it holding the same ChatWindow the hero shows. Lives in the layout, so it persists.
 */
export default function Assistant() {
  const pathname = usePathname();
  const { messages, status, heroActive, panelOpen, openPanel, closePanel, ask } = useRail();
  const dockInput = useRef<HTMLInputElement>(null);
  const panelInput = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const [draft, setDraft] = useState(""); // one draft shared by the dock and the panel composer

  // Only real, finished answers count; the sample intro turns never do.
  const answered = messages.filter((m) => m.role === "assistant" && !m.intro && !m.error && !m.streaming).length;
  const dockHidden = (heroActive && pathname === "/") || panelOpen;

  // The panel is a dialog: the page behind it is inert while it is open; focus moves in and is restored on close.
  useEffect(() => {
    const page = [document.getElementById("main"), document.querySelector("header")].filter(Boolean) as HTMLElement[];
    const returnTo = dockInput.current;
    if (panelOpen) {
      page.forEach((el) => el.setAttribute("inert", ""));
      panelInput.current?.focus({ preventScroll: true });
      return () => {
        page.forEach((el) => el.removeAttribute("inert"));
        returnTo?.focus({ preventScroll: true });
      };
    }
  }, [panelOpen]);

  // "/" focuses the right composer; Escape closes the panel.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && panelOpen) {
        closePanel();
        return;
      }
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
      const active = document.activeElement as HTMLElement | null;
      if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.tagName === "SELECT" || active.isContentEditable)) return;
      e.preventDefault();
      if (panelOpen) panelInput.current?.focus();
      else if (heroActive && pathname === "/") document.getElementById("hero-ask")?.focus();
      else dockInput.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panelOpen, closePanel, heroActive, pathname]);

  const sendFromDock = (q: string) => {
    ask(q);
    openPanel();
  };

  // The last finished answer, announced once for screen readers from a single persistent region.
  const lastAnswer = [...messages].reverse().find((m) => m.role === "assistant" && !m.streaming && !m.intro)?.text ?? "";

  return (
    <>
      <div role="status" aria-live="polite" className="sr-only">
        {lastAnswer}
      </div>

      {/* The dock: any interaction opens the panel. */}
      <div className="dock" data-hidden={dockHidden ? "true" : "false"} inert={dockHidden}>
        {answered > 0 ? (
          <div className="dock-note">
            <button type="button" onClick={openPanel}>
              Continue the conversation · {answered} answered
            </button>
          </div>
        ) : null}
        <Composer
          ref={dockInput}
          onSubmit={sendFromDock}
          onFocus={openPanel}
          disabled={status === "streaming"}
          showKbd
          value={draft}
          onChange={setDraft}
        />
      </div>

      {/* The panel */}
      <div className="panel-backdrop" data-open={panelOpen ? "true" : "false"} onClick={closePanel} aria-hidden />
      <section
        ref={panelRef}
        className="panel chatwin on-paper"
        data-open={panelOpen ? "true" : "false"}
        role="dialog"
        aria-modal="true"
        aria-label="Assistant"
        inert={!panelOpen}
      >
        <ChatWindow ref={panelInput} variant="panel" onClose={closePanel} draft={draft} onDraftChange={setDraft} />
      </section>
    </>
  );
}
