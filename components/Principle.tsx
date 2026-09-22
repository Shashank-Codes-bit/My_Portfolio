import { principleNumeral, type Entry } from "@/lib/corpus";
import { parseBlocks } from "./Prose";

/** One of the six principles. The numeral and anchor come from the entry id, so reordering never breaks links. */
export default function Principle({ entry }: { entry: Entry }) {
  const paras = parseBlocks(entry.body)
    .filter((b) => b.type === "p")
    .map((b) => (b.type === "p" ? b.text : ""));
  const id = principleNumeral(entry);
  return (
    <article id={id} className="grid scroll-mt-6 grid-cols-[2.6ch_1fr] gap-x-4 gap-y-3 border-l-2 border-sys pl-5">
      <span className="mono pt-[6px] text-ink-3">{id}</span>
      <div className="flex flex-col gap-3">
        <h2 className="text-[22px] font-semibold tracking-[-0.012em]">{entry.label}</h2>
        {paras.map((p, i) => (
          <p key={i} className="max-w-[38em] text-[16.5px] text-ink-2">
            {p}
          </p>
        ))}
      </div>
    </article>
  );
}
