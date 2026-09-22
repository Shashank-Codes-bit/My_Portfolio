import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Not found", robots: { index: false, follow: false } };

export default function NotFound() {
  return (
    <div className="wrap on-paper flex max-w-[880px] flex-col gap-6 py-24">
      <h1 className="text-[42px] md:text-[56px]">Nothing here.</h1>
      <p className="max-w-[34em] text-[18px] text-ink-2">
        That page isn't on file. The work index is the best place to start, or email{" "}
        <a className="link" href={`mailto:${SITE.email}`}>
          {SITE.email}
        </a>
        .
      </p>
      <Link href="/#work" className="btn btn-primary self-start">
        Go to the work index
      </Link>
    </div>
  );
}
