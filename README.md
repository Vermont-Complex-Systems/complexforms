# Complex Forms

A platform to host dynamic web apps at the Vermont Complex Systems Institute, built with `sveltekit`, `better-auth` and drizzle.

## Features

- Per-story database using [drizzle-better-sqlite3](https://orm.drizzle.team/docs/get-started-sqlite#better-sqlite3), making each story portable and fully modular.
- Reusable survey components with remote functions to load the data into
- Authentification using `better-auth`, also per-story


## Project Structure

```
src/
├── lib/
│   ├── stories/          # Your stories live here
│   │   └── my-story/
│   │       ├── components/
│   │       │   └── Index.svelte
│   │       └── data/
│   │           └── copy.json
│   ├── components/       # Shared components
│   ├── data/
│   │   ├── stories.csv   # Story metadata for routing
│   │   └── members.csv   # Team member data
│   └── styles/
│       └── app.css       # Your customizations
└── routes/               # SvelteKit routes
```

## Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:5173`      |
| `npm run build`           | Build your production site to `build/`          |
| `npm run preview`         | Preview your build locally, before deploying     |


This templates comes with the [sv](https://svelte.dev/docs/cli/overview) Command Line Interface for creating and maintaining Svelte application:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npx sv check`       | Finds errors and warnings in your project |
| `npx sv --help` | Get help using the sv CLI                     |

On top of the official CLI, VCSI provides useful adds-on to the template

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npx sv add @the-vcsi/msgraph`       | Integrate Microsoft Sharepoint |
| `npx sv add @the-vcsi/openalex` | Integrate OpenAlex data         |
| `npx sv add @the-vcsi/scrolly-skills` | Claude Code skill + MCP servers for scrolly-kit |

You can read more about these integrations on their own page.

## AI setup (Claude Code + MCP)

Running `npx sv add @the-vcsi/scrolly-skills` sets up an AI layer for this project:

- `.claude/skills/scrolly-kit/` — a Claude Code skill so the agent knows scrolly-kit's layouts, `copy.json` schema, and component props.
- `.mcp.json` — the `scrolly-kit` MCP server (live docs via `npx @the-vcsi/scrolly-mcp`) and the official Svelte MCP server (Svelte 5 / SvelteKit docs + autofixer).

After adding it, restart Claude Code (or approve the new MCP servers) so it picks up `.mcp.json`. Full walkthrough — from scaffold to a generated story — is on the [Getting Started](https://vermont-complex-systems.github.io/vcsi-starter/getting-started) page under "Working with AI".

## Adding a Story

```bash
npm run new-story my-new-story
npm run dev
```

This creates the folder structure, boilerplate files, and adds an entry to `stories.csv`.

## Customization

Edit `src/lib/styles/app.css` to override CSS variables.

## 👀 Want to learn more?

Check out VCSI Scrolly kit’s docs, read the svelte documentation, or jump into the VCSI slack channel.
# complexforms
