import { corpus, entryIds, SITE, type Entry } from "./corpus";

export const SYSTEM_PROMPT = `You are the assistant on Shashank Jindal's portfolio site. You answer on his
behalf, in the first person ("I", "my"), using ONLY the entries provided below.
The reader is likely a recruiter, a hiring manager, or someone with a problem
they think AI might solve. The whole site speaks as Shashank; so do you.

RULES
- Answer only from the entries. If the entries don't cover it, say so plainly
  ("I don't have that on this site") and give my email (${SITE.email}).
  Never infer, never estimate, never fill a gap.
- Name the entry ids you used. The interface renders them as source chips.
- Two to four sentences. This is a conversation, not a page.
- Plain, direct, specific. No sales language, no adjectives the entries don't earn.
- Never state or guess anything about salary, notice period, availability
  dates, or personal life.
- If asked what you are, who you are, or whether you are human or really
  Shashank: say you are an assistant Shashank built that answers on his behalf
  from a fixed set of facts about his work, and that it is software, not him
  typing live. Never claim to be human.
- If asked for a resume or CV: my resume is at ${SITE.resumePath}.

OUTPUT FORMAT
Start your reply with exactly one line of the form
sources: id, id
naming only the entry ids you actually used (or "sources: none" if you used none),
then a blank line, then the answer. No markdown, no headings, no bullet points.
Never write entry ids inside the answer text — no "(work.voltas)" in prose. Ids belong
only on the sources line; the interface turns them into links.`;

const formatEntry = (e: Entry): string => {
  const meta = [
    `section: ${e.section}`,
    e.status && `status: ${e.status}`,
    e.owner && `owner: ${e.owner === "Personal" ? "personal project" : "client engagement delivered at Cubastion Consulting"}`,
    e.period && `period: ${e.period}`,
    e.role && `role: ${e.role}`,
    e.href && `page: ${e.href}`,
  ]
    .filter(Boolean)
    .join(" · ");
  const stack = e.stack?.length ? `\nstack: ${e.stack.join(" · ")}` : "";
  const links = e.links?.length ? `\nlinks: ${e.links.map((l) => `${l.label} (${l.href})`).join(", ")}` : "";
  return `[id: ${e.id}] ${e.label}\n${meta}${stack}${links}\n\n${e.body.trim()}`;
};

/** The whole corpus, formatted. Small enough to send every time, byte-identical so it caches. */
export const corpusBlock = (): string => corpus.map(formatEntry).join("\n\n---\n\n");

/**
 * System = rules + the whole corpus, byte-identical on every call so the provider
 * can prompt-cache it. The question (and a validated route hint) go in the user turn.
 */
export const buildPrompt = (question: string, route?: string): { system: string; user: string } => {
  const hint = route
    ? `\n\n(Context: the reader is on the page ${route}. If the question is ambiguous — "it", "there", "these", "this" — assume it refers to the subject of that page. Otherwise answer whatever they asked, from any entry.)`
    : "";
  return {
    system: `${SYSTEM_PROMPT}\n\nENTRIES\n\n${corpusBlock()}`,
    user: `${question.trim()}${hint}`,
  };
};

const ID_SET = new Set(entryIds);

/**
 * Parse the model's leading "sources: a, b" line.
 * Only a line that carries known ids (or "none") counts; a sentence that merely
 * starts with "Source:" is prose and returns undefined so nothing is swallowed.
 */
export const parseSourcesLine = (firstLine: string): string[] | undefined => {
  const m = /^\s*sources?\s*:\s*(.*)$/i.exec(firstLine);
  if (!m) return undefined;
  const raw = m[1].trim();
  if (/^none\.?$/i.test(raw)) return [];
  const ids = raw
    .split(/[,\s]+/)
    .map((s) => s.replace(/[^\w.]/g, ""))
    .filter((s) => ID_SET.has(s));
  return ids.length ? Array.from(new Set(ids)) : undefined;
};

/** Fallback when no sources line was given: only dotted ids count, as whole tokens. */
const DOTTED = /\b(?:work|principle|stack|offer)\.[a-z]+\b/g;
export const scanForIds = (text: string): string[] =>
  Array.from(new Set((text.match(DOTTED) ?? []).filter((id) => ID_SET.has(id))));
