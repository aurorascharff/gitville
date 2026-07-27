<div align="center">

<img src="public/logo.svg" alt="Gitville" width="72" height="72" />

# Gitville

Every GitHub repo is a tiny pixel village. Open pull requests are houses, contributors are villagers standing where they last worked, and the commits furnish the rooms inside. Walk around, step through a door, and read the real work on the walls.

[**Visit a village →**](https://gitville.vercel.app/)

</div>

---

Gitville is a real project and also a demo. It exists to show how far you can push the [Next.js 16 preview](https://nextjs.org/blog/next-16-3-instant-navigations) and the new [SWR](https://swr.vercel.app) server layer with live third party data. The architecture follows the [Next.js App Architecture](https://github.com/aurorascharff/skills/tree/main/skills/nextjs-app-architecture) skill and the [Component Architecture for React Server Components](https://aurorascharff.no/posts/component-architecture-for-react-server-components/) blog post.

## How the village works

- The **town hall** is the default branch. Releases and merges land there.
- A **finished cottage** is an open PR that is ready for review.
- A house **under construction** with a tarp and scaffolding is a draft PR.
- A **multi storey house** is a stack of PRs. Every floor is a PR built on the one below, and the attic is the top of the stack.
- A **cabin** is an active branch with no PR yet. A **tent** is a busy issue. The **well** marks the town square.
- **Villagers** are real contributors, placed at the house where their latest activity happened. The world updates live as they work.
- Step inside a house and the room is furnished from the PR's real commits. Group work becomes bigger furniture. Review comments hang on the wall as notes. With an AI gateway key the furniture is designed and drawn by a model, and without one a deterministic designer does the job.
- The **clock** at the bottom winds the whole village back in time through the recent event history.

## Features

- **[SWR 2.5 server layer](https://swr.vercel.app)** keeps the village alive. The server starts the fetch with the new `preload()` API and hands it to the client through `cacheData` on `<SWRConfig>`. The client hydrates with no refetch and then polls. Every component fetches its own data with the same key, so SWR dedupes the whole village into one request per poll.
- **[Cache Components](https://preview.nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents)** cache the GitHub reads with `'use cache'`, tag them with `cacheTag`, and bound them with `cacheLife`, so a busy village never spends your rate limit twice on the same window.
- **[Partial Prefetching](https://preview.nextjs.org/docs/app/guides/adopting-partial-prefetching)** and **[runtime prefetching](https://preview.nextjs.org/docs/app/guides/runtime-prefetching)** make hopping between villages feel instant.
- **[Server Functions](https://nextjs.org/docs/app/getting-started/mutating-data)** manage your watchlist and invalidate only the tags they touch.
- **[React Compiler](https://react.dev/learn/react-compiler)** memoizes automatically, so there is no manual `useMemo` or `useCallback` anywhere.
- **Optional AI interior design** through the [AI SDK](https://ai-sdk.dev) and the Vercel AI Gateway. Only successful generations are cached, and the whole feature degrades cleanly when no key is set.
- **Hand drawn pixel art** rendered as SVG rect grids. No image assets, crisp at any scale.

## Getting started

```bash
pnpm install
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) and paste any public repo URL.

Optional environment variables in `.env.local`:

- `GITHUB_TOKEN` raises the GitHub API limit from 60 to 5000 requests per hour. Strongly recommended.
- `VERCEL_AI_GATEWAY_KEY` turns on the AI interior designer.

## Stack

- **[Next.js 16](https://nextjs.org/)** with the App Router, Cache Components, and Server Functions
- **[React 19](https://react.dev/)** with the React Compiler
- **[SWR 2.5](https://swr.vercel.app)** server layer with `preload` and `cacheData`
- **[AI SDK](https://ai-sdk.dev)** with the Vercel AI Gateway for room design
- **[TypeScript](https://www.typescriptlang.org/)** and **[Tailwind CSS v4](https://tailwindcss.com/)**

## License

[MIT](LICENSE)
