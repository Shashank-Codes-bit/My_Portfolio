"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { suggestionsFor } from "@/lib/suggestions";

/** Three static suggestions for the current route. Cross-fades under 150ms on route change. */
export default function Suggestions({ onPick, compact = false }: { onPick: (q: string) => void; compact?: boolean }) {
  const pathname = usePathname();
  const [shown, setShown] = useState(() => ({ route: pathname, items: suggestionsFor(pathname) }));
  const [hidden, setHidden] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (pathname === shown.route) return;
    setHidden(true);
    timer.current = window.setTimeout(() => {
      setShown({ route: pathname, items: suggestionsFor(pathname) });
      setHidden(false);
    }, 140);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [pathname, shown.route]);

  return (
    <ul className="flex flex-wrap gap-2 transition-opacity duration-150" style={{ opacity: hidden ? 0 : 1 }}>
      {shown.items.map((s) => (
        <li key={s}>
          <button type="button" onClick={() => onPick(s)} className={compact ? "hint !px-2.5 !py-1 !text-[12.5px]" : "hint"}>
            {s}
          </button>
        </li>
      ))}
    </ul>
  );
}
