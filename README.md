<div align="center">

<img src="public/logo.svg" alt="Gitville" width="72" height="72" />

# Gitville

Gitville turns any GitHub repo into a small pixel village you can walk around in. Open pull requests are houses, contributors are villagers standing where they last worked, and real commits furnish the rooms inside.

[**Visit a village →**](https://gitville.vercel.app/)

</div>

---

## How the village works

- The **town hall** is the default branch, where releases and merges land.
- A **finished cottage** is an open PR ready for review; one **under construction** with tarp and scaffolding is a draft.
- A **multi-storey house** is a stack of PRs, each floor built on the one below, the attic at the top.
- A **cabin** is an active branch with no PR yet, a **tent** is a busy issue, and the **well** marks the town square.
- **Villagers** are real contributors, standing at the house where they last worked. The world updates live.
- Step inside and the room is furnished from the PR's real commits, with review comments pinned to the wall as notes. Toggle **Draw with AI** and a model redraws the room as an invented workshop built from those same commits.
- The **clock** winds the village back through its recent history.

## Getting started

```bash
pnpm install
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) and paste any public repo URL.

Two optional keys in `.env.local`:

- `GITHUB_TOKEN` raises the GitHub API limit from 60 to 5000 requests/hour (strongly recommended).
- `VERCEL_AI_GATEWAY_KEY` turns on the AI interior designer. Without it, a deterministic designer furnishes rooms instead.

## Built with

[Next.js 16](https://nextjs.org/), [React 19](https://react.dev/), the [SWR](https://swr.vercel.app) server layer, the [AI SDK](https://ai-sdk.dev) with Vercel AI Gateway, and [Tailwind CSS v4](https://tailwindcss.com/). All pixel art is hand-drawn SVG.

## Credits

Music: "The Bard's Tale" by RandomMind, released under CC0.

## License

[MIT](LICENSE)
