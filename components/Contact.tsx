import { SITE } from "@/lib/site";
import Reveal from "./Reveal";

/** The answer to "How do I reach you?" */
export default function Contact() {
  const rows: [string, React.ReactNode][] = [
    ["Email", <a key="e" className="link break-anywhere" href={`mailto:${SITE.email}`}>{SITE.email}</a>],
    ["Phone", <a key="p" className="link" href={`tel:${SITE.phone.replace(/\s+/g, "")}`}>{SITE.phone}</a>],
    ["LinkedIn", <a key="l" className="link break-anywhere" href={SITE.linkedin}>{SITE.linkedinHandle}</a>],
    ["GitHub", <a key="g" className="link break-anywhere" href={SITE.github}>{SITE.githubHandle}</a>],
  ];
  return (
    <>
      <Reveal>
        <p className="max-w-[34em] text-[19px] leading-[1.5] text-ink">
          If you're weighing up an AI project, I'll tell you honestly whether it's worth building. That conversation is free and
          usually short. If it is worth building, we can talk about how. If it isn't, you've saved a quarter.
        </p>
      </Reveal>
      <Reveal delay={80}>
        <div className="flex flex-wrap gap-3">
          <a href={`mailto:${SITE.email}?subject=${encodeURIComponent("Start a conversation")}`} className="btn btn-primary">
            Start a conversation
          </a>
          <a href={SITE.linkedin} className="btn btn-ghost">
            LinkedIn
          </a>
          <a href={SITE.resumePath} className="btn btn-ghost" target="_blank" rel="noopener">
            Resume<span className="sr-only"> (opens a PDF in a new tab)</span>
          </a>
        </div>
      </Reveal>
      <Reveal delay={160}>
        <dl className="grid max-w-[38em] grid-cols-1 gap-x-6 gap-y-2 text-[15.5px] sm:grid-cols-[8ch_1fr]">
          {rows.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-ink-3">{k}</dt>
              <dd className="tabular min-w-0">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-5 text-[14px] font-medium text-ink-2">
          {SITE.location}. {SITE.availability}.
        </p>
      </Reveal>
    </>
  );
}
