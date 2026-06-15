# Survey Story Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate `survey-story-1` from `my-svelte-blog` into `complexforms` on `@the-vcsi/scrolly-kit`, backed by a local SQLite DB (better-sqlite3 + Drizzle) behind the existing remote-function interface, keeping fingerprinting, the consent gate, and demographics.

**Architecture:** Four isolated layers — Story UI (`Index.svelte`) → survey UI components → persistence interface (`survey.remote.ts`) → DB layer (`$lib/server/db`). The DB is the only engine-aware code, so it can be swapped to Postgres per-project later. Pure field logic is extracted to `survey.fields.ts` so it's unit-testable without SvelteKit/DB imports.

**Tech Stack:** SvelteKit (Svelte 5 runes, remote functions), `@the-vcsi/scrolly-kit`, Drizzle ORM + `better-sqlite3`, `bits-ui`, `@fingerprintjs/fingerprintjs`, valibot, vitest.

**Source of truth (read-only reference):** `/users/j/s/jstonge1/my-svelte-blog/src/lib/...` — the original story. We are porting, not editing it.

---

## File Structure

**Create:**
- `src/lib/server/db/schema.ts` — Drizzle `sqliteTable` (only fields this story uses) + `SurveyField` type.
- `src/lib/server/db/index.ts` — better-sqlite3 Drizzle client (the only engine-aware file).
- `src/lib/utils/browserFingerprint.ts` — fingerprint util (ported as-is).
- `src/lib/stories/survey-story-1/data/copy.json` — content (ported as-is).
- `src/lib/stories/survey-story-1/data/survey.fields.ts` — pure field logic (`validFields`, `isValidField`, `processValue`).
- `src/lib/stories/survey-story-1/data/survey.remote.ts` — `saveAnswer` command + `getSurveyResponse` query.
- `src/lib/stories/survey-story-1/components/Index.svelte` — story entry point.
- `src/lib/stories/survey-story-1/components/SurveyScrolly.svelte` — survey scrolly (scrolly-kit `Scrolly`).
- `src/lib/stories/survey-story-1/components/SurveyQuestion.svelte` — question dispatcher + save feedback.
- `src/lib/stories/survey-story-1/components/SurveyQuestion.Radio.svelte` — radio (bits-ui).
- `src/lib/stories/survey-story-1/components/SurveyQuestion.Checkbox.svelte` — checkbox (native).
- `src/lib/stories/survey-story-1/components/ConsentPopup.svelte` — consent modal.
- `src/lib/stories/survey-story-1/components/DemographicsBox.svelte` — demographics selects.
- `drizzle.config.ts` — drizzle-kit config (root).
- `vitest.config.ts` — test config (root).
- `tests/survey.fields.test.ts` — unit tests for field logic.
- `.env` (gitignored) + `.env.example` (committed).

**Modify:**
- `package.json` — deps + scripts.
- `src/lib/data/stories.csv` — add `survey-story-1` row.

**Unchanged (already correct):** `src/routes/[slug]/+page.svelte`, `+page.ts`, `src/lib/story.remote.ts` (auto-discover the new story), `src/lib/styles/app.css` (already imports scrolly-kit styles), `svelte.config.js` (remote functions + async already enabled). `.gitignore` already ignores `*.db` and `.env*`.

---

## Task 1: Dependencies

**Files:** Modify `package.json`.

- [ ] **Step 1: Install runtime + dev deps**

```bash
cd /users/j/s/jstonge1/complexforms
npm i drizzle-orm better-sqlite3 bits-ui @fingerprintjs/fingerprintjs
npm i -D drizzle-kit @types/better-sqlite3 vitest
```

- [ ] **Step 2: Verify install**

Run: `node -e "require('better-sqlite3'); console.log('ok')"`
Expected: prints `ok` (native module loaded on linux-x64).

- [ ] **Step 3: Add scripts to package.json**

In `package.json` `"scripts"`, add:

```json
"db:push": "drizzle-kit push",
"db:generate": "drizzle-kit generate",
"test": "vitest run"
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add drizzle, better-sqlite3, bits-ui, fingerprintjs, vitest deps"
```

---

## Task 2: DB schema + client

**Files:**
- Create: `src/lib/server/db/schema.ts`
- Create: `src/lib/server/db/index.ts`
- Create: `drizzle.config.ts`
- Create: `.env`, `.env.example`

- [ ] **Step 1: Write the schema**

Create `src/lib/server/db/schema.ts`:

```ts
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql, type InferSelectModel } from 'drizzle-orm';

// Only the fields survey-story-1 actually uses (YAGNI on the rest).
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

- [ ] **Step 2: Write the DB client**

Create `src/lib/server/db/index.ts`:

```ts
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

// Plain filesystem path (better-sqlite3 does not understand file: URLs).
const path = env.DATABASE_URL ?? 'src/lib/stories/survey-story-1/data/survey.db';

const sqlite = new Database(path);
export const db = drizzle(sqlite, { schema });
```

- [ ] **Step 3: Write drizzle.config.ts**

Create `drizzle.config.ts` at repo root:

```ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	dialect: 'sqlite',
	schema: './src/lib/server/db/schema.ts',
	out: './drizzle',
	dbCredentials: { url: 'src/lib/stories/survey-story-1/data/survey.db' }
});
```

- [ ] **Step 4: Write env files**

Create `.env` (gitignored):

```
DATABASE_URL=src/lib/stories/survey-story-1/data/survey.db
```

Create `.env.example` (committed — `.gitignore` already whitelists `!.env.example`):

```
DATABASE_URL=src/lib/stories/survey-story-1/data/survey.db
```

- [ ] **Step 5: Create the data dir and the table**

```bash
mkdir -p src/lib/stories/survey-story-1/data
npm run db:push
```

Expected: drizzle-kit reports creating table `dark_data_survey`; `src/lib/stories/survey-story-1/data/survey.db` now exists.

- [ ] **Step 6: Smoke-test read/write**

Run:

```bash
node -e "
const Database = require('better-sqlite3');
const db = new Database('src/lib/stories/survey-story-1/data/survey.db');
console.log('tables:', db.prepare(\"SELECT name FROM sqlite_master WHERE type='table'\").all());
db.prepare('INSERT INTO dark_data_survey (fingerprint, age) VALUES (?,?)').run('smoke-fp','18-24');
console.log('row:', db.prepare('SELECT fingerprint, age FROM dark_data_survey WHERE fingerprint=?').get('smoke-fp'));
db.prepare('DELETE FROM dark_data_survey WHERE fingerprint=?').run('smoke-fp');
console.log('ok');
"
```

Expected: prints a `dark_data_survey` table, the inserted row `{ fingerprint: 'smoke-fp', age: '18-24' }`, then `ok`.

- [ ] **Step 7: Commit**

```bash
git add src/lib/server/db drizzle.config.ts .env.example
git commit -m "feat(db): sqlite schema + drizzle client for survey-story-1"
```

(The `.db` file and `.env` are gitignored; the committed `schema.ts` + `drizzle.config.ts` are the recreate-source — anyone runs `npm run db:push` to build an empty DB. `npm run db:generate` is available later if you want versioned SQL migrations.)

---

## Task 3: Pure field logic (TDD)

**Files:**
- Create: `vitest.config.ts`
- Create: `tests/survey.fields.test.ts`
- Create: `src/lib/stories/survey-story-1/data/survey.fields.ts`

- [ ] **Step 1: Write vitest config**

Create `vitest.config.ts` at repo root:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: { include: ['tests/**/*.test.ts'] }
});
```

- [ ] **Step 2: Write the failing test**

Create `tests/survey.fields.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { processValue, isValidField } from '../src/lib/stories/survey-story-1/data/survey.fields';

describe('processValue', () => {
	it('joins platformMatters array into a comma string', () => {
		expect(processValue('platformMatters', ['Twitter', 'TikTok'])).toBe('Twitter,TikTok');
	});
	it('keeps socialMediaPrivacy as text', () => {
		expect(processValue('socialMediaPrivacy', 'private')).toBe('private');
	});
	it('keeps age as text (does NOT parseInt)', () => {
		expect(processValue('age', '18-24')).toBe('18-24');
	});
	it('coerces relativePreferences to int', () => {
		expect(processValue('relativePreferences', '5')).toBe(5);
	});
	it('coerces genderOrd to int', () => {
		expect(processValue('genderOrd', '2')).toBe(2);
	});
	it('maps consent to 1', () => {
		expect(processValue('consent', 'accepted')).toBe(1);
	});
});

describe('isValidField', () => {
	it('accepts a known field', () => expect(isValidField('age')).toBe(true));
	it('rejects an unknown field', () => expect(isValidField('nope')).toBe(false));
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `survey.fields` (module does not exist yet).

- [ ] **Step 4: Write the implementation**

Create `src/lib/stories/survey-story-1/data/survey.fields.ts`:

```ts
import type { SurveyField } from '$lib/server/db/schema';

// type-only import above is erased at runtime, so vitest needs no $lib alias.

export const validFields: SurveyField[] = [
	'consent',
	'socialMediaPrivacy',
	'platformMatters',
	'relativePreferences',
	'age',
	'genderOrd',
	'orientationOrd',
	'raceOrd'
];

// Fields stored as integers in the DB.
const numericFields: SurveyField[] = [
	'relativePreferences',
	'genderOrd',
	'orientationOrd',
	'raceOrd'
];

export function isValidField(field: string): field is SurveyField {
	return (validFields as string[]).includes(field);
}

export function processValue(
	field: SurveyField,
	value: string | number | string[]
): string | number {
	if (field === 'platformMatters' && Array.isArray(value)) {
		return value.join(',');
	}
	if (field === 'consent') {
		return 1;
	}
	if (numericFields.includes(field) && typeof value === 'string') {
		return parseInt(value, 10);
	}
	return value as string | number;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — all 8 assertions green.

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts tests/survey.fields.test.ts src/lib/stories/survey-story-1/data/survey.fields.ts
git commit -m "feat(survey): pure field logic with unit tests"
```

---

## Task 4: Persistence interface (remote functions)

**Files:** Create `src/lib/stories/survey-story-1/data/survey.remote.ts`

- [ ] **Step 1: Write the remote functions**

Create `src/lib/stories/survey-story-1/data/survey.remote.ts`:

```ts
import * as v from 'valibot';
import { command, query } from '$app/server';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { darkDataSurvey } from '$lib/server/db/schema';
import { isValidField, processValue } from './survey.fields';

// Single entry point for saving a survey answer (upsert by fingerprint).
// better-sqlite3 is synchronous, so .get()/.run() are called without await.
export const saveAnswer = command(
	v.object({
		fingerprint: v.string(),
		field: v.string(),
		value: v.union([v.number(), v.string(), v.array(v.string())])
	}),
	async (data) => {
		const { fingerprint, field } = data;
		if (!isValidField(field)) throw new Error(`Invalid field: ${field}`);

		const value = processValue(field, data.value);

		const existing = db
			.select()
			.from(darkDataSurvey)
			.where(eq(darkDataSurvey.fingerprint, fingerprint))
			.get();

		if (!existing) {
			db.insert(darkDataSurvey).values({ fingerprint, [field]: value }).run();
		} else {
			db.update(darkDataSurvey)
				.set({ [field]: value })
				.where(eq(darkDataSurvey.fingerprint, fingerprint))
				.run();
		}

		return { message: `${field} saved` };
	}
);

export const getSurveyResponse = query(v.string(), async (fingerprint) => {
	const survey = db
		.select()
		.from(darkDataSurvey)
		.where(eq(darkDataSurvey.fingerprint, fingerprint))
		.get();
	return survey ?? null;
});
```

- [ ] **Step 2: Type-check**

Run: `npm run check`
Expected: no errors in `survey.remote.ts` (it will report missing components until later tasks — that's fine; confirm there are no errors in this file specifically).

- [ ] **Step 3: Commit**

```bash
git add src/lib/stories/survey-story-1/data/survey.remote.ts
git commit -m "feat(survey): saveAnswer/getSurveyResponse remote functions over sqlite"
```

---

## Task 5: Fingerprint utility

**Files:** Create `src/lib/utils/browserFingerprint.ts`

- [ ] **Step 1: Port the util**

Create `src/lib/utils/browserFingerprint.ts` (verbatim from source):

```ts
import FingerprintJS, { type Agent } from '@fingerprintjs/fingerprintjs';
import { browser } from '$app/environment';

let fpPromise: Promise<Agent> | null = null;

/** Generate a stable browser fingerprint. Returns '' during SSR. */
export async function generateFingerprint() {
	if (!browser) return '';

	if (!fpPromise) {
		fpPromise = FingerprintJS.load();
	}

	try {
		const fp = await fpPromise;
		const result = await fp.get();
		return result.visitorId;
	} catch (error) {
		console.error('Error generating fingerprint:', error);
		return getFallbackFingerprint();
	}
}

/** Fallback fingerprint using basic browser characteristics. */
function getFallbackFingerprint() {
	const data = {
		userAgent: navigator.userAgent,
		language: navigator.language,
		screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
	};

	const str = JSON.stringify(data);
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	return `fallback-${Math.abs(hash).toString(36)}`;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/utils/browserFingerprint.ts
git commit -m "feat: port browser fingerprint utility"
```

---

## Task 6: Content + registration

**Files:**
- Create: `src/lib/stories/survey-story-1/data/copy.json`
- Modify: `src/lib/data/stories.csv`

- [ ] **Step 1: Copy the content file verbatim**

```bash
cp /users/j/s/jstonge1/my-svelte-blog/src/lib/stories/survey-story-1/data/copy.json \
   src/lib/stories/survey-story-1/data/copy.json
```

Expected: file contains `title`, `subtitle`, `authors`, `date`, `intro`, `survey`, `postSurvey`, `appendix`.

- [ ] **Step 2: Register the story**

In `src/lib/data/stories.csv`, add a line after the existing example row:

```
survey-story-1,Survey story,Centered survey layout,Jonathan St-Onge,2026-02-03,,survey
```

(Columns: `slug,title,description,author,date,externalUrl,tags`. No commas inside fields; the dsv plugin leaves the hyphenated date as a string.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/stories/survey-story-1/data/copy.json src/lib/data/stories.csv
git commit -m "feat(survey): add copy.json and register survey-story-1"
```

---

## Task 7: Question components

**Files:**
- Create: `src/lib/stories/survey-story-1/components/SurveyQuestion.Radio.svelte`
- Create: `src/lib/stories/survey-story-1/components/SurveyQuestion.Checkbox.svelte`
- Create: `src/lib/stories/survey-story-1/components/SurveyQuestion.svelte`

- [ ] **Step 1: Port the Radio component (bits-ui)**

Create `src/lib/stories/survey-story-1/components/SurveyQuestion.Radio.svelte`. Copy the source file verbatim from:
`/users/j/s/jstonge1/my-svelte-blog/src/lib/components/survey/SurveyQuestion.Radio.svelte`
(no edits needed — it imports only `bits-ui`, which is now installed). Verify the copied file still begins with `import { RadioGroup, Label } from "bits-ui";` and ends with the `</style>` block containing `@keyframes fadeInOut`.

```bash
cp /users/j/s/jstonge1/my-svelte-blog/src/lib/components/survey/SurveyQuestion.Radio.svelte \
   src/lib/stories/survey-story-1/components/SurveyQuestion.Radio.svelte
```

- [ ] **Step 2: Port the Checkbox component (native inputs)**

```bash
cp /users/j/s/jstonge1/my-svelte-blog/src/lib/components/survey/SurveyQuestion.Checkbox.svelte \
   src/lib/stories/survey-story-1/components/SurveyQuestion.Checkbox.svelte
```

(No edits — it uses only native `<input type="checkbox">` and Svelte runes.)

- [ ] **Step 3: Port the SurveyQuestion dispatcher with updated imports**

Create `src/lib/stories/survey-story-1/components/SurveyQuestion.svelte`:

```svelte
<script lang="ts">
	import RadioQuestion from './SurveyQuestion.Radio.svelte';
	import CheckboxQuestion from './SurveyQuestion.Checkbox.svelte';
	import type { SurveyField } from '$lib/server/db/schema';

	let {
		question,
		name,
		value = $bindable(),
		options,
		multiple = false,
		userFingerprint,
		saveAnswer
	}: {
		question: string;
		name: SurveyField;
		value: string | string[];
		options: { value: string; label: string }[];
		multiple?: boolean;
		userFingerprint: string;
		saveAnswer: (field: SurveyField, value: string | number | string[]) => Promise<unknown>;
	} = $props();

	let saveStatus: 'idle' | 'saving' | 'saved' | 'error' = $state('idle');
	let saveMessage = $state('');

	async function handleSave() {
		saveStatus = 'saving';
		saveMessage = 'Saving...';
		try {
			await saveAnswer(name, value);
			saveStatus = 'saved';
			saveMessage = 'Saved ✓';
			setTimeout(() => {
				saveStatus = 'idle';
				saveMessage = '';
			}, 2000);
		} catch (error) {
			console.error('Failed to save answer:', error);
			saveStatus = 'error';
			saveMessage = 'Error ✗';
			setTimeout(() => {
				saveStatus = 'idle';
				saveMessage = '';
			}, 3000);
		}
	}
</script>

{#if multiple}
	<CheckboxQuestion
		{question}
		{name}
		bind:value={value as string[]}
		{options}
		onchange={handleSave}
		{saveStatus}
		{saveMessage}
	/>
{:else}
	<RadioQuestion
		{question}
		{name}
		bind:value={value as string}
		{options}
		onchange={handleSave}
		{saveStatus}
		{saveMessage}
	/>
{/if}
```

- [ ] **Step 4: Validate Svelte with the svelte MCP autofixer**

Use the svelte MCP `svelte-autofixer` on `SurveyQuestion.svelte` (and the two copied files) to confirm Svelte 5 correctness; apply any fixes it returns.

- [ ] **Step 5: Commit**

```bash
git add src/lib/stories/survey-story-1/components/SurveyQuestion*.svelte
git commit -m "feat(survey): port question components (radio/checkbox/dispatcher)"
```

---

## Task 8: SurveyScrolly (scrolly-kit swap)

**Files:** Create `src/lib/stories/survey-story-1/components/SurveyScrolly.svelte`

This replaces the source's `<script module>` snippet export with a regular component, and swaps the blog's `Scrolly`/`renderTextContent` for scrolly-kit's `Scrolly`/`RenderContent`. The component owns its own scroll index (Index.svelte never used it).

- [ ] **Step 1: Write the component**

Create `src/lib/stories/survey-story-1/components/SurveyScrolly.svelte`:

```svelte
<script lang="ts">
	import { Scrolly, RenderContent } from '@the-vcsi/scrolly-kit';
	import Question from './SurveyQuestion.svelte';
	import type { SurveyField } from '$lib/server/db/schema';

	type SurveyItem = {
		type: 'question' | 'text';
		value: {
			question: string;
			name: SurveyField;
			options: { value: string; label: string }[];
			multiple?: boolean;
			text?: string;
		};
	};

	let {
		items,
		userFingerprint,
		saveAnswer,
		surveyAnswers
	}: {
		items: SurveyItem[];
		userFingerprint: string;
		saveAnswer: (field: SurveyField, value: string | number | string[]) => Promise<unknown>;
		surveyAnswers: Partial<Record<SurveyField, string | string[]>>;
	} = $props();

	let scrollyIndex = $state(0);
</script>

<div class="scrolly-content survey-scrolly">
	<Scrolly bind:value={scrollyIndex}>
		{#each items as item, i}
			{@const active = scrollyIndex === i}
			<div class="step" class:active>
				<div class="step-content">
					{#if item.type === 'question'}
						<Question
							question={item.value.question}
							name={item.value.name}
							bind:value={surveyAnswers[item.value.name] as string | string[]}
							options={item.value.options}
							multiple={item.value.multiple || false}
							{userFingerprint}
							{saveAnswer}
						/>
					{:else}
						<RenderContent items={item} />
					{/if}
				</div>
			</div>
		{/each}
	</Scrolly>
	<div class="spacer"></div>
</div>
```

- [ ] **Step 2: Validate with svelte MCP autofixer**

Run the svelte MCP `svelte-autofixer` on `SurveyScrolly.svelte`; apply any returned fixes (e.g. `{#each}` keying if it suggests one).

- [ ] **Step 3: Commit**

```bash
git add src/lib/stories/survey-story-1/components/SurveyScrolly.svelte
git commit -m "feat(survey): SurveyScrolly using scrolly-kit Scrolly + RenderContent"
```

---

## Task 9: Consent + demographics components

**Files:**
- Create: `src/lib/stories/survey-story-1/components/ConsentPopup.svelte`
- Create: `src/lib/stories/survey-story-1/components/DemographicsBox.svelte`

- [ ] **Step 1: Port ConsentPopup with updated type import**

Copy from source, then confirm the import path. Create `src/lib/stories/survey-story-1/components/ConsentPopup.svelte` with the source content from
`/users/j/s/jstonge1/my-svelte-blog/src/lib/stories/survey-story-1/components/ConsentPopup.svelte`.
The only line to verify is the type import at the top — it must read:

```ts
import type { SurveyField } from '$lib/server/db/schema';
```

(That path already resolves to the new schema. The rest — `onAccept`/`userFingerprint`/`saveAnswer` props, the overlay markup, and styles — is copied verbatim.)

- [ ] **Step 2: Port DemographicsBox (renamed from Survey.DemographicsBox)**

Create `src/lib/stories/survey-story-1/components/DemographicsBox.svelte` with the source content from
`/users/j/s/jstonge1/my-svelte-blog/src/lib/stories/survey-story-1/components/Survey.DemographicsBox.svelte`.
Verify its type import is `import type { SurveyField } from '$lib/server/db/schema';` and that it binds `surveyAnswers.age`, `surveyAnswers.genderOrd`, `surveyAnswers.orientationOrd`, `surveyAnswers.raceOrd` (all present in the new schema).

- [ ] **Step 3: Validate both with svelte MCP autofixer**

Run the svelte MCP `svelte-autofixer` on both files; apply fixes (note: source `ConsentPopup` uses `onclick` on a `<div>` overlay — if the autofixer flags the missing keyboard handler / a11y, add an `onkeydown` + `role`/`tabindex` or a `<button>` overlay as it recommends).

- [ ] **Step 4: Commit**

```bash
git add src/lib/stories/survey-story-1/components/ConsentPopup.svelte src/lib/stories/survey-story-1/components/DemographicsBox.svelte
git commit -m "feat(survey): port consent popup and demographics box"
```

---

## Task 10: Index.svelte (orchestration + scrolly-kit swaps)

**Files:** Create `src/lib/stories/survey-story-1/components/Index.svelte`

- [ ] **Step 1: Write the story entry point**

Create `src/lib/stories/survey-story-1/components/Index.svelte`:

```svelte
<script lang="ts">
	import { generateFingerprint } from '$lib/utils/browserFingerprint.js';
	import { StoryHeader, ScrollIndicator, RenderContent, Footer } from '@the-vcsi/scrolly-kit';
	import BackToHome from '$lib/components/helpers/BackToHome.svelte';
	import ConsentPopup from './ConsentPopup.svelte';
	import DemographicsBox from './DemographicsBox.svelte';
	import SurveyScrolly from './SurveyScrolly.svelte';
	import { saveAnswer as saveAnswerRemote, getSurveyResponse } from '../data/survey.remote.js';
	import type { SurveyField } from '$lib/server/db/schema';

	let { story, data } = $props();

	let hasConsented = $state(false);
	let checkingConsent = $state(true);
	let userFingerprint = $state('');

	let surveyAnswers: Partial<Record<SurveyField, string | string[]>> = $state({
		socialMediaPrivacy: '',
		platformMatters: [],
		relativePreferences: '',
		age: '',
		genderOrd: '',
		orientationOrd: '',
		raceOrd: ''
	});

	async function checkExistingConsent() {
		try {
			userFingerprint = await generateFingerprint();
			const survey = await getSurveyResponse(userFingerprint);
			hasConsented = !!survey?.consent;
		} catch (err) {
			console.error('Failed to check existing consent:', err);
		} finally {
			checkingConsent = false;
		}
	}

	$effect(() => {
		checkExistingConsent();
	});

	async function handleConsentAccept() {
		hasConsented = true;
		try {
			userFingerprint ||= await generateFingerprint();
			await saveAnswer('consent', 'accepted');
		} catch (err) {
			console.error('Failed to save consent:', err);
		}
	}

	let saveAnswer = $derived((field: SurveyField, value: string | number | string[]) => {
		if (!userFingerprint) return Promise.resolve();
		return saveAnswerRemote({ fingerprint: userFingerprint, field, value });
	});
</script>

{#if !checkingConsent && !hasConsented}
	<ConsentPopup onAccept={handleConsentAccept} {userFingerprint} {saveAnswer} />
{/if}

<BackToHome />
<ScrollIndicator />

<article class="story theme-dark" id="dark-data-survey">
	<StoryHeader {...data} />

	<section id="intro" class="prose">
		<RenderContent items={data.intro} />
	</section>

	<section id="survey">
		<SurveyScrolly items={data.survey} {userFingerprint} {saveAnswer} {surveyAnswers} />
	</section>

	<section id="demographics" class="prose">
		<RenderContent items={data.postSurvey} />
		<DemographicsBox {userFingerprint} {saveAnswer} {surveyAnswers} />
	</section>

	<h2 class="prose">Appendix</h2>
	<section id="appendix" class="prose">
		<RenderContent items={data.appendix} />
	</section>
</article>

<Footer theme="dark" />

<style>
	.story {
		--vcsi-story-bg: rgb(26, 26, 26);
		--vcsi-story-fg: whitesmoke;
	}

	/* Survey step boxes render light so the question controls (which use dark
	   text) stay readable against the dark story background. */
	:global(#dark-data-survey .survey-scrolly .step > *) {
		padding: 1rem;
		background: #f5f5f5;
		color: #333;
		border-radius: 5px;
		box-shadow: 1px 1px 10px rgba(0, 0, 0, 0.2);
		transition: all 500ms ease;
		text-align: center;
		max-width: 600px;
		margin: 0 auto;
	}
</style>
```

- [ ] **Step 2: Validate with svelte MCP autofixer**

Run the svelte MCP `svelte-autofixer` on `Index.svelte`; apply any returned fixes.

- [ ] **Step 3: Type-check the whole project**

Run: `npm run check`
Expected: 0 errors. (Warnings from copied a11y markup are acceptable if the autofixer didn't rewrite them, but there should be no type errors.)

- [ ] **Step 4: Commit**

```bash
git add src/lib/stories/survey-story-1/components/Index.svelte
git commit -m "feat(survey): Index.svelte on scrolly-kit (StoryHeader/RenderContent/Footer)"
```

---

## Task 11: End-to-end verification

**Files:** none (verification only).

- [ ] **Step 1: Start the dev server**

Run: `npm run dev` (background it or use a separate terminal).
Expected: server starts on a local port with no startup errors.

- [ ] **Step 2: Load the story**

Open `http://localhost:5173/survey-story-1` (use the port the dev server printed).
Expected:
- The consent popup appears first (no prior consent for a fresh fingerprint).
- Clicking "I Consent" dismisses it; the dark story renders with header, intro prose, the survey scrolly (light step boxes), demographics selects, and the footer.

- [ ] **Step 3: Verify persistence end-to-end**

In the browser: answer a radio question (e.g. social media privacy), tick a checkbox option, pick a demographics select. Each should flash "Saving…/Saved ✓".

Then confirm the rows landed in SQLite:

```bash
node -e "
const Database = require('better-sqlite3');
const db = new Database('src/lib/stories/survey-story-1/data/survey.db');
console.table(db.prepare('SELECT fingerprint, consent, social_media_privacy, platform_matters, relative_preferences, age, gender_ord FROM dark_data_survey').all());
"
```

Expected: a row keyed by your browser fingerprint with `consent=1`, the chosen `social_media_privacy` text, comma-joined `platform_matters`, integer `relative_preferences`/`gender_ord`, and text `age`.

- [ ] **Step 4: Verify consent persistence on reload**

Reload the page.
Expected: the consent popup does NOT reappear (because `getSurveyResponse` returns a row with `consent=1` for the same fingerprint).

- [ ] **Step 5: Clean up the test row (optional)**

```bash
node -e "
const Database = require('better-sqlite3');
const db = new Database('src/lib/stories/survey-story-1/data/survey.db');
db.prepare('DELETE FROM dark_data_survey').run();
console.log('cleared');
"
```

- [ ] **Step 6: Final commit (if the autofixer or check changed anything)**

```bash
git add -A
git commit -m "test: verify survey-story-1 end-to-end" --allow-empty
```

---

## Verification summary (per spec stage)

1. **DB layer** → Task 2 smoke test (Step 6).
2. **Fingerprint** → Task 11 Step 2 (popup needs a fingerprint to check consent).
3. **Survey UI** → Task 11 Step 2 renders without persistence dependency.
4. **Wire persistence** → Task 11 Step 3 (rows in SQLite with correct types).
5. **Consent + demographics** → Task 11 Steps 2–4 (full flow + reload).
