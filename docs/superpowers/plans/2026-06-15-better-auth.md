# Better-Auth Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** App-wide email/password auth via better-auth, backed by a new app-level SQLite DB (Drizzle + better-sqlite3), with login/register UI and a nav session indicator.

**Architecture:** Establish the 3-tier DB convention — relocate the survey to a story-local DB (tier 3), and make `$lib/server/db` the app DB (tier 2) holding better-auth's tables. better-auth is wired via `$lib/server/auth.ts` (drizzle adapter), `hooks.server.ts` (`svelteKitHandler` + session→locals), and a Svelte client. No routes are gated yet; this is the foundation the interdisciplinarity story will consume.

**Tech Stack:** SvelteKit (Svelte 5 runes), better-auth `^1.6` + `@better-auth/drizzle-adapter`, Drizzle ORM + better-sqlite3, valibot (existing).

**Grounded API facts (better-auth 1.6.x, from docs):**
- Adapter: `import { drizzleAdapter } from '@better-auth/drizzle-adapter'`; `drizzleAdapter(db, { provider: 'sqlite' })`.
- Server: `import { betterAuth } from 'better-auth'`; `import { sveltekitCookies } from 'better-auth/svelte-kit'`; `import { getRequestEvent } from '$app/server'`.
- Hooks: `import { svelteKitHandler } from 'better-auth/svelte-kit'`; `auth.api.getSession({ headers })`.
- Client: `import { createAuthClient } from 'better-auth/svelte'`; `authClient.signUp.email({name,email,password})`, `authClient.signIn.email({email,password})`, `authClient.signOut()`, `authClient.useSession()` (returns a Svelte store).
- Schema gen CLI: `npx auth@latest generate`. Secret: `npx auth@latest secret` or `openssl rand -base64 32`.
- The `svelteKitHandler` in hooks intercepts `/api/auth/*` — no catch-all `+server.ts` route is needed.

---

## File Structure

**Survey relocation (tier 3):**
- Create `src/lib/stories/survey-story-1/data/schema.ts` — survey Drizzle schema (moved).
- Create `src/lib/stories/survey-story-1/data/db.ts` — survey DB client (moved).
- Modify `src/lib/stories/survey-story-1/data/survey.remote.ts` — repoint db/schema imports.
- Modify `src/lib/stories/survey-story-1/data/survey.fields.ts` — repoint type import.
- Create `drizzle.survey.config.ts` — survey drizzle-kit config.

**App DB + auth (tier 2):**
- Replace `src/lib/server/db/index.ts` — app DB client (`data/app.db`).
- Delete `src/lib/server/db/schema.ts`; create `src/lib/server/db/schema/index.ts` (barrel) + `src/lib/server/db/schema/auth.ts` (generated).
- Create `src/lib/server/auth.ts` — betterAuth config.
- Create `src/lib/auth-client.ts` — client.
- Create `src/hooks.server.ts` — session + svelteKitHandler.
- Modify `src/app.d.ts` — `App.Locals` types.
- Modify `drizzle.config.ts` — repoint to app schema + `data/app.db`.
- Modify `package.json` — deps + `db:push` (app) / `db:push:survey` scripts.
- Create `data/.gitkeep`; modify `.env` — `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`.

**UI:**
- Create `src/routes/(app)/login/+page.svelte`, `src/routes/(app)/register/+page.svelte`.
- Modify `src/lib/components/Header.svelte` — session indicator.

---

## Task 1: Relocate survey DB to story-local (tier 3)

**Files:**
- Create: `src/lib/stories/survey-story-1/data/schema.ts`, `src/lib/stories/survey-story-1/data/db.ts`, `drizzle.survey.config.ts`
- Modify: `src/lib/stories/survey-story-1/data/survey.remote.ts`, `src/lib/stories/survey-story-1/data/survey.fields.ts`, `package.json`

- [ ] **Step 1: Create the story-local schema**

Create `src/lib/stories/survey-story-1/data/schema.ts` (identical content to the current `src/lib/server/db/schema.ts`):

```ts
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql, type InferSelectModel } from 'drizzle-orm';

export const darkDataSurvey = sqliteTable('dark_data_survey', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	fingerprint: text('fingerprint').notNull().unique(),
	consent: integer('consent'),
	socialMediaPrivacy: text('social_media_privacy'),
	platformMatters: text('platform_matters'),
	relativePreferences: integer('relative_preferences'),
	age: text('age'),
	genderOrd: integer('gender_ord'),
	orientationOrd: integer('orientation_ord'),
	raceOrd: integer('race_ord'),
	createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`)
});

export type DarkDataSurvey = InferSelectModel<typeof darkDataSurvey>;
export type SurveyField = keyof Omit<DarkDataSurvey, 'id' | 'fingerprint' | 'createdAt'>;
```

- [ ] **Step 2: Create the story-local DB client**

Create `src/lib/stories/survey-story-1/data/db.ts`:

```ts
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

// Survey is a self-contained (tier-3) story: its DB lives with the story.
const path = env.DATABASE_URL ?? 'src/lib/stories/survey-story-1/data/survey.db';
const sqlite = new Database(path);
export const db = drizzle(sqlite, { schema });
```

- [ ] **Step 3: Repoint survey imports**

In `src/lib/stories/survey-story-1/data/survey.remote.ts`, change the two import lines:

```ts
import { db } from './db';
import { darkDataSurvey } from './schema';
```

In `src/lib/stories/survey-story-1/data/survey.fields.ts`, change the type import:

```ts
import type { SurveyField } from './schema';
```

- [ ] **Step 4: Create the survey drizzle-kit config**

Create `drizzle.survey.config.ts`:

```ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	dialect: 'sqlite',
	schema: './src/lib/stories/survey-story-1/data/schema.ts',
	out: './drizzle/survey',
	dbCredentials: { url: 'src/lib/stories/survey-story-1/data/survey.db' }
});
```

- [ ] **Step 5: Update package.json scripts**

In `package.json` `"scripts"`, replace the `db:push`/`db:generate` lines with:

```json
"db:push": "drizzle-kit push",
"db:push:survey": "drizzle-kit push --config drizzle.survey.config.ts",
"db:generate": "drizzle-kit generate",
```

(`db:push` stays the *app* push and is repointed in Task 3 when `drizzle.config.ts` becomes the app config; `db:push:survey` is the survey-specific push.)

- [ ] **Step 6: Verify survey still works**

Run:
```bash
npm run db:push:survey
npm test
npm run check
```
Expected: `db:push:survey` reports no changes (schema unchanged, just relocated); `npm test` → 8 passing; `npm run check` → 0 errors. (The old `src/lib/server/db/*` files are now unused; Task 3 replaces them.)

- [ ] **Step 7: Commit**

```bash
git add src/lib/stories/survey-story-1/data/schema.ts src/lib/stories/survey-story-1/data/db.ts drizzle.survey.config.ts src/lib/stories/survey-story-1/data/survey.remote.ts src/lib/stories/survey-story-1/data/survey.fields.ts package.json
git commit -m "refactor(db): relocate survey DB to story-local (tier 3)"
```

---

## Task 2: Install better-auth + env + data dir

**Files:** Modify `package.json` (deps), `.env`; create `data/.gitkeep`.

- [ ] **Step 1: Install dependencies**

```bash
cd /users/j/s/jstonge1/complexforms
npm i better-auth @better-auth/drizzle-adapter
```

- [ ] **Step 2: Verify both packages resolve**

Run: `node -e "require.resolve('better-auth'); require.resolve('@better-auth/drizzle-adapter'); console.log('ok')"`
Expected: prints `ok`.

- [ ] **Step 3: Create the app data dir (committed, empty)**

```bash
mkdir -p data && touch data/.gitkeep
```

(`*.db` is already gitignored, so `data/app.db` won't be tracked; `.gitkeep` keeps the dir.)

- [ ] **Step 4: Add auth env vars**

Generate a secret and append to `.env`:
```bash
printf 'BETTER_AUTH_SECRET=%s\nBETTER_AUTH_URL=http://localhost:5173\n' "$(openssl rand -base64 32)" >> .env
```
Verify: `grep -c BETTER_AUTH .env` → `2`. (`.env` is gitignored.)

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json data/.gitkeep
git commit -m "chore: add better-auth deps and app data dir"
```

---

## Task 3: App DB client + auth config + generated schema

**Files:**
- Modify: `src/lib/server/db/index.ts`
- Delete: `src/lib/server/db/schema.ts`
- Create: `src/lib/server/db/schema/index.ts`, `src/lib/server/db/schema/auth.ts`, `src/lib/server/auth.ts`
- Modify: `drizzle.config.ts`

- [ ] **Step 1: Replace the schema file with a schema folder (initially empty barrel)**

Delete `src/lib/server/db/schema.ts`. Create `src/lib/server/db/schema/index.ts`:

```ts
// App DB schema barrel (tier-2). Domain table modules are re-exported here.
export * from './auth';
```

Create a temporary placeholder `src/lib/server/db/schema/auth.ts` so the barrel compiles before generation:

```ts
// Replaced by `npx auth@latest generate` in Step 4.
export {};
```

- [ ] **Step 2: Write the app DB client**

Replace `src/lib/server/db/index.ts`:

```ts
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

// App-level DB (tier 2): auth + cross-cutting shared data.
// Hardcoded path on purpose — NOT DATABASE_URL, which the survey (tier 3) keeps.
const sqlite = new Database('data/app.db');
export const db = drizzle(sqlite, { schema });
```

- [ ] **Step 3: Write the auth config**

Create `src/lib/server/auth.ts`:

```ts
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { db } from './db';

export const auth = betterAuth({
	database: drizzleAdapter(db, { provider: 'sqlite' }),
	emailAndPassword: { enabled: true },
	plugins: [sveltekitCookies(getRequestEvent)]
});
```

- [ ] **Step 4: Generate the auth schema**

Run:
```bash
npx auth@latest generate --output src/lib/server/db/schema/auth.ts -y
```
If the CLI prompts for the config/output instead of accepting flags, point it at `src/lib/server/auth.ts` and output to `src/lib/server/db/schema/auth.ts`, and accept overwrite.
Expected: `src/lib/server/db/schema/auth.ts` now contains Drizzle `sqliteTable` definitions for `user`, `session`, `account`, `verification`. Confirm:
```bash
grep -E "sqliteTable\(\"(user|session|account|verification)\"" src/lib/server/db/schema/auth.ts
```
Expected: matches for all four tables.

- [ ] **Step 5: Repoint the app drizzle config**

Replace `drizzle.config.ts`:

```ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	dialect: 'sqlite',
	schema: './src/lib/server/db/schema',
	out: './drizzle/app',
	dbCredentials: { url: 'data/app.db' }
});
```

- [ ] **Step 6: Create the auth tables**

Run: `npm run db:push`
Expected: drizzle-kit creates `user`, `session`, `account`, `verification` in `data/app.db`.

- [ ] **Step 7: Verify tables exist**

Run:
```bash
node -e "const D=require('better-sqlite3');const db=new D('data/app.db');console.log(db.prepare(\"SELECT name FROM sqlite_master WHERE type='table' ORDER BY name\").all().map(r=>r.name));"
```
Expected: array includes `account`, `session`, `user`, `verification`.

- [ ] **Step 8: Type-check**

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 9: Commit**

```bash
git add src/lib/server/db drizzle.config.ts
git rm --cached src/lib/server/db/schema.ts 2>/dev/null || true
git commit -m "feat(auth): app DB client + better-auth drizzle schema"
```

---

## Task 4: Session wiring (hooks + locals types)

**Files:** Create `src/hooks.server.ts`; modify `src/app.d.ts`.

- [ ] **Step 1: Write the server hook**

Create `src/hooks.server.ts`:

```ts
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';

export async function handle({ event, resolve }) {
	const session = await auth.api.getSession({ headers: event.request.headers });
	event.locals.user = session?.user ?? null;
	event.locals.session = session?.session ?? null;

	return svelteKitHandler({ event, resolve, auth, building });
}
```

- [ ] **Step 2: Type App.Locals**

In `src/app.d.ts`, replace the empty `App` namespace body with:

```ts
import type { auth } from '$lib/server/auth';

declare global {
	namespace App {
		interface Locals {
			user: typeof auth.$Infer.Session.user | null;
			session: typeof auth.$Infer.Session.session | null;
		}
		// prevent typescript error when importing csv with plugin-dsv
	}

	declare module '*.csv' {
		const data: any[];
		export default data;
	}
}

export {};
```

(Preserve the existing `*.csv` module declaration — it currently lives inside the `App` namespace block; move it to module scope as shown.)

- [ ] **Step 3: Type-check**

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/hooks.server.ts src/app.d.ts
git commit -m "feat(auth): session hook + App.Locals types"
```

---

## Task 5: Auth client

**Files:** Create `src/lib/auth-client.ts`.

- [ ] **Step 1: Write the client**

Create `src/lib/auth-client.ts`:

```ts
import { createAuthClient } from 'better-auth/svelte';

export const authClient = createAuthClient();
```

(No `baseURL` needed when the client runs on the same origin as the app.)

- [ ] **Step 2: Type-check**

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/auth-client.ts
git commit -m "feat(auth): svelte auth client"
```

---

## Task 6: Register + Login pages

**Files:** Create `src/routes/(app)/register/+page.svelte`, `src/routes/(app)/login/+page.svelte`.

- [ ] **Step 1: Write the register page**

Create `src/routes/(app)/register/+page.svelte`:

```svelte
<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let error = $state('');
	let submitting = $state(false);

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		submitting = true;
		error = '';
		const { error: err } = await authClient.signUp.email({ name, email, password });
		submitting = false;
		if (err) error = err.message ?? 'Registration failed';
		else goto('/');
	}
</script>

<section class="auth page">
	<h1>Create an account</h1>
	<form onsubmit={handleSubmit}>
		<label>Name<input bind:value={name} required autocomplete="name" /></label>
		<label>Email<input type="email" bind:value={email} required autocomplete="email" /></label>
		<label>Password<input type="password" bind:value={password} required minlength="8" autocomplete="new-password" /></label>
		{#if error}<p class="error">{error}</p>{/if}
		<button type="submit" disabled={submitting}>{submitting ? 'Creating…' : 'Sign up'}</button>
	</form>
	<p>Already have an account? <a href="/login">Log in</a></p>
</section>

<style>
	.auth { max-width: 24rem; margin-inline: auto; padding-block: var(--vcsi-space-2xl, 3rem); }
	form { display: flex; flex-direction: column; gap: var(--vcsi-space-md, 1rem); }
	label { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.95rem; }
	input { padding: 0.55rem 0.65rem; border: 1px solid var(--vcsi-border, #ccc); border-radius: 6px; font: inherit; }
	button { padding: 0.6rem 1rem; border: none; border-radius: 6px; background: var(--vcsi-color-uvm-green, #154734); color: #fff; font-weight: 600; cursor: pointer; }
	button:disabled { opacity: 0.6; cursor: default; }
	.error { color: #b00020; font-size: 0.9rem; margin: 0; }
</style>
```

- [ ] **Step 2: Write the login page**

Create `src/routes/(app)/login/+page.svelte`:

```svelte
<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let submitting = $state(false);

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		submitting = true;
		error = '';
		const { error: err } = await authClient.signIn.email({ email, password });
		submitting = false;
		if (err) error = err.message ?? 'Login failed';
		else goto('/');
	}
</script>

<section class="auth page">
	<h1>Log in</h1>
	<form onsubmit={handleSubmit}>
		<label>Email<input type="email" bind:value={email} required autocomplete="email" /></label>
		<label>Password<input type="password" bind:value={password} required autocomplete="current-password" /></label>
		{#if error}<p class="error">{error}</p>{/if}
		<button type="submit" disabled={submitting}>{submitting ? 'Logging in…' : 'Log in'}</button>
	</form>
	<p>No account? <a href="/register">Sign up</a></p>
</section>

<style>
	.auth { max-width: 24rem; margin-inline: auto; padding-block: var(--vcsi-space-2xl, 3rem); }
	form { display: flex; flex-direction: column; gap: var(--vcsi-space-md, 1rem); }
	label { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.95rem; }
	input { padding: 0.55rem 0.65rem; border: 1px solid var(--vcsi-border, #ccc); border-radius: 6px; font: inherit; }
	button { padding: 0.6rem 1rem; border: none; border-radius: 6px; background: var(--vcsi-color-uvm-green, #154734); color: #fff; font-weight: 600; cursor: pointer; }
	button:disabled { opacity: 0.6; cursor: default; }
	.error { color: #b00020; font-size: 0.9rem; margin: 0; }
</style>
```

- [ ] **Step 3: Validate both with the svelte MCP autofixer**

Run the svelte MCP `svelte-autofixer` on both files; apply any returned fixes (e.g. form/label a11y).

- [ ] **Step 4: Type-check**

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add "src/routes/(app)/login/+page.svelte" "src/routes/(app)/register/+page.svelte"
git commit -m "feat(auth): login and register pages"
```

---

## Task 7: Header session indicator

**Files:** Modify `src/lib/components/Header.svelte`.

- [ ] **Step 1: Import the client and session store**

In `src/lib/components/Header.svelte`, add to the `<script lang="ts">` block (after the existing imports):

```ts
	import { authClient } from '$lib/auth-client';
	const session = authClient.useSession();
```

- [ ] **Step 2: Add the indicator to the header-right**

In the `.header-right` div, immediately before the GitHub `<a class="github-button" …>`, insert:

```svelte
			{#if $session.data}
				<span class="nav-user">{$session.data.user.name}</span>
				<button class="nav-auth" onclick={() => authClient.signOut()}>Log out</button>
			{:else}
				<a class="nav-auth" href="{base}/login">Log in</a>
			{/if}
```

- [ ] **Step 3: Add styles**

In the Header `<style>` block, add:

```css
.nav-user {
	font-family: var(--vcsi-font-sans);
	font-size: 0.95rem;
	color: var(--vcsi-fg);
	align-self: center;
}

.nav-auth {
	font-family: var(--vcsi-font-sans);
	font-size: 1rem;
	font-weight: 500;
	color: var(--vcsi-fg);
	background: transparent;
	border: none;
	cursor: pointer;
	text-decoration: none;
	padding: var(--vcsi-space-sm) 0.75rem;
	border-radius: var(--vcsi-radius-md, 6px);
	transition: background var(--vcsi-transition-base);
}

.nav-auth:hover {
	background: var(--vcsi-hover, rgba(0, 0, 0, 0.05));
}
```

- [ ] **Step 4: Validate with the svelte MCP autofixer**

Run the svelte MCP `svelte-autofixer` on `Header.svelte`; apply any returned fixes.

- [ ] **Step 5: Type-check**

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/components/Header.svelte
git commit -m "feat(auth): nav session indicator (log in / user + log out)"
```

---

## Task 8: End-to-end verification

**Files:** none (verification only).

- [ ] **Step 1: Start the dev server**

Run `npm run dev` (or ask the user to, if they run it). Expected: starts with no errors.

- [ ] **Step 2: Register a user**

Visit `/register`, submit name/email/password (password ≥ 8 chars). Expected: redirect to `/`; the Header shows the user's name + "Log out".

- [ ] **Step 3: Confirm the row landed**

Run:
```bash
node -e "const D=require('better-sqlite3');const db=new D('data/app.db');console.table(db.prepare('SELECT id,name,email FROM user').all());"
```
Expected: one row with the registered name/email.

- [ ] **Step 4: Log out and back in**

Click "Log out" → Header shows "Log in". Visit `/login`, enter the same credentials → redirect to `/`, Header shows the user again. (A `session` row exists: `node -e "const D=require('better-sqlite3');const db=new D('data/app.db');console.log(db.prepare('SELECT count(*) c FROM session').get());"`.)

- [ ] **Step 5: Survey regression**

Visit `/survey-story-1`, answer a question. Confirm it still saves:
```bash
node -e "const D=require('better-sqlite3');const db=new D('src/lib/stories/survey-story-1/data/survey.db');console.log(db.prepare('SELECT count(*) c FROM dark_data_survey').get());"
```
Expected: count ≥ 1 (survey DB untouched by the auth work).

- [ ] **Step 6: Final checks**

Run: `npm run check && npm test`
Expected: 0 errors; 8 survey-field tests pass.

---

## Verification summary (per spec)

- Auth tables in `data/app.db` → Task 3 Step 7.
- Register → user row + session → Task 8 Steps 2–3.
- Logout/login → Task 8 Step 4.
- Survey still works after relocation → Task 1 Step 6 + Task 8 Step 5.
- `svelte-check` clean + survey tests pass → Tasks 3/4/6/7 + Task 8 Step 6.

## Notes for the implementer

- The **better-auth MCP** (`npx auth@latest mcp`, in `.mcp.json`) may be live by implementation time. If so, use it to confirm exact `auth@latest generate` flags and any 1.6.x API nuances before Task 3. If a flag differs, follow the CLI's interactive prompts (generate config = `src/lib/server/auth.ts`, output = `src/lib/server/db/schema/auth.ts`).
- This plan is integration-verified (DB inspection + browser flow + `svelte-check`), not unit-tested — better-auth is config/wiring with no pure logic of ours to unit test. The survey's existing unit tests serve as the relocation regression gate.
