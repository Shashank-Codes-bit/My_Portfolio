import Link from "next/link";
import { principleNumeral, principles } from "@/lib/corpus";
import { parseBlocks } from "./Prose";
import Reveal from "./Reveal";

/** The six principles, headline plus first sentence, as the answer to "How do you build?" */
export function HowTeaser() {
  return (
    <>
      {principles.map((p, i) => {
        const para = parseBlocks(p.body).find((b) => b.type === "p");
        const first = para?.type === "p" ? para.text.split(/(?<=\.)\s/)[0] : "";
        return (
          <Reveal key={p.id} delay={i * 60}>
            <Link href={p.href ?? "/how-i-build"} className="group grid grid-cols-[2.4ch_1fr] gap-x-3">
              <span className="mono pt-[5px] text-ink-3">{principleNumeral(p)}</span>
              <span>
                <span className="block text-[19px] font-semibold leading-[1.3] text-ink transition-colors group-hover:text-sys">{p.label}</span>
                <span className="block max-w-[38em] text-[15.5px] text-ink-2">{first}</span>
              </span>
            </Link>
          </Reveal>
        );
      })}
      <Reveal delay={380}>
        <Link href="/how-i-build" className="btn btn-ghost">
          Read all six, with my arguments
        </Link>
      </Reveal>
    </>
  );
}

/** The photo and three lines of background, as the answer to "Who are you?" */
export function AboutTeaser({ portrait }: { portrait?: React.ReactNode }) {
  return (
    <>
      {portrait ? <Reveal className="max-w-[260px]">{portrait}</Reveal> : null}
      <Reveal>
        <p className="max-w-[38em] text-[18px] leading-[1.55] text-ink">
          Three job titles, one useful combination: someone who can work out what's worth automating, who already knows what the
          system underneath will allow, and who can then go and build it.
        </p>
      </Reveal>
      <Reveal delay={80}>
        <dl className="grid max-w-[38em] grid-cols-[9ch_1fr] gap-x-6 gap-y-2 text-[15.5px]">
          <dt className="text-ink-3">Now</dt>
          <dd>Senior Associate Consultant, Cubastion Consulting, since October 2023</dd>
          <dt className="text-ink-3">Accounts</dt>
          <dd>Mitsubishi Fuso, Airtel, Hero, Voltas</dd>
          <dt className="text-ink-3">Product</dt>
          <dd>35+ initiatives scoped, 20+ PRDs shipped</dd>
          <dt className="text-ink-3">Own</dt>
          <dd>Dhobi Dash, seven shops on monthly retainers</dd>
        </dl>
      </Reveal>
      <Reveal delay={160}>
        <Link href="/about" className="btn btn-ghost">
          Background and stack
        </Link>
      </Reveal>
    </>
  );
}
