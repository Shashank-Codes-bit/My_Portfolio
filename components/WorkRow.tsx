import Link from "next/link";
import { kindWord, ownerWord, statusWord, type Entry } from "@/lib/corpus";

/** Landing index row. Status word, owner, name, period, one-line outcome. */
export default function WorkRow({ entry }: { entry: Entry }) {
  const inner = (
    <>
      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="status" data-status={entry.group}>
          {entry.group ? statusWord[entry.group] : ""}
          {kindWord(entry.kind) ? <span className="font-medium text-ink-3"> · {kindWord(entry.kind)}</span> : null}
        </span>
        {ownerWord(entry.owner) ? <span className="tag text-[12.5px]">{ownerWord(entry.owner)}</span> : null}
      </span>
      <h4>{entry.label}</h4>
      {entry.period ? <span className="per">{entry.period}</span> : null}
      <p>
        {entry.summary}
        {!entry.href && entry.stack ? <span className="block text-[13.5px] text-ink-3">{entry.stack.join(", ")}</span> : null}
      </p>
    </>
  );
  if (!entry.href) return <div className="row">{inner}</div>;
  return (
    <Link href={entry.href} className="row">
      {inner}
    </Link>
  );
}
