# This is NOT the Next.js you know

This repo runs a preview build of Next.js (16.3) with breaking changes vs. older
docs and training data — APIs, conventions, and file structure may differ. Read the
relevant guide in `node_modules/next/dist/docs/` before writing framework code, and
heed deprecation notices.

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

## Deploy engine

Deploys run through a `DeployEngine` (see `features/deployment/deploy-engine/`). Real
`@vercel/sandbox` deploys are gated behind `ENABLE_REAL_SANDBOX=true` **and** resolvable
Vercel credentials; otherwise the simulated engine runs. Never expose the real engine to
untrusted/public users — it consumes your Vercel compute.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
