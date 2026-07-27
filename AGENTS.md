<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Architecture

Feature-sliced App Router with React Server Components. See `README.md` for the full
picture. Core rules:

- `app/` composes; it never fetches data or holds domain logic.
- `features/<domain>/` owns its `-queries.ts` (server-only reads, `'use cache'`),
  `-actions.ts` (`'use server'` writes), and `components/`.
- Pages stay synchronous and thread `params`/`searchParams` through `.then()` inside
  `<Suspense>`. The page owns the boundary; the feature exports the skeleton.
- Queries wrap a cookie-reading outer function around an inner `'use cache'` function so
  the cache key stays pure. Actions run `verifyAuth()` → validate → mutate →
  `updateTag(...)` → return `{ ok } | { ok: false, error }`.
- Client components are leaves. React Compiler is on — do not add `useMemo`/`useCallback`.
- Comments only where non-obvious, and short.

## Live data

The village polls GitHub through `lib/github.ts` (cached with `'use cache: remote'` so
every visitor shares one upstream fetch per window). `GITHUB_TOKEN` raises the rate
limit. The AI room designer (`features/village/room-ai.ts`) is optional: it needs
`VERCEL_AI_GATEWAY_KEY` and must only cache successful generations.
