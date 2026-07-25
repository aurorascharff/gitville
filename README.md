<div align="center">

<img src="public/logo.svg" alt="next16-deploy-platform" width="72" height="72" />

# next16-deploy-platform

A mini Vercel-style deployments dashboard that makes the "syncing" demo **real**: import a GitHub repo, watch a build stream **live build logs**, and get a real preview URL — built on the [Next.js 16 preview](https://nextjs.org/blog/next-16-3-instant-navigations) with the new [SWR](https://swr.vercel.app) server layer.

[**Live demo →**](https://next16-deploy-platform.vercel.app/)

</div>

---

The architecture follows the [Next.js App Architecture](https://github.com/aurorascharff/skills/tree/main/skills/nextjs-app-architecture) skill and the [Component Architecture for React Server Components](https://aurorascharff.no/posts/component-architecture-for-react-server-components/) blog post.

## Features

- **[SWR 2.5 server layer](https://swr.vercel.app)** streams live build logs. A building deployment is seeded on the server with the new `preload()` API and passed to the client through `cacheData` on `<SWRConfig>`, so the client hydrates the current logs with **no refetch**, then polls the status route until the build reaches a terminal state. Everything else stays pure RSC.
- **Real deploys via [Vercel Sandbox](https://vercel.com/docs/vercel-sandbox)** — paste a public GitHub repo and, in local development, it spins up a real sandbox (`@vercel/sandbox`), runs `npm install` + `npm run dev`, streams the real command output into the log panel, and exposes a live `*.vercel.run` URL. A `DeployEngine` interface swaps transparently between the real sandbox and a simulated engine.
- **[Cache Components](https://preview.nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents)** cache each query with `'use cache'`, name the data with `cacheTag`, and set its lifetime with `cacheLife`, so repeated reads come from the cache until a tag is invalidated. Per-user reads use [`'use cache: private'`](https://preview.nextjs.org/docs/app/api-reference/directives/use-cache-private).
- **[Partial Prefetching](https://preview.nextjs.org/docs/app/guides/adopting-partial-prefetching)** prefetches the shared App Shell as links enter the viewport, so navigation commits instantly and data streams in behind it.
- **[Runtime prefetching](https://preview.nextjs.org/docs/app/guides/runtime-prefetching)** lets pages prefetch per-request data by exporting [`prefetch = 'allow-runtime'`](https://preview.nextjs.org/docs/app/api-reference/file-conventions/route-segment-config/prefetch).
- **[Server Functions](https://nextjs.org/docs/app/getting-started/mutating-data)** trigger deploys and pins on the server and invalidate only the tags they change with [`updateTag`](https://nextjs.org/docs/app/api-reference/functions/updateTag); the background build finalizes with `revalidateTag` so lists stay in sync.
- **[React Compiler](https://react.dev/learn/react-compiler)** memoizes components automatically — no manual `useMemo`/`useCallback`.
- **[View Transitions](https://nextjs.org/docs/app/guides/view-transitions)** cross-fade content as it streams in from Suspense.
- **[Async React](https://github.com/rickhanlonii/async-react)** keeps the UI live with `Suspense`, `useOptimistic`, `useTransition`, `useActionState`, `useFormStatus`, and `use`.
- **Name-only auth** — no account, just a name stored in a cookie, like a lab demo should be.

## Deploy engine

Deploys run through a `DeployEngine` (`features/deployment/deploy-engine/`):

- **Simulated engine** — a scripted build with realistic timing and persisted log lines. Runs everywhere with no credentials, so the public deployment always works.
- **Sandbox engine** — a real `@vercel/sandbox` build with streamed logs and a live URL.

Real deploys are **local/development only** by design: `realSandboxEnabled()` returns `false` whenever `NODE_ENV === 'production'`, so the public deployment can never spend your Vercel sandbox compute — no environment variable can turn it on in production. To try real deploys locally, run `vercel link` + `vercel env pull .env.local`, set `ENABLE_REAL_SANDBOX=true`, and restart.

## Getting started

Runs on Postgres (Neon in production). Set `DATABASE_URL` in `.env.local`, then:

```bash
pnpm install
pnpm run prisma.push
pnpm run prisma.seed
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000). Browse the data with `pnpm run prisma.studio`, or wipe and re-seed with `pnpm run prisma.reset`. See `.env.sample` for all environment variables.

## Stack

- **[Next.js 16](https://nextjs.org/)**: App Router, Cache Components, Server Functions
- **[React 19](https://react.dev/)** with React Compiler: Suspense, View Transitions, `useOptimistic`
- **[SWR 2.5](https://swr.vercel.app)** server layer (`preload` + `cacheData`) for live data
- **[@vercel/sandbox](https://vercel.com/docs/vercel-sandbox)** for real deploys
- **[TypeScript](https://www.typescriptlang.org/)** and **[Tailwind CSS v4](https://tailwindcss.com/)**
- **[Prisma 7](https://www.prisma.io/)** on PostgreSQL (Neon)
- **[Ariakit](https://ariakit.org/)**, **[sonner](https://sonner.emilkowal.ski/)**, **[lucide](https://lucide.dev/)**

## License

[MIT](LICENSE)
