import { describe, expect, it } from "vitest";
import answers from "@/data/answers.json";
import { answerKey, lookupAnswer } from "@/lib/answers";
import { canned } from "@/lib/canned";
import { suggestions } from "@/lib/suggestions";
import { entryIds } from "@/lib/corpus";

const store = answers as Record<string, { text: string; sources: string[] }>;

describe("pregenerated answers stay in step with the questions", () => {
  it("has an answer for every route-specific suggestion", () => {
    const missing: string[] = [];
    for (const [route, qs] of Object.entries(suggestions)) {
      for (const q of qs) if (!store[answerKey(q, route)]) missing.push(answerKey(q, route));
    }
    expect(missing, `run: npm run pregenerate`).toEqual([]);
  });

  it("has an answer for every canned question", () => {
    const missing = canned.map((c) => answerKey(c.question)).filter((k) => !store[k]);
    expect(missing, `run: npm run pregenerate`).toEqual([]);
  });

  it("has no stale keys for questions that no longer exist", () => {
    const valid = new Set<string>([
      ...Object.entries(suggestions).flatMap(([route, qs]) => qs.map((q) => answerKey(q, route))),
      ...canned.map((c) => answerKey(c.question)),
    ]);
    const stale = Object.keys(store).filter((k) => !valid.has(k));
    expect(stale, `run: npm run pregenerate -- --force`).toEqual([]);
  });

  it("every stored answer is clean: non-empty, no raw ids in prose, sources are real entry ids", () => {
    for (const [k, a] of Object.entries(store)) {
      expect(a.text.length, k).toBeGreaterThan(20);
      expect(a.text, k).not.toMatch(/\b(work|principle|stack|offer)\.[a-z]+\b/);
      for (const s of a.sources) expect(entryIds, `${k} → ${s}`).toContain(s);
    }
  });

  it("lookup prefers the route-specific answer and falls back to the plain one", () => {
    const r = lookupAnswer("Is any of it live?", "/");
    expect(r?.text.length ?? 0).toBeGreaterThan(20);
    expect(lookupAnswer("Where are you based?", "/work/hero")?.text.length ?? 0).toBeGreaterThan(5);
    expect(lookupAnswer("this question does not exist anywhere")).toBeUndefined();
  });
});
