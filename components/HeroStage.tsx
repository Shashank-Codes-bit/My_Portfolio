"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { SITE } from "@/lib/site";
import ChatWindow from "./rail/ChatWindow";
import { useRail, type IntroTurn, type Message } from "./rail/RailProvider";

export type { IntroTurn };

const WORDS = ["I", "build", "AI", "that", "doesn't", "make", "things", "up."];
const EM = new Set(["doesn't"]);
const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

/**
 * The hero: statement on the left, the shared chat window on the right at a fixed height.
 * On first visit the intro plays inside the window (into the shared conversation, so the
 * bottom panel shows it too). Typing interrupts it. Server render shows the intro complete.
 */
export default function HeroStage({ intro, avatar }: { intro: IntroTurn[]; avatar: React.ReactNode }) {
  const { runIntro, seedIntro, finishIntro, setHeroActive } = useRail();
  const windowRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const [mounted, setMounted] = useState(false);

  // Server render and the first client frame show the intro complete, so the page reads without JS
  // and the window never changes shape when the live list takes over.
  const fallback = useMemo<Message[]>(
    () =>
      mounted
        ? []
        : intro.flatMap((t, i) => [
            { id: -(i * 2 + 1), role: "user", text: t.q, intro: true },
            { id: -(i * 2 + 2), role: "assistant", text: t.a, sources: t.sources, intro: true },
          ]),
    [intro, mounted],
  );

  // Decide once: replay the intro (first visit, motion allowed) or seed it complete.
  useEffect(() => {
    setMounted(true);
    if (started.current || !intro.length) return;
    started.current = true;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let seen = false;
    try {
      seen = sessionStorage.getItem("intro.seen") === "1";
      sessionStorage.setItem("intro.seen", "1");
    } catch {
      /* storage unavailable: just play it */
    }
    if (reduce || seen) seedIntro(intro);
    else runIntro(intro);
    // Leaving the page mid-intro completes it rather than letting timers type into a page you can't see.
    return () => finishIntro();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tell the dock when the hero's chat window itself is on screen.
  useEffect(() => {
    const el = windowRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setHeroActive(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [setHeroActive]);

  return (
    <section className="stage">
      <div className="wrap">
        <div className="grid gap-8 pb-14 pt-[92px] lg:grid-cols-[minmax(0,.95fr)_minmax(0,1.05fr)] lg:items-center lg:gap-14">
          <div className="max-w-[820px]">
            <div className="fade-in mb-6 flex items-center gap-3.5" style={delay(200)}>
              {avatar}
              <div className="flex flex-col leading-tight">
                <span className="text-[15px] font-medium text-stage-ink">AI and enterprise systems consultant</span>
                <span className="text-[13.5px] text-stage-dim">New Delhi · open to consulting work and full-time AI roles</span>
              </div>
            </div>
            <h1 className="mb-5 text-[clamp(42px,5.6vw,72px)] leading-[.96]">
              {WORDS.map((w, i) => (
                <span key={w}>
                  <span className="h1-word" style={{ "--i": i } as CSSProperties}>
                    <span className={EM.has(w) ? "h1-em" : undefined}>{w}</span>
                  </span>
                  {i === 3 ? <br /> : " "}
                </span>
              ))}
            </h1>
            <p className="fade-in max-w-[34em] text-[17.5px] leading-[1.6] text-stage-dim" style={delay(550)}>
              {SITE.subline}
            </p>
          </div>

          <div ref={windowRef} className="fade-in chatwin on-paper hero-chat" style={delay(400)}>
            <ChatWindow variant="hero" fallback={fallback} />
          </div>
        </div>
      </div>
    </section>
  );
}
