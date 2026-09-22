"use client";

import { useEffect, useState } from "react";

type Theme = "system" | "light" | "dark";
const OPTIONS: { value: Theme; label: string }[] = [
  { value: "system", label: "Auto" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];
const THEME_COLOR: Record<"light" | "dark", string> = { light: "#E9EBF6", dark: "#0B1030" };

const read = (): Theme => {
  try {
    const v = localStorage.getItem("theme");
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
};

const apply = (t: Theme) => {
  const root = document.documentElement;
  if (t === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", t);
  // Keep the browser chrome in step with the forced theme, not just the OS preference.
  const effective = t === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : t;
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", THEME_COLOR[effective]));
  try {
    if (t === "system") localStorage.removeItem("theme");
    else localStorage.setItem("theme", t);
  } catch {
    /* storage unavailable — attribute still applied for this page */
  }
};

/** Auto / Light / Dark. Plain toggle buttons (no radio semantics), each its own Tab stop. */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  // Belt and braces: the head script stamps data-theme before paint; re-apply here too.
  useEffect(() => {
    const t = read();
    setTheme(t);
    apply(t);
  }, []);

  const choose = (t: Theme) => {
    setTheme(t);
    apply(t);
  };
  const next = () => choose(OPTIONS[(OPTIONS.findIndex((o) => o.value === theme) + 1) % OPTIONS.length].value);
  const current = OPTIONS.find((o) => o.value === theme)?.label ?? "Auto";

  return (
    <>
      <button type="button" onClick={next} className="theme-seg theme-seg-single sm:hidden" aria-label={`Theme: ${current}. Activate to change.`}>
        {current}
      </button>
      <div className="theme-seg hidden sm:inline-flex" role="group" aria-label="Theme">
        {OPTIONS.map((o) => (
          <button key={o.value} type="button" aria-pressed={theme === o.value} onClick={() => choose(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
    </>
  );
}
