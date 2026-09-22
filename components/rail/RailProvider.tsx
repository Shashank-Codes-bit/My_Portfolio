"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export type Source = { id: string; label: string; href?: string };
export type Message = {
  id: number;
  role: "user" | "assistant";
  text: string;
  sources?: Source[];
  error?: boolean;
  streaming?: boolean;
  /** Sample turns played on first visit. Shown, but never counted as a real conversation. */
  intro?: boolean;
};
export type IntroTurn = { q: string; a: string; sources: Source[] };

type Rail = {
  messages: Message[];
  status: "idle" | "streaming";
  apiDown: boolean;
  introRunning: boolean;
  /** Play the intro into the shared conversation (typed question, streamed answer). */
  runIntro: (turns: IntroTurn[]) => void;
  /** Put the intro into the conversation instantly, complete. */
  seedIntro: (turns: IntroTurn[]) => void;
  /** Stop a running intro and show it complete (barge-in / skip). */
  finishIntro: () => void;
  /** True while the hero's own chat window is on screen; the dock hides itself. */
  heroActive: boolean;
  setHeroActive: (v: boolean) => void;
  panelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
  ask: (question: string) => void;
  clear: () => void;
};

const RailContext = createContext<Rail | null>(null);

export const useRail = () => {
  const ctx = useContext(RailContext);
  if (!ctx) throw new Error("useRail must be used inside RailProvider");
  return ctx;
};

const sessionId = (): string => {
  try {
    let id = sessionStorage.getItem("rail.session");
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem("rail.session", id);
    }
    return id;
  } catch {
    return "anon";
  }
};

/**
 * Minimal SSE reader over fetch. Normalises CRLF, joins multi-line data with "\n",
 * and flushes whatever is left when the stream ends.
 */
async function readSse(res: Response, onEvent: (event: string, data: unknown) => void, signal: AbortSignal) {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  const dispatch = (block: string) => {
    let event = "message";
    const data: string[] = [];
    for (const line of block.split("\n")) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
    }
    if (!data.length) return;
    try {
      onEvent(event, JSON.parse(data.join("\n")));
    } catch {
      /* ignore malformed frame */
    }
  };
  while (!signal.aborted) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
    let sep: number;
    while ((sep = buf.indexOf("\n\n")) >= 0) {
      dispatch(buf.slice(0, sep));
      buf = buf.slice(sep + 2);
    }
  }
  buf += decoder.decode();
  if (buf.trim()) dispatch(buf);
}

const introMessages = (turns: IntroTurn[], ids: { user: number; bot: number }[]): Message[] =>
  turns.flatMap((t, i) => [
    { id: ids[i].user, role: "user" as const, text: t.q, intro: true },
    { id: ids[i].bot, role: "assistant" as const, text: t.a, sources: t.sources, intro: true },
  ]);

export default function RailProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<"idle" | "streaming">("idle");
  const [apiDown, setApiDown] = useState(false);
  const [heroActive, setHeroActive] = useState(pathname === "/");
  const [panelOpen, setPanelOpen] = useState(false);
  const [introRunning, setIntroRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const nextId = useRef(1);
  const introTimers = useRef<number[]>([]);
  const introTurns = useRef<IntroTurn[]>([]);
  const introIds = useRef<{ user: number; bot: number }[]>([]);
  const introStopped = useRef(false);
  /** Once the visitor clears the conversation, the intro must not come back on the next visit to "/". */
  const introDismissed = useRef(false);

  useEffect(() => {
    setPanelOpen(false);
    if (pathname !== "/") setHeroActive(false);
  }, [pathname]);

  const openPanel = useCallback(() => setPanelOpen(true), []);
  const closePanel = useCallback(() => setPanelOpen(false), []);

  const seedIntro = useCallback((turns: IntroTurn[]) => {
    if (introDismissed.current || !turns.length) return;
    const ids = turns.map(() => ({ user: nextId.current++, bot: nextId.current++ }));
    setMessages((m) => (m.length ? m : introMessages(turns, ids)));
  }, []);

  const finishIntro = useCallback(() => {
    if (!introTurns.current.length) return;
    introStopped.current = true;
    introTimers.current.forEach(window.clearTimeout);
    introTimers.current = [];
    const turns = introTurns.current;
    const ids = introIds.current;
    const introSet = new Set(ids.flatMap((p) => [p.user, p.bot]));
    setMessages((m) => [...introMessages(turns, ids), ...m.filter((x) => !introSet.has(x.id))]);
    introTurns.current = [];
    setIntroRunning(false);
  }, []);

  const runIntro = useCallback((turns: IntroTurn[]) => {
    if (introDismissed.current || !turns.length) return;
    introTurns.current = turns;
    introIds.current = turns.map(() => ({ user: nextId.current++, bot: nextId.current++ }));
    introStopped.current = false;
    setIntroRunning(true);
    const later = (fn: () => void, ms: number) => {
      const t = window.setTimeout(() => {
        if (!introStopped.current) fn();
      }, ms);
      introTimers.current.push(t);
    };
    const patch = (id: number, p: Partial<Message>) => setMessages((m) => m.map((x) => (x.id === id ? { ...x, ...p } : x)));

    const playTurn = (i: number, delay: number) => {
      const turn = turns[i];
      if (!turn) {
        later(() => {
          introTurns.current = [];
          setIntroRunning(false);
        }, 0);
        return;
      }
      const { user, bot } = introIds.current[i];
      const chars = Array.from(turn.q); // never split a surrogate pair while "typing"
      const words = turn.a.split(" ");
      later(() => {
        setMessages((m) => [...m, { id: user, role: "user", text: "", streaming: true, intro: true }]);
        let k = 0;
        const type = () => {
          k++;
          patch(user, { text: chars.slice(0, k).join(""), streaming: k < chars.length });
          if (k < chars.length) later(type, 28 + Math.random() * 40);
          else later(answer, 520);
        };
        const answer = () => {
          setMessages((m) => [...m, { id: bot, role: "assistant", text: "", streaming: true, intro: true }]);
          let n = 0;
          const stream = () => {
            n++;
            patch(bot, { text: words.slice(0, n).join(" ") });
            if (n < words.length) later(stream, 38 + Math.random() * 30);
            else {
              patch(bot, { streaming: false, sources: turn.sources });
              playTurn(i + 1, 2600);
            }
          };
          stream();
        };
        type();
      }, delay);
    };
    playTurn(0, 500);
  }, []);

  const clear = useCallback(() => {
    abortRef.current?.abort();
    introStopped.current = true;
    introDismissed.current = true;
    introTimers.current.forEach(window.clearTimeout);
    introTimers.current = [];
    introTurns.current = [];
    setIntroRunning(false);
    setMessages([]);
    setStatus("idle");
    setPanelOpen(false);
  }, []);

  const ask = useCallback(
    (raw: string) => {
      const question = raw.trim();
      if (!question) return;
      finishIntro();
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      const userId = nextId.current++;
      const botId = nextId.current++;
      setMessages((m) => [
        ...m.map((x) => ({ ...x, streaming: false })),
        { id: userId, role: "user", text: question },
        { id: botId, role: "assistant", text: "", streaming: true },
      ]);
      setStatus("streaming");

      const patch = (p: Partial<Message>) => setMessages((m) => m.map((x) => (x.id === botId ? { ...x, ...p } : x)));

      (async () => {
        try {
          const res = await fetch("/api/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-session": sessionId() },
            body: JSON.stringify({ question, route: pathname }),
            signal: ac.signal,
          });
          if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
          let text = "";
          let finished = false;
          let offline = false;
          await readSse(
            res,
            (event, data) => {
              const d = data as { text?: string; sources?: Source[]; message?: string; code?: string };
              switch (event) {
                case "sources":
                  patch({ sources: d.sources ?? [] });
                  break;
                case "delta":
                  text += d.text ?? "";
                  patch({ text });
                  break;
                case "done":
                  finished = true;
                  text = d.text ?? text;
                  patch({ text, sources: d.sources ?? [], streaming: false });
                  break;
                case "error":
                  finished = true;
                  // A rate-limit refusal is not an outage; only real failures flip apiDown.
                  offline = d.code !== "rate_limited";
                  patch({ text: d.message ?? "Something went wrong.", error: true, streaming: false });
                  break;
              }
            },
            ac.signal,
          );
          if (ac.signal.aborted) return;
          if (!finished) {
            // Upstream dropped mid-answer: say so instead of leaving a half sentence.
            patch({ text: text ? `${text} …` : "", error: !text, streaming: false });
          }
          setApiDown(offline);
        } catch (err) {
          if (ac.signal.aborted) return;
          console.error("[rail]", err);
          setApiDown(true);
          patch({ text: "", error: true, streaming: false });
        } finally {
          if (abortRef.current === ac) setStatus("idle");
        }
      })();
    },
    [pathname, finishIntro],
  );

  const value = useMemo<Rail>(
    () => ({
      messages,
      status,
      apiDown,
      introRunning,
      runIntro,
      seedIntro,
      finishIntro,
      heroActive,
      setHeroActive,
      panelOpen,
      openPanel,
      closePanel,
      ask,
      clear,
    }),
    [messages, status, apiDown, introRunning, runIntro, seedIntro, finishIntro, heroActive, panelOpen, openPanel, closePanel, ask, clear],
  );

  return <RailContext.Provider value={value}>{children}</RailContext.Provider>;
}
