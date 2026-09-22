/**
 * Anthropic adapter. The only file that knows which provider is behind /api/ask.
 * Server-side only: the SDK reads ANTHROPIC_API_KEY from the environment.
 */
import Anthropic from "@anthropic-ai/sdk";
import { entryIds } from "./corpus";
import { buildPrompt, parseSourcesLine, scanForIds } from "./prompt";

const DEFAULT_MODEL = "claude-sonnet-5";
const STREAM_TIMEOUT_MS = 45_000;

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn("[model] ANTHROPIC_API_KEY is not set: the assistant will answer only from the deny-list and pregenerated answers.");
}

export class ModelError extends Error {
  status?: number;
  aborted?: boolean;
  constructor(message: string, status?: number, aborted = false) {
    super(message);
    this.status = status;
    this.aborted = aborted;
  }
}

let client: Anthropic | undefined;
const getClient = (): Anthropic => {
  if (!process.env.ANTHROPIC_API_KEY) throw new ModelError("ANTHROPIC_API_KEY is not set");
  client ??= new Anthropic({ timeout: 30_000, maxRetries: 1 });
  return client;
};

/** Most specific first. APIConnectionError and APIUserAbortError both extend APIError. */
const toModelError = (err: unknown): ModelError => {
  if (err instanceof ModelError) return err;
  if (err instanceof Anthropic.APIUserAbortError) return new ModelError("aborted", undefined, true);
  if (err instanceof Anthropic.AuthenticationError) return new ModelError("Anthropic: invalid API key", 401);
  if (err instanceof Anthropic.RateLimitError) return new ModelError("Anthropic: rate limited", 429);
  if (err instanceof Anthropic.APIConnectionError) return new ModelError(`Anthropic: connection error (${err.message})`);
  if (err instanceof Anthropic.APIError) return new ModelError(`Anthropic ${err.status ?? ""}: ${err.message}`, err.status);
  if (err instanceof Error && err.name === "AbortError") return new ModelError("aborted", undefined, true);
  return new ModelError(err instanceof Error ? err.message : String(err));
};

const shouldLog = () => process.env.NODE_ENV !== "production" || (process.env.ASK_LOG ?? "0") !== "0";

/** Yields raw text deltas from the model. Throws ModelError on any upstream problem. */
export async function* streamModel(question: string, route: string | undefined, signal?: AbortSignal): AsyncGenerator<string> {
  const anthropic = getClient();
  const { system, user } = buildPrompt(question, route);
  // The SDK timeout covers time-to-headers only; this one bounds the whole stream.
  const deadline = AbortSignal.timeout(STREAM_TIMEOUT_MS);
  const combined = signal ? AbortSignal.any([signal, deadline]) : deadline;

  try {
    const stream = anthropic.messages.stream(
      {
        model: process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL,
        // Thinking tokens count against max_tokens; leave real room so a short answer is never cut.
        max_tokens: 2000,
        thinking: { type: "adaptive" },
        output_config: { effort: "low" },
        // The system block (rules + whole corpus) is byte-identical on every call; cache it for an hour.
        system: [{ type: "text", text: system, cache_control: { type: "ephemeral", ttl: "1h" } }],
        messages: [{ role: "user", content: user }],
      },
      { signal: combined },
    );

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") yield event.delta.text;
    }

    const final = await stream.finalMessage();
    if (shouldLog()) {
      const u = final.usage;
      console.log(
        `[ask] usage in=${u.input_tokens} cache_read=${u.cache_read_input_tokens ?? 0} cache_write=${u.cache_creation_input_tokens ?? 0} out=${u.output_tokens} stop=${final.stop_reason}${
          final.stop_reason === "refusal" && final.stop_details ? ` category=${final.stop_details.category ?? "?"}` : ""
        }`,
      );
    }
    if (final.stop_reason === "refusal") throw new ModelError("model refused the request", 200);
    if (final.stop_reason === "max_tokens") throw new ModelError("answer cut off at max_tokens", 200);
  } catch (err) {
    throw toModelError(err);
  }
}

export type Answer = { text: string; sources: string[] };

/**
 * Wraps streamModel with the sources-line protocol.
 * Calls onSources once the first line is parsed and onDelta for each visible text chunk.
 * Resolves with the full answer.
 */
export async function answerQuestion(
  question: string,
  route: string | undefined,
  hooks: { onSources?: (ids: string[]) => void; onDelta?: (text: string) => void; signal?: AbortSignal } = {},
): Promise<Answer> {
  let head = ""; // text before the first newline
  let headDone = false;
  let sources: string[] | undefined;
  let text = "";
  const emit = (chunk: string) => {
    if (chunk) hooks.onDelta?.(stripIds(chunk));
  };

  for await (const chunk of streamModel(question, route, hooks.signal)) {
    if (headDone) {
      text += chunk;
      emit(chunk);
      continue;
    }
    head += chunk;
    const nl = head.indexOf("\n");
    if (nl < 0) {
      // Still no newline. If the head is clearly not a sources line, stop waiting.
      if (head.length > 120 && !/^\s*sources?\s*:/i.test(head)) {
        headDone = true;
        text = head;
        emit(head);
      }
      continue;
    }
    const firstLine = head.slice(0, nl);
    const rest = head.slice(nl + 1).replace(/^\s*\n/, "");
    headDone = true;
    sources = parseSourcesLine(firstLine);
    if (sources) {
      hooks.onSources?.(sources);
      text = rest;
      emit(rest);
    } else {
      text = head;
      emit(head);
    }
  }

  if (!headDone) {
    // Whole answer arrived without a newline.
    const parsed = parseSourcesLine(head);
    if (parsed) {
      sources = parsed;
      hooks.onSources?.(parsed);
      text = "";
    } else {
      text = head;
      emit(head);
    }
  }

  return { text: stripIds(text).trim(), sources: sources ?? scanForIds(text) };
}

/**
 * Safety net: remove entry ids the model wrote into the prose, e.g. "(work.voltas)" or
 * "(work.airtel, work.fuso)" or a bare "work.hero". Built from the real id list, so
 * ordinary parentheticals like "(node.js)" or "(e.g.)" are left alone.
 */
// Only dotted ids: "hero", "contact", "assistant" are ordinary words and must never be touched.
const ID_ALT = entryIds
  .filter((id) => id.includes("."))
  .map((id) => id.replace(/\./g, "\\."))
  .join("|");
const PAREN_IDS = new RegExp(`\\s*\\(\\s*(?:${ID_ALT})(?:\\s*,\\s*(?:${ID_ALT}))*\\s*\\)`, "g");
const BARE_IDS = new RegExp(`\\b(?:${ID_ALT})\\b`, "g");
export const stripIds = (text: string): string =>
  text
    .replace(PAREN_IDS, "")
    .replace(BARE_IDS, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([.,;:])/g, "$1");
