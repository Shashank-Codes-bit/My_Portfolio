"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE } from "@/lib/site";
import ThemeToggle from "./ThemeToggle";

const LINKS = [
  { href: "/#work", label: "Work", short: "Work", match: "/work" },
  { href: "/how-i-build", label: "How I build", short: "How", match: "/how-i-build" },
  { href: "/about", label: "About", short: "About", match: "/about" },
];

/**
 * On the landing page the nav floats transparently over the hero stage (one continuous surface);
 * everywhere else it sits on paper with a rule beneath it.
 */
export default function Nav() {
  const pathname = usePathname();
  const onStage = pathname === "/";
  const link = (active: boolean) =>
    onStage ? (active ? "text-stage-ink" : "text-stage-dim hover:text-stage-ink") : active ? "text-ink" : "text-ink-2 hover:text-ink";
  return (
    <header className={onStage ? "absolute inset-x-0 top-0 z-20 text-stage-ink" : "on-paper border-b border-line"}>
      <div className="wrap flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-4 sm:py-5">
        <Link href="/" className={`text-[15px] font-semibold sm:text-[16px] ${onStage ? "text-stage-ink" : "text-ink"}`}>
          <span className="hidden min-[400px]:inline">{SITE.name}</span>
          <span className="min-[400px]:hidden" aria-label={SITE.name}>
            SJ
          </span>
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-3 sm:gap-5 md:gap-6">
          {LINKS.map((l) => {
            const active = pathname.startsWith(l.match);
            return (
              <Link key={l.href} href={l.href} className={`whitespace-nowrap text-[14px] font-medium sm:text-[15px] ${link(active)}`} aria-current={active ? "page" : undefined}>
                <span className="hidden sm:inline">{l.label}</span>
                <span className="sm:hidden">{l.short}</span>
              </Link>
            );
          })}
          <a href={SITE.resumePath} target="_blank" rel="noopener" className={`hidden whitespace-nowrap text-[15px] font-medium sm:inline ${link(false)}`}>
            Resume<span className="sr-only"> (opens a PDF in a new tab)</span>
          </a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
