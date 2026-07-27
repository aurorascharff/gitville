<div align="center">

<img src="public/logo.svg" alt="Gitville" width="72" height="72" />

# Gitville

Gitville turns a GitHub repo into a small pixel village you can walk around in. Open pull requests are houses, contributors are villagers standing where they last worked, and real commits furnish the rooms inside.

[**Visit a village →**](https://gitville.vercel.app/)

</div>

---

Built on the [Next.js 16 preview](https://nextjs.org/blog/next-16-3-instant-navigations) with the new [SWR](https://swr.vercel.app) server layer and live GitHub data. The architecture follows the [Next.js App Architecture](https://github.com/aurorascharff/skills/tree/main/skills/nextjs-app-architecture) skill and the [Component Architecture for React Server Components](https://aurorascharff.no/posts/component-architecture-for-react-server-components/) blog post.

## How the village works

- The **town hall** is the default branch, where releases and merges land.
- A **finished cottage** is an open PR ready for review. One **under construction** with tarp and scaffolding is a draft.
- A **multi-storey house** is a stack of PRs: each floor is a PR built on the one below, and the attic is the top of the stack.
- A **cabin** is an active branch with no PR yet, a **tent** is a busy issue, and the **well** marks the town square.
- **Villagers** are real contributors, standing at the house where they last worked. The world updates live.
- Step inside and the room is furnished from the PR's real commits. Grouped work becomes bigger furniture, and review comments hang on the wall as notes. With an AI gateway key a model designs and draws the room. Without one, a deterministic designer does.
- The **clock** at the bottom winds the village back through its recent event history.

## Features

- **[SWR 2.5 server layer](https://swr.vercel.app)**: the server starts the fetch with `preload()` and hands it to the client via `cacheData` on `<SWRConfig>`, which hydrates with no refetch and then polls. Every component uses the same key, so SWR dedupes the whole village into one request per poll.
- **[Cache Components](https://preview.nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents)**: GitHub reads are wrapped in `'use cache'`, tagged with `cacheTag`, and bounded with `cacheLife`, so a busy village never spends the rate limit twice on the same window.
- **[Partial Prefetching](https://preview.nextjs.org/docs/app/guides/adopting-partial-prefetching)** and **[runtime prefetching](https://preview.nextjs.org/docs/app/guides/runtime-prefetching)** make hopping between villages instant.
- **[Server Functions](https://nextjs.org/docs/app/getting-started/mutating-data)** manage the watchlist and invalidate only the tags they touch.
- **[React Compiler](https://react.dev/learn/react-compiler)** memoizes automatically, so there is no manual `useMemo` or `useCallback` anywhere.
- **Optional AI interior design** via the [AI SDK](https://ai-sdk.dev) and Vercel AI Gateway. Only successful generations are cached, and the room still draws without a key.
- **Hand-drawn pixel art** rendered as SVG rect grids, with no image assets.

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

## Credits

Music: "The Bard's Tale" by RandomMind, released under CC0.

## License

[MIT](LICENSE)
