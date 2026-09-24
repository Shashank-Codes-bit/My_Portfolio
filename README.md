# shashankjindal — portfolio

Personal site with a grounded assistant. The assistant answers as Shashank, only from `lib/corpus.ts`, cites the entries it used, and refuses cleanly. The pages render from the same file, so the assistant cannot contradict the site.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind 4 · Anthropic API via `@anthropic-ai/sdk` (server-side key only) · Fly.io

No vector database. No embeddings. The corpus is small and is sent whole, prompt-cached.

## Run locally

```bash
npm install
cp .env.example .env.local   # then add ANTHROPIC_API_KEY
npm run dev
```

The site works without a key: pages render, suggestions render, and the assistant falls back to an email prompt when `/api/ask` cannot reach a model.

## Environment

| Variable | When | Default | Purpose |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | runtime | — | Server-side only. On Fly: `fly secrets set ANTHROPIC_API_KEY=...` |
| `ANTHROPIC_MODEL` | runtime | `claude-sonnet-5` | Claude model id |
| `ASK_LOG` | runtime | `0` in production, `2` in dev | `0` errors only · `1` request kinds + token usage · `2` also question text (personal data; keep off in production) |
| `NEXT_PUBLIC_SITE_URL` | **build** | `http://localhost:3000` | Baked into metadata and canonical URLs by `next build`. On Fly it comes from `[build.args]`; a domain change needs a redeploy. |

## Content

Everything lives in `lib/corpus.ts` (server-only). Edit it and both the pages and the assistant update. Site-wide constants safe for the browser are in `lib/site.ts`. Suggested questions per route are in `lib/suggestions.ts`; refusal rules in `lib/denylist.ts`; keyword-matched canned questions in `lib/canned.ts`.

## Pre-generated answers

```bash
npm run pregenerate            # answers missing questions, drops keys for removed ones
npm run pregenerate -- --force # regenerate everything
```

Writes `data/answers.json`. Review it, then commit it. Clicking a suggestion is then instant and costs nothing; only novel typed questions reach the model. `npm test` fails if the file drifts from the questions.

## `/api/ask`

`POST { question, route? }` → SSE stream with events `sources`, `delta`, `done`, `error` (`error` carries `code: "rate_limited" | "unavailable"`).

Pipeline: same-origin check → body size → validate → per-IP rate limit → deny-list (no model call) → canned match against `answers.json` (no model call) → model call with the whole corpus (system block prompt-cached for an hour) → stream. `route` is a hint only and must be a real page; a Voltas question from the landing page answers correctly.

## Checks

```bash
npm run check   # typecheck + lint + tests + build
```

## Branches and deploys

`main` is production (https://shashankjindal.fly.dev, Fly app `shashankjindal`, `fly.toml`). `staging` is where changes land first (https://shashankjindal-staging.fly.dev, Fly app `shashankjindal-staging`, `fly.staging.toml`). Staging serves `Disallow: /` and `noindex`, decided at build time from `NEXT_PUBLIC_SITE_URL`.

1. Work on `staging`, run `npm run check`.
2. `npm run deploy:staging`, verify on the staging URL.
3. Merge `staging` into `main` (fast-forward), then `npm run deploy:prod`.

Both deploy scripts pass `--ha=false` so each app keeps exactly one machine. Pause staging between rounds of work with `fly machine stop <id> -a shashankjindal-staging` (id from `fly status -a shashankjindal-staging`): a stopped machine costs only a few cents of storage, and the next request to the staging URL starts it again in a few seconds (`auto_start_machines`). Do not use `fly scale count 0`; that deletes the machine and needs a redeploy.

First-time setup for either app:

```bash
fly apps create <app>
grep '^ANTHROPIC_API_KEY=' .env.local | fly secrets import -a <app> --stage   # value never echoed
```

Each config keeps one machine always running with a health check on `/robots.txt` and blue-green deploys, so there is no cold start and no downtime on deploy.
