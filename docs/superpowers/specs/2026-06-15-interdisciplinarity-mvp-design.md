# Interdisciplinarity Story MVP — Design

**Date:** 2026-06-15
**Status:** Approved design, pending implementation plan

## Context & goal

Migrate the `interdisciplinarity` story from `complex-stories-dev/frontend` into
complexforms. The original is a paper-annotation tool whose frontend proxies a
FastAPI backend (`http://localhost:3001`) for auth, paper metadata (OpenAlex),
annotations, stats, agreement, and community/author-works queues.

This is the **second sub-project** (after better-auth). It replaces the API with
a **local DB** (tier-2 app DB) and consumes the better-auth we just shipped.

**MVP scope:** the core annotation loop —
- **story** mode: the interdisciplinarity essay (`Story.svelte`).
- **csv-queue** mode: rate the 94 curated papers (1–5 interdisciplinarity, optional confidence).
- **overview** mode: table of papers + annotation counts.
- **stats** mode: aggregate stats + inter-annotator agreement.

Annotators are either anonymous (browser fingerprint) or logged in (better-auth
session). All data is local; no FastAPI.

## Out of scope (next sub-project)

- **community-queue** mode (community-contributed papers / `in_general_queue`).
- **my-papers** mode (a user's own OpenAlex works via ORCID/OpenAlex ID).
- ORCID/OpenAlex profile fields on better-auth users; the "add my paper to the
  general queue" authorship-verification flow.
- The original API's `getWorksByAuthor`, `getCommunityQueuePapers`, and its
  bespoke auth (register/login) — auth is better-auth now.

## Data layer (tier-2 app DB)

Replaces the API proxy. Lives behind story-local remote functions so the engine
stays swappable.

- **Papers** — populated via the **`@the-vcsi/openalex`** scrolly-kit extension
  (`npx sv add @the-vcsi/openalex`): it generates paper/author tables in the app
  schema + a `scripts/populate-openalex-db.js`. We adapt that script to ingest the
  94 `oa_wid` IDs from `top_cited_papers_comp_networks.csv` and run
  `npm run db:populate-openalex` once. The tool reads paper metadata locally.
  - **Open risk (resolve in plan):** the tool's `PaperAnnotationCard` shows title,
    authors, abstract, topics, year, doi. If the extension's generated paper table
    omits abstract/topics, extend the schema + populate script to include them.
- **Annotations** — new module `src/lib/server/db/schema/interdisciplinarity.ts`
  (tier-2, added to the schema barrel — no new drizzle config):

  | field | type | notes |
  |---|---|---|
  | id | integer PK autoincrement | |
  | paperId | text not null | OpenAlex work id (e.g. `W2118557509`) |
  | userId | text, FK → better-auth `user.id`, nullable | logged-in annotator |
  | fingerprint | text, nullable | anonymous annotator |
  | rating | integer not null | 1–5 |
  | confidence | integer, nullable | 1–5 |
  | createdAt / updatedAt | timestamps | |

  Unique `(paperId, userId, fingerprint)`; **upsert** (users can change their mind).
  At least one of `userId` / `fingerprint` present (enforced in the remote fn).

- **Remote functions** — `src/lib/stories/interdisciplinarity/data/data.remote.ts`,
  all local:
  - `annotatePaper({ paperId, rating, confidence?, fingerprint? })` — upsert by
    `locals.user.id` if logged in, else `fingerprint`.
  - `getPaperById(paperId)` — read from the local papers table.
  - `getMyAnnotations({ fingerprint? })` — by `locals.user.id` or `fingerprint`.
  - `getAnnotationStats()` — total, average rating, rating distribution, per-paper
    counts (computed in JS/SQL from `paper_annotations`).
  - `getAgreementData({ minAnnotations = 3 })` — port the Python agreement logic to
    JS: same-side-of-scale pairwise agreement (1–2 agree, 4–5 agree, 3 only with
    itself), pairwise matrix, std dev, mean; sorted by agreement ascending.
  - Pure helpers (agreement math, value coercion) extracted to a side module and
    unit-tested with vitest.

## UI

Story-local under `src/lib/stories/interdisciplinarity/`, served at
`/interdisciplinarity` (row added to `stories.csv`).

- **Index.svelte** — orchestrator; mode set trimmed to `story | csv-queue |
  overview | stats`. Fingerprint via the existing `$lib/utils/browserFingerprint`.
  "Logged in" = better-auth (`locals.user` via a load function / `authClient`); no
  in-tool login form — users log in via the app's `/login`.
- **Components ported** (adjusting data wiring to the local remote fns): `Story`
  (+ copy its 3 images `insuarity.jpg`, `physicists.png`, `login.jpg` to `static/`),
  `TopBar`, `QueueHeader`, `PaperAnnotationCard`, `RatingBarChart`, `OverviewTable`,
  `StatsView`, `AgreementMatrix`, and `SearchInput` / `FilterButtons` /
  `HelpPopover` as used by those modes.
- scrolly-kit: the essay uses the `.story` prose treatment; `StoryHeader` for
  title/subtitle/authors/date from copy.json where it fits. The annotation tool
  chrome (mode nav, cards) stays bespoke.
- All `.svelte` files validated with the svelte MCP autofixer.

## Verification

- Extension populate run fills the papers table with the 94 curated papers
  (inspect row count via sqlite).
- Annotation unit tests (agreement math + coercion) pass.
- Browser: open `/interdisciplinarity` → read the story; csv-queue shows a paper
  card; submitting a rating writes a `paper_annotations` row (verify in sqlite,
  anonymous fingerprint); overview shows counts; stats shows distribution +
  agreement once ≥1 annotation exists.
- Logged-in path: with a better-auth session, an annotation is keyed by `userId`
  (verify in sqlite).
- `svelte-check` clean; survey + auth unaffected.

## Notes

- The interdisciplinarity papers/annotations are tier-2 (shared, cross-user) — the
  correct tier per the project DB convention.
- The better-auth MCP (`.mcp.json`) and scrolly-kit MCP should be used during
  planning to confirm the openalex extension's generated schema and any API
  details.
