import type { Metadata } from "next";
import StackGroup from "@/components/StackGroup";
import Prose, { parseBlocks } from "@/components/Prose";
import { byId, stackGroups } from "@/lib/corpus";
import { portraitSrc } from "@/lib/portrait";
import Portrait from "@/components/Portrait";

const description =
  "Three job titles, one useful combination: Siebel delivery, product work, and building his own things. Background and stack.";

export const metadata: Metadata = {
  title: "About",
  description,
  alternates: { canonical: "/about" },
  openGraph: { title: "About — Shashank Jindal", description, url: "/about" },
};

export default function About() {
  const bg = byId("background")!;
  const blocks = parseBlocks(bg.body);
  const glanceIdx = blocks.findIndex((b) => b.type === "h2" && /at a glance/i.test(b.text));
  const proseBlocks = glanceIdx >= 0 ? blocks.slice(0, glanceIdx) : blocks;
  const glance = glanceIdx >= 0 ? blocks[glanceIdx + 1] : undefined;
  const glanceRows =
    glance?.type === "ul"
      ? glance.items.map((it) => {
          const i = it.indexOf(":");
          return [it.slice(0, i).trim(), it.slice(i + 1).trim()] as const;
        })
      : [];
  const headline = proseBlocks[0]?.type === "h2" ? proseBlocks[0].text : "";
  const paras = proseBlocks.filter((b) => b.type === "p").map((b) => (b.type === "p" ? b.text : ""));

  return (
    <div className="wrap on-paper flex max-w-[880px] flex-col gap-14 py-10 md:py-14">
      <header className="grid items-end gap-8 md:grid-cols-[minmax(0,1fr)_220px]">
        <div className="flex flex-col gap-6">
          <h1 className="max-w-[16ch] text-[42px] md:text-[60px]">{headline}</h1>
          <a href="/Shashank_Jindal_Resume.pdf" className="btn btn-ghost self-start" target="_blank" rel="noopener">
            Resume (PDF)
          </a>
        </div>
        <Portrait src={portraitSrc()} className="max-w-[220px]" priority />
      </header>

      <Prose body={paras.join("\n\n")} className="text-[17.5px]" />

      <section className="flex flex-col gap-6 border-t border-line pt-10">
        <h2 className="text-[30px]">At a glance</h2>
        <dl className="grid max-w-[68ch] grid-cols-1 gap-y-3.5 md:grid-cols-[13ch_1fr] md:gap-x-6 md:gap-y-3">
          {glanceRows.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-[14.5px] font-medium text-ink-3 md:pt-[2px]">{k}</dt>
              <dd className="tabular text-[16.5px] text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="stack" className="flex scroll-mt-6 flex-col gap-7 border-t border-line pt-10">
        <h2 className="text-[30px]">Stack</h2>
        <div className="flex flex-col gap-7">
          {stackGroups.map((g) => (
            <StackGroup key={g.id} entry={g} />
          ))}
        </div>
      </section>
    </div>
  );
}
