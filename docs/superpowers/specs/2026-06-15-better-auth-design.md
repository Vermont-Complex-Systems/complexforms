# Better-Auth Integration (app-wide auth) — Design

**Date:** 2026-06-15
**Status:** Approved design, pending implementation plan

## Context & goal

The interdisciplinarity story (a paper-annotation tool, to be migrated next) needs
user accounts. Rather than port the original bespoke JWT system or settle for
fingerprint-only, we adopt **better-auth** as app-wide authentication, backed by a
local SQLite DB via Drizzle (the stack we already use for the survey).

This is the **first of two sub-projects**: build and verify auth standalone, then
migrate the interdisciplinarity story on top of it in a separate spec/plan cycle.

**Goal:** email/password accounts + sessions, app-wide, on a new app-level SQLite
DB, with `/login` + `/register` UI and a session indicator in the nav. No story
depends on it yet — it's the foundation the interdisciplinarity story consumes.

## Decisions (and why)

- **better-auth**, not bespoke JWT or fingerprint-only. Maintained library with a
  Drizzle/SQLite adapter and a SvelteKit client; replaces register/login/session
  logic we'd otherwise hand-roll. (User choice.)
- **Auth first as its own sub-project.** Foundational and reusable; cramming it
  into the story migration would make a sprawling, hard-to-verify plan.
- **App-level DB** for auth (`data/app.db`), distinct from the survey's
  self-contained per-story DB.
- **better-auth MCP** (`npx auth@latest mcp`) added to `.mcp.json`; use it during
  planning/implementation to confirm exact APIs (it was not live in the
  brainstorming session — needs an MCP-config reload to connect).

## DB topology — 3-tier convention

To keep things tidy as stories multiply (and because most stories need no DB and
no auth), the project uses three tiers:

1. **No DB** — static/visualization stories (the majority). They never import the
   app DB or `$lib/server/auth`; auth imposes nothing on them.
2. **App DB** — `$lib/server/db` → `data/app.db`. The **default** for any concern
   that persists shared/cross-user data: auth now, the interdisciplinarity
   annotations later. Stays **one DB, one drizzle config, one `db:push`**; the
   schema is organized as a folder (`$lib/server/db/schema/auth.ts`,
   `…/<domain>.ts`) combined in a barrel that drizzle points at. New data-backed
   stories add a schema file, not a new config — so no config proliferation.
3. **Per-story DB** — the deliberate exception for a story meant to be
   self-contained / handed to another group (the survey). Co-located db + config +
   `db:push:<slug>`.

Auth and interdisciplinarity are tier 2; the survey is tier 3.

## Architecture (units & boundaries)

1. **App DB client** — `$lib/server/db/index.ts`: better-sqlite3 at `data/app.db`
   (hardcoded constant — deliberately NOT `DATABASE_URL`, which the relocated
   survey DB keeps for its own file, so the two never clash),
   `drizzle(sqlite, { schema })`.
2. **App schema folder** — `$lib/server/db/schema/`:
   - `auth.ts` — the better-auth tables (`user`, `session`, `account`,
     `verification`), generated via `@better-auth/cli generate`.
   - `index.ts` — barrel re-exporting all schema modules; drizzle config points
     here.
3. **Auth server** — `$lib/server/auth.ts`:
   `betterAuth({ database: drizzleAdapter(db, { provider: 'sqlite' }), emailAndPassword: { enabled: true }, secret, baseURL })`.
4. **Route handler** — `src/routes/api/auth/[...all]/+server.ts`: mounts
   `auth.handler` for GET/POST (better-auth's SvelteKit handler).
5. **Session middleware** — `src/hooks.server.ts`: resolves the better-auth
   session and populates `event.locals.user` / `event.locals.session`.
6. **Client** — `$lib/auth-client.ts`: `createAuthClient({ baseURL })` exposing
   `signUp` / `signIn` / `signOut` / `useSession`.
7. **UI** — `/login` and `/register` routes under `(app)` (email/password forms
   calling the client), plus a session indicator in `Header.svelte` (a "Log in"
   link when signed out; a small user menu with "Log out" when signed in).
8. **Config** — gitignored `.env`: `BETTER_AUTH_SECRET` (random), `BETTER_AUTH_URL`
   (`http://localhost:5173` in dev). `data/app.db` gitignored (`*.db` already is).
   App tables created with `npm run db:push`.

## App.d.ts

Declare `App.Locals` `user` / `session` types so server code is typed.

## Survey relocation (tier 3)

The survey's DB currently sits in the app-level `$lib/server/db` — wrong tier.
Relocate it to be story-local:

- Move `$lib/server/db/{index,schema}.ts` (the survey versions) →
  `$lib/stories/survey-story-1/data/{db.ts,schema.ts}`.
- Update imports: `survey.remote.ts` (`$lib/server/db` → `./db`,
  `$lib/server/db/schema` → `./schema`) and `survey.fields.ts`
  (`$lib/server/db/schema` → `./schema`).
- Survey drizzle config → `drizzle.survey.config.ts` (points at the story schema +
  `survey.db`); script `db:push:survey`. The default `drizzle.config.ts` +
  `db:push` now target the app DB.
- Re-verify the survey end-to-end after the move (it must still save answers).

## Scope (YAGNI)

In scope: email/password sign-up, sign-in, sign-out, session persistence; the DB
restructure + 3-tier convention; login/register UI + nav indicator.

Out of scope (deferred): OAuth/social providers; email-verification flow (no mailer
configured — `requireEmailVerification: false`); route-gating/authorization (auth
exists but no routes are protected yet); ORCID/OpenAlex profile fields and the
my-papers feature (these belong to the interdisciplinarity cycle); password reset.

## Verification

1. `npm run db:push` creates `user`/`session`/`account`/`verification` in
   `data/app.db` (inspect with sqlite).
2. Register a new user via `/register` → row in `user`; session cookie set;
   redirected to a signed-in state.
3. Header shows the signed-in indicator; "Log out" clears the session; "Log in"
   re-authenticates.
4. Survey story still saves answers (relocation didn't break it).
5. `svelte-check` clean; the survey field unit tests still pass.

## Next sub-project (not this spec)

Interdisciplinarity story migration: local data layer for annotations/stats/
agreement (tier-2 app DB), OpenAlex paper population via `@the-vcsi/openalex`,
the 12-component UI on scrolly-kit, consuming this auth (logged-in vs anonymous
fingerprint, my-papers via ORCID/OpenAlex).
