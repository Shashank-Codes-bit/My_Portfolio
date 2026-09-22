import type { Metadata } from "next";
import Principle from "@/components/Principle";
import { principles } from "@/lib/corpus";

const description = "Six opinions on building AI agents and grounded assistants, each from a decision made on a real flow.";

export const metadata: Metadata = {
  title: "How I build",
  description,
  alternates: { canonical: "/how-i-build" },
  openGraph: { title: "How I build — Shashank Jindal", description, url: "/how-i-build" },
};

export default function HowIBuild() {
  return (
    <div className="wrap on-paper flex flex-col gap-14 py-10 md:py-14">
      <header className="flex max-w-[880px] flex-col gap-5">
        <h1 className="max-w-[18ch] text-[42px] md:text-[60px]">Six opinions I'll bring to your project on day one.</h1>
        <p className="max-w-[34em] text-[19px] leading-[1.5] text-ink-2 md:text-[21px]">
          Each came out of a decision that had to be made on a real flow, and each is arguable. I'm happy to argue them.
        </p>
      </header>
      <div className="grid gap-x-12 gap-y-12 border-t border-line pt-12 md:grid-cols-2">
        {principles.map((p) => (
          <Principle key={p.id} entry={p} />
        ))}
      </div>
    </div>
  );
}
