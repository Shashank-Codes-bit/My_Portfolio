import Link from "next/link";
import type { Source } from "./RailProvider";

const LinkIcon = () => (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4.5 2.5H2.5a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V7.5M7 1.5h3.5V5M10.5 1.5 5.5 6.5" />
  </svg>
);

/** Source chip. Every chip with an href is a link to the page that entry lives on. */
export default function SourceTag({ source }: { source: Source }) {
  if (!source.href) return <span className="chip">{source.label}</span>;
  return (
    <Link href={source.href} className="chip" title={`Read the ${source.label} page`}>
      {source.label}
      <LinkIcon />
    </Link>
  );
}
