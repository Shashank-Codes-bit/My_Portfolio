import Link from "next/link";
import { kindWord, ownerWord, statusWord, type Entry } from "@/lib/corpus";
import Prose from "./Prose";

export default function CaseStudy({ entry, prev, next }: { entry: Entry; prev?: Entry; next?: Entry }) {
  return (
    <article className="wrap on-paper flex max-w-[880px] flex-col gap-12 py-10 md:py-14">
      <Link href="/#work" className="text-[15px] font-medium text-ink-2 hover:text-ink">
        <span aria-hidden>← </span>All work
      </Link>

      <header className="flex flex-col gap-5">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="status" data-status={entry.group}>
            {entry.group ? statusWord[entry.group] : ""}
          </span>
          {kindWord(entry.kind) ? <span className="text-[13.5px] font-medium text-ink-3">{kindWord(entry.kind)}</span> : null}
          {entry.period ? <span className="mono text-ink-3">{entry.period}</span> : null}
          {ownerWord(entry.owner, true) ? <span className="tag text-[12.5px]">{ownerWord(entry.owner, true)}</span> : null}
        </div>
        <h1 className="text-[42px] md:text-[60px]">{entry.label}</h1>
        <p className="max-w-[34em] text-[19px] leading-[1.5] text-ink-2 md:text-[21px]">{entry.summary}</p>
        {entry.role ? <p className="text-[14.5px] font-medium text-ink-3">{entry.role}</p> : null}
      </header>

      <Prose body={entry.body} skipFirstParagraph className="text-[17.5px]" />

      {entry.stack?.length ? (
        <section className="flex flex-col gap-4 border-t border-line pt-8">
          <h2 className="text-[18px] font-semibold">Stack</h2>
          <ul className="flex flex-wrap gap-2">
            {entry.stack.map((s) => (
              <li key={s} className="tag">
                {s}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {entry.links?.length ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-[18px] font-semibold">Links</h2>
          <ul className="flex flex-wrap gap-3">
            {entry.links.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="btn btn-ghost" target="_blank" rel="noopener">
                  {l.label}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <nav aria-label="Walk the case studies" className="grid grid-cols-2 gap-6 border-t border-line pt-8">
        <div>
          {prev ? (
            <Link href={prev.href!} className="group flex flex-col gap-1">
              <span className="text-[13.5px] font-medium text-ink-3">Previous</span>
              <span className="text-[17px] font-semibold text-ink group-hover:text-sys">{prev.label}</span>
            </Link>
          ) : null}
        </div>
        <div className="text-right">
          {next ? (
            <Link href={next.href!} className="group flex flex-col items-end gap-1">
              <span className="text-[13.5px] font-medium text-ink-3">Next</span>
              <span className="text-[17px] font-semibold text-ink group-hover:text-sys">{next.label}</span>
            </Link>
          ) : null}
        </div>
      </nav>
    </article>
  );
}
