# Survey Story Migration → complexforms (scrolly-kit + SQLite)

**Date:** 2026-06-15
**Status:** Approved design, pending implementation plan

## Goal

Migrate the `survey-story-1` scrollytelling story from `my-svelte-blog` into the
`complexforms` SvelteKit project, adopting the `@the-vcsi/scrolly-kit` component
library and a local SQLite database. This is the first story migration and
serves as the reference pattern for: (a) using scrolly-kit, (b) browser
fingerprinting, and (c) persisting survey responses behind a swappable DB
interface.

## Decisions (and why)

- **DB engine: local SQLite** (per-story file), not Postgres. For a single
  survey story this is the simpler and smaller migration: the source already
  used SQLite (via Drizzle's `sqliteTable`), so the schema ports almost verbatim
  and there are no type-coercion landmines. SQLite is plenty fast/robust at
  survey write volume, and keeps the project self-contained and shareable.
- **Driver: `better-sqlite3`** (`drizzle-orm/better-sqlite3`) — synchronous,
  fast, the conventional local-file SQLite choice. Native module, but prebuilt
  binaries exist for linux-x64 (this VM). Server-only, so it stays external to
  the adapter-node bundle by default.
- **Per-story DB file**, gitignored:
  `src/lib/stories/survey-story-1/data/survey.db`. The repo ships the Drizzle
  schema + a generated migration (committed) so anyone can recreate an empty DB;
  the live `.db` with responses never enters git. This keeps respondent data out
  of shared repos for anonymity.
- **Swappable interface retained.** The DB lives behind `survey.remote.ts`
  (`saveAnswer` / `getSurveyResponse`) and `$lib/server/db`. A future project that
  needs scoped, audited multi-group access to raw rows can swap that one module
  to Postgres without touching any UI or story code. Engine is a per-project
  decision; SQLite is the default for now.
- **Fingerprinting kept** as a reference example (`@fingerprintjs/fingerprintjs`).
- **Consent gate + demographics kept** — full UX flow, not a stub.

## Architecture (units & boundaries)

Four isolated, independently testable layers:

1. **Story UI** — `src/lib/stories/survey-story-1/components/Index.svelte`.
   Orchestrates; talks only to the persistence interface and scrolly-kit.
2. **Survey UI components** — ported to
   `src/lib/stories/survey-story-1/components/` (story-local):
   `SurveyScrolly`, `SurveyQuestion` (+ `.Radio`, `.Checkbox`), `ConsentPopup`,
   `DemographicsBox`. Pure UI; depend only on props + the `saveAnswer` signature.
3. **Persistence interface** — `src/lib/stories/survey-story-1/data/survey.remote.ts`.
   Unchanged signatures: `saveAnswer(fingerprint, field, value)` and
   `getSurveyResponse(fingerprint)`. The seam everything else is blind behind.
4. **DB layer** — `src/lib/server/db/{index,schema}.ts`. The *only* DB-aware
   code. Drizzle + `better-sqlite3` → local `survey.db`.

## Component swaps (blog-custom → scrolly-kit)

| Blog (source) | complexforms (target) |
|---|---|
| `$lib/components/StoryHeader.svelte` | scrolly-kit `StoryHeader` |
| `$lib/components/helpers/ScrollIndicator.svelte` | scrolly-kit `ScrollIndicator` |
| `renderTextContent` snippet (`ScrollySnippets.svelte`) | scrolly-kit `RenderContent` |
| `$lib/components/helpers/Scrolly.svelte` (inside SurveyScrolly) | scrolly-kit `Scrolly` / `ScrollyContent` |
| — | add scrolly-kit `Footer` |
| — | keep `BackToHome` (target convention) |
| `browserFingerprint.ts` | ported as-is → `$lib/utils/browserFingerprint.ts` |

## DB layer specifics

- **Deps to add:** `drizzle-orm`, `better-sqlite3`, `@fingerprintjs/fingerprintjs`;
  dev: `drizzle-kit`, `@types/better-sqlite3`.
- **Connection:** `DATABASE_URL=file:./src/lib/stories/survey-story-1/data/survey.db`
  in a new **gitignored** `.env` (read via `$env/dynamic/private`). Path resolves
  from project root (cwd) at runtime.
- **Create:** `drizzle-kit generate` → commit the migration; `drizzle-kit push`
  (or apply the migration) to create the empty `.db` locally.
- **Schema** — `sqliteTable("dark_data_survey", …)`, ported from source, only the
  fields this story uses (YAGNI on `institutionPreferences`, `demographicsMatter`,
  `govPreferences`, `polPreferences`):

  | TS field | column | type |
  |---|---|---|
  | id | id | integer PK autoincrement |
  | fingerprint | fingerprint | text, not null, unique |
  | consent | consent | integer |
  | socialMediaPrivacy | social_media_privacy | text |
  | platformMatters | platform_matters | text (comma-joined array) |
  | relativePreferences | relative_preferences | integer |
  | age | age | text |
  | genderOrd | gender_ord | integer |
  | orientationOrd | orientation_ord | integer |
  | raceOrd | race_ord | integer |
  | createdAt | created_at | text default CURRENT_TIMESTAMP |

## `processValue` behavior (carried from source, one fix)

In `survey.remote.ts`:

- **Coerce to int**: `relativePreferences`, `genderOrd`, `orientationOrd`,
  `raceOrd`.
- **Keep as text**: `socialMediaPrivacy` (`"private"`/`"mixed"`/`"public"`),
  `age` (`"18-24"`). (Source erroneously `parseInt`-ed `age` → fixed here.)
- **`platformMatters`**: array → comma-joined string (unchanged).
- **`consent`**: stored as-is (`'accepted'`); consumer only checks
  `!!survey.consent`. (SQLite accepts text in the integer-affinity column, as the
  source relied on.)

## Registration

- Add a `survey-story-1` row to `src/lib/data/stories.csv` so the existing
  `[slug]` route + `getStory` remote pick it up.
- Port `data/copy.json` as-is (its keys already match the field names).

## Staged, testable rollout

1. **DB layer** — add deps; write `$lib/server/db/{index,schema}.ts`;
   `drizzle-kit generate` + create the `.db`; `.env` + `.gitignore` entries.
   Verify a script can read/write `dark_data_survey`.
2. **Fingerprint** — add `@fingerprintjs/fingerprintjs`; port
   `browserFingerprint.ts`. Verify it returns an ID in-browser.
3. **Survey UI** — port survey components with scrolly-kit swaps; register in
   `stories.csv`; render the story statically (no persistence yet).
4. **Wire persistence** — port `survey.remote.ts` against the DB; verify
   end-to-end save.
5. **Consent + demographics** — port `ConsentPopup` + `DemographicsBox`; verify
   the full flow (consent → answers persisted → demographics persisted).

## Out of scope

- Migrating the 16 existing rows from `complex_stories` (start empty).
- Cross-story analytics / data-pipeline ETL (future work).
- The unrelated `ic2s2_survey` table.
