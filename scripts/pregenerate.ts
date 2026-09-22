/**
 * Pre-generates answers for every suggested and canned question.
 * Run: npm run pregenerate [-- --force]
 * Writes data/answers.json — review it, then commit it.
 * Requires ANTHROPIC_API_KEY in .env.local or the environment.
 *
 * Incremental by default: existing answers are kept, missing ones generated, and keys for
 * questions that no longer exist are dropped. --force regenerates everything.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { canned } from "../lib/canned";
import { suggestions } from "../lib/suggestions";
import { answerKey } from "../lib/answers";
import { answerQuestion, type Answer } from "../lib/model";

const ROOT = resolve(__dirname, "..");
const OUT = resolve(ROOT, "data/answers.json");

// Tiny .env.local loader — no dotenv dependency. Handles `export KEY=`, quotes, trailing spaces.
const envFile = resolve(ROOT, ".env.local");
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = /^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^(["'])(.*)\1$/, "$2");
  }
}

const force = process.argv.includes("--force");

/** Cheap quality gate: an answer must say something and end like a sentence. */
const suspicious = (a: Answer) => !a.text.trim() || !/[.!?)]$/.test(a.text.trim()) || (a.sources.length === 0 && !/don't have|email me/i.test(a.text));

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is not set. Add it to .env.local and re-run.");
    process.exit(1);
  }
  const existing: Record<string, Answer> = !force && existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};

  // Suggestions are generated with their route so ambiguous ones ("What else shipped there?")
  // resolve against the right page. Canned questions are route-agnostic.
  const jobs: { q: string; route?: string }[] = [
    ...Object.entries(suggestions).flatMap(([route, qs]) => qs.map((q) => ({ q, route }))),
    ...canned.map((c) => ({ q: c.question })),
  ];
  const expected = new Set(jobs.map((j) => answerKey(j.q, j.route)));
  const out: Record<string, Answer> = Object.fromEntries(Object.entries(existing).filter(([k]) => expected.has(k)));
  const dropped = Object.keys(existing).length - Object.keys(out).length;

  let generated = 0;
  let skipped = 0;
  let failed = 0;
  const flagged: string[] = [];

  for (const { q, route } of jobs) {
    const key = answerKey(q, route);
    if (out[key]) {
      skipped++;
      continue;
    }
    process.stdout.write(`→ ${route ? `[${route}] ` : ""}${q} `);
    try {
      const a = await answerQuestion(q, route);
      out[key] = a;
      generated++;
      if (suspicious(a)) flagged.push(key);
      console.log(`[${a.sources.join(", ") || "no sources"}]`);
    } catch (err) {
      failed++;
      console.log(`FAILED: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const sorted = Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(OUT, JSON.stringify(sorted, null, 2) + "\n");
  console.log(`\n${generated} generated · ${skipped} kept · ${dropped} dropped · ${failed} failed → ${OUT}`);
  if (flagged.length) console.log(`Review these (empty, unterminated, or unsourced):\n  ${flagged.join("\n  ")}`);
  if (failed) process.exit(2);
}

main();
