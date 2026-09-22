import { NextResponse } from "next/server";
import { resolveSources, SITE, validRoutes } from "@/lib/corpus";
import { checkDenylist } from "@/lib/denylist";
import { matchCanned } from "@/lib/canned";
import { lookupAnswer } from "@/lib/answers";
import { answerQuestion, ModelError } from "@/lib/model";
import { allowModelCall, allowRequest, clientIp, refundModelCall } from "@/lib/ratelimit";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 4096;
const UPSTREAM_TIMEOUT_MS = 60_000;

const enc = new TextEncoder();
const sse = (event: string, data: unknown) => enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

const sseHeaders = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-store, no-transform",
  "X-Accel-Buffering": "no",
};

/** One-shot SSE response: a single `done` or `error` event. Used for canned and refused answers. */
const oneShot = (event: "done" | "error", payload: unknown) =>
  new Response(
    new ReadableStream({
      start(c) {
        c.enqueue(sse(event, payload));
        c.close();
      },
    }),
    { headers: sseHeaders },
  );

const TOO_MANY = `Too many questions for now. Email me instead: ${SITE.email}`;

export async function POST(req: Request) {
  // Only this site may call the assistant; browsers send Sec-Fetch-Site on every fetch.
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) return NextResponse.json({ error: "Body too large" }, { status: 413 });

  let body: { question?: unknown; route?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const question = typeof body.question === "string" ? body.question.trim() : "";
  // The route is a hint only, and only known routes are accepted; anything else is dropped.
  const route = typeof body.route === "string" && validRoutes.has(body.route) ? body.route : undefined;
  if (!question || question.length > 500) {
    return NextResponse.json({ error: "question must be 1–500 characters" }, { status: 400 });
  }

  const ip = clientIp(req);
  if (!allowRequest(ip)) return oneShot("error", { message: TOO_MANY, code: "rate_limited" });

  // 1. Deny-list: never reaches the model.
  const denied = checkDenylist(question);
  if (denied) {
    log("deny", denied.id, question);
    return oneShot("done", { text: denied.response, sources: [] });
  }

  // 2. Canned: served from data/answers.json, no model call.
  const canned = matchCanned(question, route);
  if (canned) {
    const stored = lookupAnswer(canned.question, route);
    if (stored) {
      log("canned", canned.via, question);
      return oneShot("done", { text: stored.text, sources: resolveSources(stored.sources) });
    }
  }

  // 3. Model.
  const sessionId = `${ip}:${(req.headers.get("x-session") ?? "").slice(0, 64)}`;
  if (!allowModelCall(sessionId)) return oneShot("error", { message: TOO_MANY, code: "rate_limited" });

  log("model", route ?? "-", question);
  const abort = new AbortController();
  req.signal.addEventListener("abort", () => abort.abort());
  const timeout = setTimeout(() => abort.abort(new Error("upstream timeout")), UPSTREAM_TIMEOUT_MS);

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(sse(event, data));
        } catch {
          /* client went away */
        }
      };
      try {
        const answer = await answerQuestion(question, route, {
          signal: abort.signal,
          onSources: (ids) => send("sources", { sources: resolveSources(ids) }),
          onDelta: (text) => send("delta", { text }),
        });
        send("done", { text: answer.text, sources: resolveSources(answer.sources) });
      } catch (err) {
        if (req.signal.aborted) return; // the visitor moved on; nothing to report
        const e = err instanceof ModelError ? err : new ModelError(String(err));
        if (!e.status) refundModelCall(sessionId); // configuration or network failure, not a served call
        console.error("[ask] model error:", e.message);
        send("error", { message: `The assistant is unavailable right now. Email me instead: ${SITE.email}`, code: "unavailable" });
      } finally {
        clearTimeout(timeout);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
    cancel() {
      abort.abort();
    },
  });

  return new Response(stream, { headers: sseHeaders });
}

/**
 * ASK_LOG unset: kinds only. ASK_LOG=1: kinds + usage. ASK_LOG=2: also the question text (dev default).
 * Question text is personal data; it is never logged in production unless explicitly asked for.
 */
function log(kind: string, detail: string, question: string) {
  const level = process.env.ASK_LOG ?? (process.env.NODE_ENV === "production" ? "0" : "2");
  if (level === "0") return;
  console.log(`[ask] ${kind} (${detail})${level === "2" ? ` "${question.slice(0, 80)}"` : ` len=${question.length}`}`);
}
