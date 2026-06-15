# Interdisciplinarity MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the interdisciplinarity paper-annotation tool onto a local tier-2 app DB (lazy OpenAlex paper cache + annotations) consuming better-auth, with modes story / csv-queue / overview / stats.

**Architecture:** New tables in the app schema folder (`papers` cache + `paper_annotations`). Story-local `data.remote.ts` replaces the FastAPI proxy; its functions return the **original API's response shapes** so the 12 ported components need only import/wiring tweaks. Dual auth via `getRequestEvent().locals.user` (better-auth) else browser fingerprint. Agreement/stats math ported to a pure, unit-tested helper module.

**Tech Stack:** SvelteKit (Svelte 5 runes, remote functions), better-auth (existing), Drizzle + better-sqlite3 (app DB), `svelteplot` + `d3-interpolate` (charts), `bits-ui` + `@lucide/svelte` (existing), valibot, vitest.

**Source (read-only):** `/users/j/s/jstonge1/complex-stories-dev/frontend/src/lib/stories/interdisciplinarity/`. Backend reference for logic: `/users/j/s/jstonge1/complex-stories-dev/backend/app/routers/interdisciplinarity.py`.

**Grounded facts:**
- Components consume API shapes: paper `{id,title,year,abstract,authors:string[],topics:[{id,display_name,score}],doi,is_open_access}`; annotation `{paper_id, interdisciplinarity_rating, confidence}`; stats `{total_annotations, logged_in_annotations, anonymous_annotations, average_rating, rating_distribution:{1..5:n}, per_paper_counts:{id:n}}`; agreement `{papers:[{paper_id,title,num_annotations,ratings:number[],annotators:string[],pairwise_matrix,agreement_score,std_dev,mean_rating}], total_papers_analyzed, papers_with_high_disagreement}`.
- Component deps: `svelteplot` (RatingBarChart), `d3-interpolate` (AgreementMatrix), `bits-ui` (TopBar Avatar, HelpPopover), `@lucide/svelte` (HelpPopover). Components use `--color-*` CSS vars (not `--vcsi-*`) → a shim maps them.
- `TopBar`/`OverviewTable` couple to deferred modes + `getCurrentUser` → trimmed in this plan.
- `@the-vcsi/openalex` extension is NOT used (unavailable); paper metadata is lazy-fetched + cached.

---

## File Structure

**Data layer (tier-2 app DB):**
- Create `src/lib/server/db/schema/interdisciplinarity.ts` — `papers` + `paperAnnotations` tables.
- Modify `src/lib/server/db/schema/index.ts` — re-export the new module.
- Create `src/lib/stories/interdisciplinarity/data/openalex.ts` — server OpenAlex fetch+map helper.
- Create `src/lib/stories/interdisciplinarity/data/interdisciplinarity.logic.ts` — pure agreement/stats math.
- Create `src/lib/stories/interdisciplinarity/data/data.remote.ts` — remote functions.
- Create `src/lib/stories/interdisciplinarity/data/loader.js` — CSV unique IDs.
- Create `src/lib/stories/interdisciplinarity/data/top_cited_papers_comp_networks.csv` (copied).
- Create `tests/interdisciplinarity.logic.test.ts`.

**UI (story-local):**
- Create `src/lib/stories/interdisciplinarity/components/*` — ported components.
- Create `src/lib/stories/interdisciplinarity/components/Index.svelte` — orchestrator (trimmed modes + token shim).
- Create `src/lib/stories/interdisciplinarity/+layout`? No — uses the existing `[slug]` route.
- Modify `src/lib/data/stories.csv` — register the story.
- Copy `static/insuarity.jpg`, `static/physicists.png`, `static/login.jpg` (from source `static/`).

**Deps:** add `svelteplot`, `d3-interpolate`.

---

## Task 1: Dependencies + static assets + CSV + registration

**Files:** Modify `package.json`, `src/lib/data/stories.csv`; create the CSV + static images + `loader.js`.

- [ ] **Step 1: Install chart deps**

```bash
cd /users/j/s/jstonge1/complexforms
npm i svelteplot d3-interpolate
```

- [ ] **Step 2: Verify resolve**

Run: `node -e "require.resolve('d3-interpolate'); console.log('ok')"` → `ok`. (svelteplot is Svelte-only; checked via build later.)

- [ ] **Step 3: Copy data + static assets**

```bash
SRC=/users/j/s/jstonge1/complex-stories-dev/frontend
mkdir -p src/lib/stories/interdisciplinarity/data src/lib/stories/interdisciplinarity/components
cp "$SRC/src/lib/stories/interdisciplinarity/data/top_cited_papers_comp_networks.csv" src/lib/stories/interdisciplinarity/data/
cp "$SRC/static/insuarity.jpg" "$SRC/static/physicists.png" "$SRC/static/login.jpg" static/
ls src/lib/stories/interdisciplinarity/data/ static/*.jpg static/*.png
```
Expected: CSV present; the three images copied. (If a source image filename differs, list `"$SRC/static"` and copy the actual files the essay references: `insuarity.jpg`, `physicists.png`, `login.jpg`.)

- [ ] **Step 4: Port the CSV loader**

Create `src/lib/stories/interdisciplinarity/data/loader.js`:

```js
import paperIds from './top_cited_papers_comp_networks.csv';

/** Unique OpenAlex paper IDs from the curated CSV (dedupe on oa_wid). */
export function getUniquePaperIds() {
	const unique = new Set();
	for (const row of paperIds) {
		if (row.oa_wid && String(row.oa_wid).trim() !== '') unique.add(String(row.oa_wid).trim());
	}
	return Array.from(unique);
}
```

- [ ] **Step 5: Register the story**

In `src/lib/data/stories.csv`, append:

```
interdisciplinarity,Interdisciplinarity,Annotate how interdisciplinary papers are,Jonathan St-Onge,2026-02-20,,annotation
```

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/lib/stories/interdisciplinarity/data/top_cited_papers_comp_networks.csv src/lib/stories/interdisciplinarity/data/loader.js src/lib/data/stories.csv static/insuarity.jpg static/physicists.png static/login.jpg
git commit -m "chore(interdisc): deps, CSV loader, static assets, story registration"
```

---

## Task 2: DB schema (papers cache + annotations)

**Files:** Create `src/lib/server/db/schema/interdisciplinarity.ts`; modify `src/lib/server/db/schema/index.ts`; modify `drizzle.config.ts` is NOT needed (schema folder already globbed).

- [ ] **Step 1: Write the schema module**

Create `src/lib/server/db/schema/interdisciplinarity.ts`:

```ts
import { integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { user } from './auth';

// Lazy OpenAlex paper cache.
export const papers = sqliteTable('papers', {
	id: text('id').primaryKey(), // OpenAlex work id, e.g. W2118557509
	title: text('title'),
	year: integer('year'),
	abstract: text('abstract'),
	authors: text('authors', { mode: 'json' }).$type<string[]>(),
	topics: text('topics', { mode: 'json' }).$type<{ id: string; display_name: string; score: number }[]>(),
	doi: text('doi'),
	isOpenAccess: integer('is_open_access', { mode: 'boolean' }),
	cachedAt: text('cached_at').default(sql`(CURRENT_TIMESTAMP)`)
});

// Interdisciplinarity annotations; dual auth (better-auth user OR fingerprint).
export const paperAnnotations = sqliteTable(
	'paper_annotations',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		paperId: text('paper_id').notNull(),
		userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
		fingerprint: text('fingerprint'),
		rating: integer('rating').notNull(), // 1-5
		confidence: integer('confidence'), // 1-5, nullable
		createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: text('updated_at')
	},
	(t) => [unique('uniq_paper_annotator').on(t.paperId, t.userId, t.fingerprint)]
);
```

- [ ] **Step 2: Add to the schema barrel**

In `src/lib/server/db/schema/index.ts`, append:

```ts
export * from './interdisciplinarity';
```

- [ ] **Step 3: Create the tables**

Run: `npm run db:push`
Expected: drizzle-kit adds `papers` and `paper_annotations` to `data/app.db` (alongside the auth tables).

- [ ] **Step 4: Verify tables**

Run:
```bash
node -e "const D=require('better-sqlite3');const db=new D('data/app.db');console.log(db.prepare(\"SELECT name FROM sqlite_master WHERE type='table' ORDER BY name\").all().map(r=>r.name));"
```
Expected: includes `papers` and `paper_annotations` (plus auth + sqlite internal).

- [ ] **Step 5: Type-check + commit**

```bash
npm run check 2>&1 | tail -1
git add src/lib/server/db/schema/interdisciplinarity.ts src/lib/server/db/schema/index.ts
git commit -m "feat(interdisc): papers cache + paper_annotations tables"
```
Expected: 0 errors.

---

## Task 3: Pure agreement/stats logic (TDD)

**Files:** Create `src/lib/stories/interdisciplinarity/data/interdisciplinarity.logic.ts`, `tests/interdisciplinarity.logic.test.ts`.

- [ ] **Step 1: Write the failing test**

Create `tests/interdisciplinarity.logic.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { ratingsAgree, computeAgreement } from '../src/lib/stories/interdisciplinarity/data/interdisciplinarity.logic';

describe('ratingsAgree', () => {
	it('equal ratings agree', () => expect(ratingsAgree(2, 2)).toBe(true));
	it('1 and 2 agree (interdisciplinary side)', () => expect(ratingsAgree(1, 2)).toBe(true));
	it('4 and 5 agree (not-interdisciplinary side)', () => expect(ratingsAgree(4, 5)).toBe(true));
	it('3 only agrees with itself', () => {
		expect(ratingsAgree(3, 3)).toBe(true);
		expect(ratingsAgree(3, 2)).toBe(false);
	});
	it('2 and 4 disagree', () => expect(ratingsAgree(2, 4)).toBe(false));
});

describe('computeAgreement', () => {
	const anns = [
		{ paper_id: 'W1', rating: 1, annotator: 'anon_a' },
		{ paper_id: 'W1', rating: 2, annotator: 'anon_b' },
		{ paper_id: 'W1', rating: 5, annotator: 'anon_c' },
		{ paper_id: 'W2', rating: 4, annotator: 'anon_a' } // below minAnnotations
	];
	const titles = { W1: 'Paper One', W2: 'Paper Two' };

	it('only includes papers with >= minAnnotations', () => {
		const out = computeAgreement(anns, titles, 3);
		expect(out.papers.map((p) => p.paper_id)).toEqual(['W1']);
		expect(out.total_papers_analyzed).toBe(1);
	});

	it('computes agreement_score, mean, and a square pairwise matrix', () => {
		const p = computeAgreement(anns, titles, 3).papers[0];
		// pairs: (1,2) agree, (1,5) disagree, (2,5) disagree => 1/3
		expect(p.agreement_score).toBeCloseTo(0.333, 2);
		expect(p.mean_rating).toBeCloseTo(2.67, 1);
		expect(p.num_annotations).toBe(3);
		expect(p.pairwise_matrix.length).toBe(3);
		expect(p.pairwise_matrix[0].length).toBe(3);
		expect(p.title).toBe('Paper One');
	});
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test` → FAIL (module not found).

- [ ] **Step 3: Implement**

Create `src/lib/stories/interdisciplinarity/data/interdisciplinarity.logic.ts`:

```ts
export type AnnRow = { paper_id: string; rating: number; annotator: string };

/** Same-side-of-scale agreement: 1-2 agree, 4-5 agree, 3 only with itself. */
export function ratingsAgree(r1: number, r2: number): boolean {
	if (r1 === r2) return true;
	if (r1 <= 2 && r2 <= 2) return true;
	if (r1 >= 4 && r2 >= 4) return true;
	return false;
}

function stdev(xs: number[]): number {
	if (xs.length < 2) return 0;
	const m = xs.reduce((a, b) => a + b, 0) / xs.length;
	const v = xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1);
	return Math.sqrt(v);
}

export function computeAgreement(
	annotations: AnnRow[],
	titles: Record<string, string>,
	minAnnotations = 3
) {
	const groups = new Map<string, AnnRow[]>();
	for (const a of annotations) {
		if (!groups.has(a.paper_id)) groups.set(a.paper_id, []);
		groups.get(a.paper_id)!.push(a);
	}

	const papers = [];
	for (const [paperId, anns] of groups) {
		if (anns.length < minAnnotations) continue;
		const ratings = anns.map((a) => a.rating);
		const annotators = anns.map((a) => a.annotator);

		const pairwise_matrix = anns.map((_, i) =>
			anns.map((_, j) => ({
				rating: ratings[j],
				agrees: ratingsAgree(ratings[i], ratings[j]),
				diff: Math.abs(ratings[i] - ratings[j])
			}))
		);

		let total = 0;
		let agreeing = 0;
		for (let i = 0; i < ratings.length; i++) {
			for (let j = i + 1; j < ratings.length; j++) {
				total++;
				if (ratingsAgree(ratings[i], ratings[j])) agreeing++;
			}
		}
		const agreement = total > 0 ? agreeing / total : 0;
		const mean = ratings.reduce((a, b) => a + b, 0) / ratings.length;

		papers.push({
			paper_id: paperId,
			title: titles[paperId] ?? paperId,
			num_annotations: ratings.length,
			ratings,
			annotators,
			pairwise_matrix,
			agreement_score: Math.round(agreement * 1000) / 1000,
			std_dev: Math.round(stdev(ratings) * 1000) / 1000,
			mean_rating: Math.round(mean * 100) / 100
		});
	}

	papers.sort((a, b) => a.agreement_score - b.agreement_score);
	return {
		papers,
		total_papers_analyzed: papers.length,
		papers_with_high_disagreement: papers.filter((p) => p.agreement_score < 0.6).length
	};
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test`
Expected: the new tests pass (plus the existing 8 survey tests).

- [ ] **Step 5: Commit**

```bash
git add tests/interdisciplinarity.logic.test.ts src/lib/stories/interdisciplinarity/data/interdisciplinarity.logic.ts
git commit -m "feat(interdisc): pure agreement/stats logic with unit tests"
```

---

## Task 4: OpenAlex fetch helper

**Files:** Create `src/lib/stories/interdisciplinarity/data/openalex.ts`.

- [ ] **Step 1: Write the helper** (ported from the backend's `get_paper_by_id`)

Create `src/lib/stories/interdisciplinarity/data/openalex.ts`:

```ts
const MAILTO = 'complex-stories@uvm.edu';

export type Paper = {
	id: string;
	title: string;
	year: number | null;
	abstract: string;
	authors: string[];
	topics: { id: string; display_name: string; score: number }[];
	doi: string | null;
	is_open_access: boolean;
};

function reconstructAbstract(inverted: Record<string, number[]> | null | undefined): string {
	if (!inverted) return '';
	const words: Record<number, string> = {};
	for (const [word, positions] of Object.entries(inverted)) {
		for (const pos of positions) words[pos] = word;
	}
	return Object.keys(words)
		.map(Number)
		.sort((a, b) => a - b)
		.map((i) => words[i])
		.join(' ');
}

/** Fetch a single work from OpenAlex and map to our Paper shape. Throws on not-found. */
export async function fetchPaperFromOpenAlex(paperId: string): Promise<Paper> {
	if (!/^W\d+$/.test(paperId)) throw new Error(`Invalid OpenAlex paper ID: ${paperId}`);

	const params = new URLSearchParams({
		filter: `openalex:https://openalex.org/${paperId}`,
		select: 'id,title,publication_year,abstract_inverted_index,authorships,topics,doi,open_access'
	});
	const res = await fetch(`https://api.openalex.org/works?${params}`, {
		headers: { 'User-Agent': `mailto:${MAILTO}` }
	});
	if (!res.ok) throw new Error(`OpenAlex error ${res.status}`);
	const data = await res.json();
	const work = data.results?.[0];
	if (!work) throw new Error(`Paper ${paperId} not found in OpenAlex`);

	return {
		id: paperId,
		title: work.title ?? 'Untitled',
		year: work.publication_year ?? null,
		abstract: reconstructAbstract(work.abstract_inverted_index),
		authors: (work.authorships ?? []).slice(0, 5).map((a: any) => a.author?.display_name ?? 'Unknown'),
		topics: (work.topics ?? []).slice(0, 3).map((t: any) => ({
			id: t.id ?? '',
			display_name: t.display_name ?? '',
			score: t.score ?? 0
		})),
		doi: work.doi ?? null,
		is_open_access: work.open_access?.is_oa ?? false
	};
}
```

- [ ] **Step 2: Type-check + commit**

```bash
npm run check 2>&1 | tail -1
git add src/lib/stories/interdisciplinarity/data/openalex.ts
git commit -m "feat(interdisc): OpenAlex fetch+map helper"
```
Expected: 0 errors.

---

## Task 5: Remote functions (local data layer)

**Files:** Create `src/lib/stories/interdisciplinarity/data/data.remote.ts`.

- [ ] **Step 1: Write the remote functions**

Create `src/lib/stories/interdisciplinarity/data/data.remote.ts`:

```ts
import { query, command, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import { eq, and } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { papers, paperAnnotations } from '$lib/server/db/schema';
import { fetchPaperFromOpenAlex } from './openalex';
import { computeAgreement, type AnnRow } from './interdisciplinarity.logic';

// Resolve current annotator: logged-in better-auth user id, else provided fingerprint.
function annotator(fingerprint?: string): { userId: string | null; fingerprint: string | null } {
	const { locals } = getRequestEvent();
	if (locals.user) return { userId: locals.user.id, fingerprint: null };
	return { userId: null, fingerprint: fingerprint ?? null };
}

// Lazy paper cache: local first, else OpenAlex + write-through.
export const getPaperById = query(v.string(), async (paperId) => {
	const cached = db.select().from(papers).where(eq(papers.id, paperId)).get();
	if (cached) {
		return {
			id: cached.id,
			title: cached.title,
			year: cached.year,
			abstract: cached.abstract ?? '',
			authors: cached.authors ?? [],
			topics: cached.topics ?? [],
			doi: cached.doi,
			is_open_access: cached.isOpenAccess ?? false
		};
	}
	const paper = await fetchPaperFromOpenAlex(paperId);
	db.insert(papers)
		.values({
			id: paper.id,
			title: paper.title,
			year: paper.year,
			abstract: paper.abstract,
			authors: paper.authors,
			topics: paper.topics,
			doi: paper.doi,
			isOpenAccess: paper.is_open_access
		})
		.onConflictDoNothing()
		.run();
	return paper;
});

// Upsert an annotation (user changes their mind => update).
export const annotatePaper = command(
	v.object({
		paper_id: v.string(),
		interdisciplinarity_rating: v.pipe(v.number(), v.minValue(1), v.maxValue(5)),
		confidence: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(5))),
		fingerprint: v.optional(v.string())
	}),
	async (input) => {
		const { userId, fingerprint } = annotator(input.fingerprint);
		if (!userId && !fingerprint) throw new Error('Login or fingerprint required');

		const where = userId
			? and(eq(paperAnnotations.paperId, input.paper_id), eq(paperAnnotations.userId, userId))
			: and(eq(paperAnnotations.paperId, input.paper_id), eq(paperAnnotations.fingerprint, fingerprint!));
		const existing = db.select().from(paperAnnotations).where(where).get();

		if (existing) {
			db.update(paperAnnotations)
				.set({
					rating: input.interdisciplinarity_rating,
					confidence: input.confidence ?? null,
					updatedAt: new Date().toISOString()
				})
				.where(eq(paperAnnotations.id, existing.id))
				.run();
		} else {
			db.insert(paperAnnotations)
				.values({
					paperId: input.paper_id,
					userId,
					fingerprint,
					rating: input.interdisciplinarity_rating,
					confidence: input.confidence ?? null
				})
				.run();
		}
		return { message: 'saved' };
	}
);

// A user's / fingerprint's annotations, in the API's shape.
export const getMyAnnotations = query(
	v.optional(v.object({ fingerprint: v.optional(v.string()) })),
	async (params = {}) => {
		const { userId, fingerprint } = annotator(params.fingerprint);
		if (!userId && !fingerprint) return { annotations: [], total: 0 };
		const where = userId
			? eq(paperAnnotations.userId, userId)
			: eq(paperAnnotations.fingerprint, fingerprint!);
		const rows = db.select().from(paperAnnotations).where(where).all();
		const annotations = rows.map((r) => ({
			paper_id: r.paperId,
			interdisciplinarity_rating: r.rating,
			confidence: r.confidence
		}));
		return { annotations, total: annotations.length };
	}
);

// Aggregate stats, in the API's shape.
export const getAnnotationStats = query(async () => {
	const rows = db.select().from(paperAnnotations).all();
	const total = rows.length;
	const logged_in = rows.filter((r) => r.userId).length;
	const rating_distribution: Record<number, number> = {};
	const per_paper_counts: Record<string, number> = {};
	let sum = 0;
	for (const r of rows) {
		sum += r.rating;
		rating_distribution[r.rating] = (rating_distribution[r.rating] ?? 0) + 1;
		per_paper_counts[r.paperId] = (per_paper_counts[r.paperId] ?? 0) + 1;
	}
	return {
		total_annotations: total,
		logged_in_annotations: logged_in,
		anonymous_annotations: total - logged_in,
		average_rating: total ? sum / total : 0,
		rating_distribution,
		per_paper_counts
	};
});

// Inter-annotator agreement, in the API's shape.
export const getAgreementData = query(async () => {
	const rows = db.select().from(paperAnnotations).all();
	const annRows: AnnRow[] = rows.map((r) => ({
		paper_id: r.paperId,
		rating: r.rating,
		annotator: r.userId ? `user_${r.userId}` : `anon_${(r.fingerprint ?? '').slice(0, 8)}`
	}));
	const paperIds = [...new Set(annRows.map((a) => a.paper_id))];
	const titles: Record<string, string> = {};
	for (const id of paperIds) {
		const p = db.select({ title: papers.title }).from(papers).where(eq(papers.id, id)).get();
		titles[id] = p?.title ?? id;
	}
	return computeAgreement(annRows, titles, 3);
});
```

- [ ] **Step 2: Type-check + commit**

```bash
npm run check 2>&1 | tail -1
git add src/lib/stories/interdisciplinarity/data/data.remote.ts
git commit -m "feat(interdisc): local remote functions (papers/annotations/stats/agreement)"
```
Expected: 0 errors.

---

## Task 6: Port leaf components (verbatim or near-verbatim)

These are self-contained or need only import tweaks. **Copy each from source, then apply the listed change, then run the svelte MCP `svelte-autofixer` and apply its fixes (expect keyed-`{#each}` requests).**

**Files (copy from `$SRC/.../components/` → `src/lib/stories/interdisciplinarity/components/`):**

- [ ] **Step 1: SearchInput.svelte, FilterButtons.svelte, QueueHeader.svelte** — copy verbatim (self-contained). No import changes.

- [ ] **Step 2: RatingBarChart.svelte** — copy verbatim (imports `svelteplot`, now installed).

- [ ] **Step 3: AgreementMatrix.svelte** — copy verbatim (imports `d3-interpolate`, now installed).

- [ ] **Step 4: PaperAnnotationCard.svelte** — copy verbatim (self-contained; props `paper`, bindable `selectedRating`, `isSubmitting`, `onSubmit/onPrevious/onNext`, `canGoPrevious/canGoNext`).

- [ ] **Step 5: HelpPopover.svelte** — copy from source, then delete the help paragraphs that describe the deferred **Community** and **My Papers** queues (keep General/CSV-queue help). Imports `@lucide/svelte` + `bits-ui` (installed).

- [ ] **Step 6: Run autofixer on all six**

Use the svelte MCP `svelte-autofixer` on each copied file; apply returned fixes (keys on `{#each}`, a11y). Re-run until clean.

- [ ] **Step 7: Commit**

```bash
git add src/lib/stories/interdisciplinarity/components/
git commit -m "feat(interdisc): port leaf components (search/filter/queue-header/chart/matrix/card/help)"
```

---

## Task 7: Port TopBar (rework for better-auth + trimmed modes)

**Files:** Create `src/lib/stories/interdisciplinarity/components/TopBar.svelte` (from source, reworked).

- [ ] **Step 1: Copy source, then rework**

Copy `TopBar.svelte` from source. Apply these changes:
- Remove the `import { getCurrentUser } from '../data/data.remote'` and any `getCurrentUser()` call. Accept the user as a prop instead:
  ```ts
  let { mode, generalQueueCount, onModeChange, user } = $props();
  ```
  (Drop `communityQueueCount`, `myPapersCount`, `myPapersQueueCount` props.)
- Keep only the mode buttons for **story**, **csv-queue** (label "Queue"), **overview**, **stats**. Delete the community-queue and my-papers-queue buttons.
- Replace the auth/avatar area: if `user`, show `user.name` (bits-ui Avatar optional); else a link to `{base}/login` ("Log in"). Remove links to `/auth`.
- Keep the `HelpPopover` import.

- [ ] **Step 2: Autofixer + type-check**

Run the svelte MCP `svelte-autofixer` on `TopBar.svelte`; apply fixes. Then `npm run check 2>&1 | tail -1` → 0 errors (other components may still be missing; confirm no errors *in TopBar*).

- [ ] **Step 3: Commit**

```bash
git add src/lib/stories/interdisciplinarity/components/TopBar.svelte
git commit -m "feat(interdisc): TopBar reworked for better-auth + MVP modes"
```

---

## Task 8: Port StatsView + OverviewTable (trim to csv-queue)

**Files:** Create `StatsView.svelte`, `OverviewTable.svelte` (from source, trimmed).

- [ ] **Step 1: StatsView.svelte** — copy from source. It imports `getAgreementData` from `../data/data.remote` (now local, same name/shape — keep). Props `stats`, `myAnnotations`, `paperIds`; **drop** `myPapers`/`generalPapers` props and any references to them (set to empty where the template needs them). Keep RatingBarChart + AgreementMatrix usage. Run autofixer.

- [ ] **Step 2: OverviewTable.svelte** — copy from source, then trim to the csv-queue only:
  - Keep props `paperIds`, `myAnnotations`, `annotationCounts`, `agreementData`, `onJumpToPaper`, and the `getPaperById` import (local).
  - **Remove** `generalPapers`, `myPapers`, `myPapersQueueIds`, `communityQueuePaperIds` props and every branch/column that uses them; `onSortedIdsChange` collapses to the CSV list only (or drop it and sort `paperIds` internally).
  - Keep SearchInput + FilterButtons usage (filter options reduced to what csv-queue needs).
  - `onJumpToPaper(mode, index)` only ever passes `mode = 'csv-queue'`.
  - Run autofixer.

- [ ] **Step 3: Type-check + commit**

```bash
npm run check 2>&1 | tail -1
git add src/lib/stories/interdisciplinarity/components/StatsView.svelte src/lib/stories/interdisciplinarity/components/OverviewTable.svelte
git commit -m "feat(interdisc): StatsView + OverviewTable trimmed to csv-queue"
```
Expected: 0 errors (Index still pending; these two should be self-consistent).

---

## Task 9: Story component + images

**Files:** Create `src/lib/stories/interdisciplinarity/components/Story.svelte`.

- [ ] **Step 1: Copy Story.svelte verbatim**

```bash
cp /users/j/s/jstonge1/complex-stories-dev/frontend/src/lib/stories/interdisciplinarity/components/Story.svelte \
   src/lib/stories/interdisciplinarity/components/Story.svelte
```
(It is self-contained prose + `<img src="/insuarity.jpg">` etc., which resolve to the `static/` images copied in Task 1.)

- [ ] **Step 2: Autofixer**

Run the svelte MCP `svelte-autofixer` on `Story.svelte`; apply fixes.

- [ ] **Step 3: Commit**

```bash
git add src/lib/stories/interdisciplinarity/components/Story.svelte
git commit -m "feat(interdisc): port story essay component"
```

---

## Task 10: Index orchestrator (trimmed modes + better-auth + token shim)

**Files:** Create `src/lib/stories/interdisciplinarity/components/Index.svelte`; create `src/lib/stories/interdisciplinarity/components/+page-not-needed` (none — uses `[slug]`). To pass the logged-in user, also create `src/routes/[slug]/+page.server.ts`? NO — keep routing generic. Instead read the user client-side from the app session via the `(app)` group? The story route `[slug]` is NOT under `(app)`. So expose the user through the existing `getStory` data is wrong. Use a story-level approach: read session on the client with `authClient.useSession()` is mis-typed (see better-auth notes). **Decision:** the tool only needs to know *whether* a user is logged in for keying annotations, and the server already does that authoritatively in the remote functions via `locals.user`. So the client passes `fingerprint` always; the server ignores it when `locals.user` exists. For the TopBar display, fetch the user via a tiny `getCurrentUser` query.

Add to `data.remote.ts` (amend Task 5 file) a display-only query:

```ts
export const getCurrentUser = query(async () => {
	const { locals } = getRequestEvent();
	return locals.user ? { name: locals.user.name } : null;
});
```

- [ ] **Step 1: Amend data.remote.ts with getCurrentUser** (above) and commit:

```bash
git add src/lib/stories/interdisciplinarity/data/data.remote.ts
git commit -m "feat(interdisc): getCurrentUser display query"
```

- [ ] **Step 2: Write Index.svelte**

Create `src/lib/stories/interdisciplinarity/components/Index.svelte`:

```svelte
<script lang="ts">
	import { onMount } from 'svelte';
	import { generateFingerprint } from '$lib/utils/browserFingerprint.js';
	import {
		getPaperById,
		annotatePaper,
		getMyAnnotations,
		getAnnotationStats,
		getAgreementData,
		getCurrentUser
	} from '../data/data.remote';
	import { getUniquePaperIds } from '../data/loader.js';
	import TopBar from './TopBar.svelte';
	import Story from './Story.svelte';
	import QueueHeader from './QueueHeader.svelte';
	import PaperAnnotationCard from './PaperAnnotationCard.svelte';
	import OverviewTable from './OverviewTable.svelte';
	import StatsView from './StatsView.svelte';

	let { story, data } = $props();

	let mode = $state('story'); // 'story' | 'csv-queue' | 'overview' | 'stats'
	let fingerprint = $state('');
	let user = $state<{ name: string } | null>(null);
	let paperIds = $state<string[]>([]);
	let myAnnotations = $state<{ paper_id: string; interdisciplinarity_rating: number }[]>([]);
	let annotationCounts = $state<Record<string, number>>({});
	let stats = $state<Record<string, unknown>>({});
	let agreementData = $state<{ papers: unknown[] } | null>(null);
	let currentIndex = $state(0);
	let selectedRating = $state<number | null>(null);
	let isSubmitting = $state(false);
	let error = $state<string | null>(null);

	const csvQueuePaperIds = $derived(
		paperIds.filter((id) => !myAnnotations.find((a) => a.paper_id === id))
	);
	const activePaperIds = $derived(mode === 'overview' ? paperIds : csvQueuePaperIds);
	const currentPaperId = $derived(activePaperIds[currentIndex]);
	const paper = $derived.by(async () => {
		if (!currentPaperId) return null;
		try {
			return await getPaperById(currentPaperId);
		} catch (err) {
			error = (err as Error).message;
			return null;
		}
	});

	async function loadAnnotations() {
		const res = await getMyAnnotations(user ? {} : { fingerprint });
		myAnnotations = res.annotations ?? [];
	}
	async function loadStats() {
		stats = await getAnnotationStats();
		annotationCounts = (stats.per_paper_counts as Record<string, number>) ?? {};
	}

	onMount(async () => {
		fingerprint = await generateFingerprint();
		user = await getCurrentUser();
		paperIds = getUniquePaperIds();
		await loadAnnotations();
		await loadStats();
	});

	async function setMode(newMode: string) {
		mode = newMode;
		currentIndex = 0;
		selectedRating = null;
		if (mode === 'overview' || mode === 'stats') {
			await loadAnnotations();
			await loadStats();
			agreementData = await getAgreementData();
		}
	}

	function handleJumpToPaper(_targetMode: string, index: number) {
		mode = 'csv-queue';
		currentIndex = index;
		selectedRating = null;
	}

	async function handleSubmit() {
		if (!selectedRating) return;
		if (!user && !fingerprint) {
			error = 'Waiting for fingerprint…';
			return;
		}
		isSubmitting = true;
		error = null;
		try {
			await annotatePaper({
				paper_id: currentPaperId,
				interdisciplinarity_rating: selectedRating,
				...(user ? {} : { fingerprint })
			});
			await loadAnnotations();
			selectedRating = null;
			currentIndex++;
		} catch (err) {
			error = (err as Error).message;
		} finally {
			isSubmitting = false;
		}
	}

	function previousPaper() {
		if (currentIndex > 0) {
			currentIndex--;
			selectedRating = null;
			error = null;
		}
	}
	function nextPaper() {
		if (currentIndex < activePaperIds.length - 1) {
			currentIndex++;
			selectedRating = null;
			error = null;
		}
	}
</script>

<div class="interdisciplinarity">
	<TopBar {mode} generalQueueCount={csvQueuePaperIds.length} onModeChange={setMode} {user} />

	<div class="container">
		{#if mode === 'stats'}
			<StatsView {stats} {myAnnotations} {paperIds} />
		{:else if mode === 'story'}
			<Story />
		{:else if mode === 'overview'}
			<OverviewTable {paperIds} {myAnnotations} {annotationCounts} {agreementData} onJumpToPaper={handleJumpToPaper} />
		{:else if mode === 'csv-queue'}
			<QueueHeader {mode} totalAnnotated={myAnnotations.length} totalPapers={paperIds.length} remainingInQueue={activePaperIds.length} {error} />
			{#if activePaperIds.length === 0}
				<div class="queue-empty"><h2>🎉 Queue Complete!</h2><p>Open Overview to review your annotations.</p></div>
			{:else}
				{#await paper}
					<div class="loading">Loading paper…</div>
				{:then paperData}
					<PaperAnnotationCard paper={paperData} bind:selectedRating {isSubmitting} onSubmit={handleSubmit} onPrevious={previousPaper} onNext={nextPaper} canGoPrevious={currentIndex > 0} canGoNext={currentIndex < activePaperIds.length - 1} />
				{:catch err}
					<div class="error">Error loading paper: {err.message}</div>
				{/await}
			{/if}
		{/if}
	</div>
</div>

<style>
	/* Shim the source's --color-* tokens onto scrolly-kit --vcsi-* so ported
	   component styles resolve. */
	.interdisciplinarity {
		--color-bg: var(--vcsi-bg, #ffffff);
		--color-fg: var(--vcsi-fg, #1a1a1a);
		--color-border: var(--vcsi-border, rgba(0, 0, 0, 0.15));
		--color-secondary-gray: var(--vcsi-gray-600, #666);
		--color-input-bg: var(--vcsi-bg, #ffffff);
		--color-sticky-bg: var(--color-bg);
		--color-sticky-border: var(--color-border);
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	.loading,
	.error,
	.queue-empty {
		text-align: center;
		padding: 3rem;
	}
	.error {
		color: #c33;
	}
</style>
```

- [ ] **Step 3: Autofixer (async component)**

Run the svelte MCP `svelte-autofixer` on `Index.svelte` with `async: true` (the project enables `compilerOptions.experimental.async`, and `paper` uses `$derived.by(async …)` consumed by `{#await}`). Apply fixes.

- [ ] **Step 4: Type-check**

Run: `npm run check 2>&1 | tail -1`
Expected: 0 errors. (If a trimmed component still references a removed prop, fix it there.)

- [ ] **Step 5: Commit**

```bash
git add src/lib/stories/interdisciplinarity/components/Index.svelte
git commit -m "feat(interdisc): Index orchestrator (MVP modes, better-auth, token shim)"
```

---

## Task 11: End-to-end verification

**Files:** none.

- [ ] **Step 1: Build (integration gate)**

Run: `npm run build 2>&1 | tail -5`
Expected: `✔ done` (benign circular-dependency warnings from deps are fine).

- [ ] **Step 2: Dev server + story loads**

`npm run dev` (or ask the user). Visit `/interdisciplinarity`.
Expected: TopBar with story/Queue/Overview/Stats; **story** mode shows the essay + the 3 images.

- [ ] **Step 3: Annotate (anonymous)**

Switch to **Queue**, rate the shown paper 1–5, submit. Expected: advances to the next paper. Confirm cache + annotation rows:
```bash
node -e "const D=require('better-sqlite3');const db=new D('data/app.db');console.log('papers:',db.prepare('SELECT count(*) c FROM papers').get());console.table(db.prepare('SELECT paper_id,user_id,fingerprint,rating FROM paper_annotations').all());"
```
Expected: ≥1 `papers` row (lazy-cached on view) and an annotation row keyed by `fingerprint` (user_id null).

- [ ] **Step 4: Overview + stats**

Switch to **Overview** (your annotated paper shows with its count) and **Stats** (rating distribution chart renders; agreement section appears once ≥1 annotation). No console errors.

- [ ] **Step 5: Logged-in keying (optional but recommended)**

Log in via `/login`, return to `/interdisciplinarity`, annotate a paper. Expected: a `paper_annotations` row with `user_id` set (not fingerprint).

- [ ] **Step 6: Regression + final checks**

Run: `npm run check && npm test`
Expected: 0 errors; all tests pass (survey 8 + interdisciplinarity logic). Survey + auth unaffected.

---

## Verification summary (per spec)

- Lazy paper cache → Task 11 Step 3 (papers row appears on view).
- Annotation upsert, dual auth → Task 11 Steps 3 & 5.
- Stats + agreement → Task 11 Step 4 + Task 3 unit tests.
- Story essay + images → Task 11 Step 2.
- Trimmed modes (no community/my-papers) → Tasks 7/8/10.
- svelte-check clean + survey/auth intact → Task 11 Step 6.

## Notes for the implementer

- Remote functions intentionally return the **original API shapes** (`interdisciplinarity_rating`, `paper_id`, `topics[{display_name}]`, the stats/agreement objects) so ported components need minimal change. If a component reads a field not produced here, prefer adjusting the component over reshaping the API response.
- The trims in Tasks 7–8 are the only substantive component edits; everything else is copy + autofixer. If a trimmed component is hard to untangle from deferred-mode logic, it's acceptable to stub the removed branches rather than delete, as long as no deferred mode is reachable from the trimmed TopBar.
- Use the svelte MCP `svelte-autofixer` on every `.svelte` file; the scrolly-kit/better-auth MCPs for any API confirmation.
