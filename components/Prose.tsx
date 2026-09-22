import type { ReactNode } from "react";

/**
 * Minimal renderer for corpus bodies. Supports:
 *   "## Heading" lines, blank-line paragraphs, "- " bullets, "> " quotes,
 *   **bold** and `code` inline. No markdown library.
 */

const inline = (text: string): ReactNode[] => {
  const parts: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) parts.push(<strong key={k++}>{tok.slice(2, -2)}</strong>);
    else parts.push(<code key={k++}>{tok.slice(1, -1)}</code>);
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
};

type Block =
  | { type: "h2"; text: string }
  | { type: "p"; text: string }
  | { type: "quote"; text: string }
  | { type: "ul"; items: string[] };

export const parseBlocks = (body: string): Block[] => {
  const blocks: Block[] = [];
  const chunks = body.trim().split(/\n\s*\n/);
  for (const chunk of chunks) {
    const lines = chunk.split("\n");
    if (lines.every((l) => l.startsWith("- "))) {
      blocks.push({ type: "ul", items: lines.map((l) => l.slice(2)) });
      continue;
    }
    if (lines.every((l) => l.startsWith("> "))) {
      blocks.push({ type: "quote", text: lines.map((l) => l.slice(2)).join(" ") });
      continue;
    }
    if (lines[0].startsWith("## ")) {
      blocks.push({ type: "h2", text: lines[0].slice(3) });
      const rest = lines.slice(1).join(" ").trim();
      if (rest) blocks.push({ type: "p", text: rest });
      continue;
    }
    blocks.push({ type: "p", text: lines.join(" ") });
  }
  return blocks;
};

export default function Prose({
  body,
  className = "",
  skipFirstParagraph = false,
}: {
  body: string;
  className?: string;
  /** Case studies print the summary in the header, so the leading paragraph is skipped. */
  skipFirstParagraph?: boolean;
}) {
  let blocks = parseBlocks(body);
  if (skipFirstParagraph && blocks[0]?.type === "p") blocks = blocks.slice(1);
  return (
    <div className={`prose ${className}`}>
      {blocks.map((b, i) => {
        switch (b.type) {
          case "h2":
            return <h2 key={i}>{inline(b.text)}</h2>;
          case "quote":
            return <blockquote key={i}>{inline(b.text)}</blockquote>;
          case "ul":
            return (
              <ul key={i}>
                {b.items.map((it, j) => (
                  <li key={j}>{inline(it)}</li>
                ))}
              </ul>
            );
          default:
            return <p key={i}>{inline(b.text)}</p>;
        }
      })}
    </div>
  );
}
