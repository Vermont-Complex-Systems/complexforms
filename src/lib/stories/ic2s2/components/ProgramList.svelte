<script lang="ts">
	import FilterBar from './FilterBar.svelte';
	import { getProgram, getMyVotes, getVotingStatus, castVote } from '../data/data.remote';

	type FilterType = 'parallel' | 'lightning' | 'posters';

	let { selectedDate }: { selectedDate: string } = $props();

	// Reactive queries — castVote refreshes getMyVotes single-flight, so the user's
	// own pick updates on its own. Tallies are never sent to attendees (by account).
	const programQ = getProgram();
	const myVotesQ = getMyVotes();
	const statusQ = getVotingStatus();

	const program = $derived(programQ.current ?? []);
	const mine = $derived(new Set(myVotesQ.current ?? []));
	const status = $derived(statusQ.current);
	const open = $derived(!!status?.open);
	const notReady = $derived(programQ.current === undefined);

	let filterType = $state<FilterType>('parallel');
	let searchQuery = $state('');
	let voteError = $state('');

	const wantKind = $derived(
		filterType === 'parallel' ? 'talk' : filterType === 'lightning' ? 'lightning' : 'poster'
	);
	const kindLabel = $derived(
		wantKind === 'talk' ? 'parallel-talk' : wantKind === 'lightning' ? 'lightning-talk' : 'poster'
	);

	// Your picks in the ACTIVE category, across all days — just a counter,
	// votes are unlimited.
	const kindById = $derived(new Map(program.map((p) => [p.id, p.kind])));
	const usedInKind = $derived([...mine].filter((id) => kindById.get(id) === wantKind).length);

	// A non-empty search spans the WHOLE program (every day + every type) so you
	// can find a talk without knowing where it lives; the pills/day tab only
	// scope browsing when the search box is empty.
	const searching = $derived(searchQuery.trim().length > 0);
	const results = $derived.by(() => {
		const q = searchQuery.trim().toLowerCase();
		return program
			.filter((p) => {
				if (!q) return p.kind === wantKind && p.day === selectedDate;
				const hay = `${p.title} ${p.authors ?? ''} ${p.id} ${p.theme ?? ''} ${p.sessionTitle ?? ''}`.toLowerCase();
				return hay.includes(q);
			})
			.sort(
				(a, b) =>
					(a.day ?? '').localeCompare(b.day ?? '') ||
					(a.session ?? '').localeCompare(b.session ?? '') ||
					a.title.localeCompare(b.title)
			);
	});

	const DAY_SHORT: Record<string, string> = {
		'2026-07-29': 'Wed',
		'2026-07-30': 'Thu',
		'2026-07-31': 'Fri'
	};
	const KIND_SHORT: Record<string, string> = {
		talk: 'Parallel',
		lightning: 'Lightning',
		poster: 'Poster'
	};

	async function vote(id: string) {
		voteError = '';
		try {
			await castVote(id);
		} catch (e) {
			voteError = e instanceof Error ? e.message : 'Could not vote';
		}
	}
</script>

<FilterBar bind:filterType bind:searchQuery resultCount={results.length} />

<p class="picks">
	{#if searching}
		★ {mine.size} {mine.size === 1 ? 'pick' : 'picks'} · searching all days &amp; categories
	{:else}
		★ {usedInKind} {kindLabel} {usedInKind === 1 ? 'pick' : 'picks'}
	{/if}
</p>

{#if voteError}<p class="error">{voteError}</p>{/if}

{#if notReady}
	<p class="muted">Loading…</p>
{:else if results.length === 0}
	<p class="muted">No presentations match your filters.</p>
{:else}
	<ul class="cards">
		{#each results as it (it.id)}
			<li class="item">
				<button
					class="vote"
					class:voted={mine.has(it.id)}
					disabled={!open}
					onclick={() => vote(it.id)}
					aria-pressed={mine.has(it.id)}
					title={!open
						? (status?.label ?? 'Voting is not open')
						: mine.has(it.id)
							? 'Your pick — click to clear'
							: 'Star as a favorite'}
				>
					★
				</button>
				<div class="meta">
					<div class="title">{it.title}</div>
					{#if it.authors}<div class="authors">{it.authors}</div>{/if}
					<div class="badges">
						{#if searching}
							<span class="tag">{DAY_SHORT[it.day ?? ''] ?? 'TBD'} · {KIND_SHORT[it.kind] ?? it.kind}</span>
						{/if}
						{#if it.sessionTitle}<span class="tag subtle">{it.sessionTitle}</span>{/if}
						{#if it.kind === 'poster' && it.theme}<span class="tag subtle">{it.theme}</span>{/if}
					</div>
				</div>
			</li>
		{/each}
	</ul>
{/if}

<style>
	.picks { margin: 0 0 var(--vcsi-space-sm); font-size: var(--vcsi-font-size-xs); font-weight: var(--vcsi-font-weight-medium); color: var(--vcsi-muted); }
	.error { color: #b00020; font-size: var(--vcsi-font-size-xs); margin: var(--vcsi-space-sm) 0 0; }
	.cards { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--vcsi-space-sm); }
	.cards li { padding: var(--vcsi-space-sm) var(--vcsi-space-md); border: 1px solid var(--vcsi-border); border-radius: var(--vcsi-radius-lg); }
	.item { display: flex; gap: var(--vcsi-space-md); align-items: flex-start; }
	.vote {
		flex: 0 0 auto;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.4rem;
		height: 2.4rem;
		padding: 0;
		border: 1px solid var(--vcsi-border);
		border-radius: var(--vcsi-radius-lg);
		background: transparent;
		cursor: pointer;
		font: inherit;
		font-size: 1.15rem;
		color: var(--vcsi-muted);
		line-height: 1;
		transition:
			background var(--vcsi-transition-fast),
			color var(--vcsi-transition-fast),
			border-color var(--vcsi-transition-fast);
	}
	.vote:hover:not(:disabled):not(.voted) { border-color: var(--ic2s2-coral, var(--vcsi-color-accent)); color: var(--ic2s2-coral, var(--vcsi-color-accent)); }
	.vote.voted { background: var(--ic2s2-coral, var(--vcsi-color-accent)); color: #fff; border-color: transparent; }
	.vote.voted:hover:not(:disabled) { background: color-mix(in srgb, var(--ic2s2-coral, #ef6a52) 85%, #000); }
	.vote:disabled { opacity: 0.45; cursor: not-allowed; }
	.vote.voted:disabled { opacity: 0.7; }
	.meta { min-width: 0; }
	.title { font-weight: var(--vcsi-font-weight-semibold); }
	.authors { color: var(--vcsi-muted); font-size: var(--vcsi-font-size-xs); margin-top: 0.15rem; }
	.badges { display: flex; flex-wrap: wrap; gap: var(--vcsi-space-xs); margin-top: var(--vcsi-space-sm); }
	.tag { font-size: 0.72rem; padding: 0.05rem 0.45rem; border-radius: var(--vcsi-radius-sm); background: var(--vcsi-gray-100); color: var(--vcsi-gray-700); }
	.tag.subtle { background: transparent; border: 1px solid var(--vcsi-border); color: var(--vcsi-muted); }
	.muted { color: var(--vcsi-muted); font-size: var(--vcsi-font-size-xs); }

	@media (max-width: 640px) {
		.cards { gap: var(--vcsi-space-xs); }
		.cards li { padding: var(--vcsi-space-sm); }
		.item { gap: var(--vcsi-space-sm); }
		.vote { width: 2.1rem; height: 2.1rem; font-size: 1rem; }
		.title { font-size: 0.85rem; line-height: 1.3; }
		.authors { font-size: 0.72rem; }
		.badges { gap: 0.2rem; margin-top: var(--vcsi-space-xs); }
		.tag { font-size: 0.62rem; padding: 0.03rem 0.35rem; }
	}
</style>
