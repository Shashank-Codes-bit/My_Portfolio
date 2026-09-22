import { offers } from "@/lib/corpus";
import { parseBlocks } from "./Prose";
import Reveal from "./Reveal";

/** The three offers, as the answer to "What do you actually build?" Copy comes straight from the corpus. */
export default function Offers() {
  const closing = parseBlocks(offers[offers.length - 1]?.body ?? "").filter((b) => b.type === "p").at(-1);
  return (
    <>
      {offers.map((o, i) => {
        const blocks = parseBlocks(o.body);
        const heading = blocks[0]?.type === "h2" ? blocks[0].text.replace(/^0\d · /, "") : o.summary;
        const para = blocks.find((b) => b.type === "p");
        return (
          <Reveal key={o.id} delay={i * 80}>
            <h3 className="mb-1.5 text-[21px]">{heading}</h3>
            <p className="max-w-[38em] text-ink-2">{para?.type === "p" ? para.text : ""}</p>
          </Reveal>
        );
      })}
      {closing?.type === "p" ? (
        <Reveal delay={240}>
          <p className="max-w-[38em] border-l-2 border-human pl-4 text-[17px] leading-[1.55] text-ink">{closing.text}</p>
        </Reveal>
      ) : null}
    </>
  );
}
