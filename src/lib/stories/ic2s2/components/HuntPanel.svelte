<script lang="ts">
	import { onMount } from 'svelte';
	import { getMyFinds, recordFind, getHuntLeaderboard } from '../data/data.remote';

	let { scanned }: { scanned: string | null } = $props();

	// Sub-view of the hunt: the attendee's own finds, or the all-attendee board.
	let view = $state<'finds' | 'board'>('finds');

	// Auto-record the scanned object FIRST, then load the list. If we loaded the
	// list up front it could race recordFind — the initial (empty) load landing
	// after the insert would hide the new find until a manual refresh.
	let scanResult = $state<{ name: string } | null>(null);
	let scanError = $state('');
	let ready = $state(false);
	onMount(async () => {
		if (scanned) {
			try {
				scanResult = await recordFind(scanned);
			} catch (e) {
				scanError = e instanceof Error ? e.message : 'Could not record that find.';
			}
		}
		ready = true;
	});

	// Discovery mode: only the attendee's own finds are shown (+ the total count).
	const findsQ = $derived(ready ? getMyFinds() : undefined);
	const found = $derived(findsQ?.current?.found ?? []);
	const total = $derived(findsQ?.current?.total ?? 0);
	const points = $derived(found.reduce((sum, f) => sum + (f.points ?? 0), 0));
	const notReady = $derived(!ready || findsQ?.current === undefined);

	// Leaderboard loads lazily the first time it's opened (and after any find is
	// recorded, since the panel remounts on a ?find scan).
	const boardQ = $derived(ready && view === 'board' ? getHuntLeaderboard() : undefined);
	const board = $derived(boardQ?.current ?? []);
	const boardLoading = $derived(view === 'board' && boardQ?.current === undefined);

	const medal = (rank: number) => (rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`);
</script>

{#if scanned}
	<div class="scan" class:ok={!!scanResult} class:err={!!scanError}>
		{#if scanResult}🎉 You found <strong>{scanResult.name}</strong>!
		{:else if scanError}{scanError}
		{:else}Recording your find…{/if}
	</div>
{/if}

<div class="head">
	<h2>Scavenger Hunt</h2>
	<span class="progress">{found.length} of {total} found{#if points} · {points} pts{/if}</span>
</div>

<div class="viewtabs">
	<button class:active={view === 'finds'} onclick={() => (view = 'finds')}>🎒 My finds</button>
	<button class:active={view === 'board'} onclick={() => (view = 'board')}>🏆 Leaderboard</button>
</div>

{#if view === 'finds'}
	{#if notReady}
		<p class="muted">Loading…</p>
	{:else if found.length === 0}
		<p class="muted">
			You haven't found anything yet. Scan a QR code hidden around Burlington to log your first find!
		</p>
	{:else}
		<ul class="cards">
			{#each found as f (f.id)}
				<li>
					<span class="check">✓</span>
					<div class="meta">
						<div class="name">{f.name}</div>
						{#if f.location}<div class="loc">{f.location}</div>{/if}
					</div>
				</li>
			{/each}
		</ul>
		{#if found.length < total}
			<p class="muted">{total - found.length} more out there — keep hunting!</p>
		{:else}
			<p class="muted">🏆 You found them all!</p>
		{/if}
	{/if}
{:else if boardLoading}
	<p class="muted">Loading…</p>
{:else if board.length === 0}
	<p class="muted">No finds logged yet — be the first on the board!</p>
{:else}
	<ol class="board">
		{#each board as row, i (i)}
			<li class:me={row.isMe}>
				<span class="rank">{medal(row.rank)}</span>
				<span class="who">{row.name}{#if row.isMe} <span class="tag">you</span>{/if}</span>
				<span class="stat">{row.finds} finds{#if row.points} · {row.points} pts{/if}</span>
			</li>
		{/each}
	</ol>
{/if}

<style>
	.scan { padding: var(--vcsi-space-sm) var(--vcsi-space-md); border: 1px solid var(--vcsi-border); border-radius: var(--vcsi-radius-lg); margin-bottom: var(--vcsi-space-md); font-size: var(--vcsi-font-size-small); }
	.scan.ok { border-color: var(--ic2s2-coral, var(--vcsi-color-accent)); background: color-mix(in srgb, var(--ic2s2-coral, #ef6a52) 12%, var(--vcsi-bg)); }
	.scan.err { border-color: #b00020; color: #b00020; }

	.head { display: flex; align-items: baseline; justify-content: space-between; gap: var(--vcsi-space-md); margin: var(--vcsi-space-sm) 0 var(--vcsi-space-md); }
	h2 { margin: 0; font-size: var(--vcsi-font-size-small); }
	.progress { font-size: var(--vcsi-font-size-xs); color: var(--vcsi-muted); font-variant-numeric: tabular-nums; white-space: nowrap; }

	.cards { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--vcsi-space-sm); }
	.cards li { display: flex; align-items: center; gap: var(--vcsi-space-md); padding: var(--vcsi-space-sm) var(--vcsi-space-md); border: 1px solid var(--vcsi-border); border-radius: var(--vcsi-radius-lg); }
	.check { flex: 0 0 auto; display: flex; align-items: center; justify-content: center; width: 1.6rem; height: 1.6rem; border-radius: var(--vcsi-radius-full); background: var(--ic2s2-coral, var(--vcsi-color-accent)); color: #fff; font-size: 0.85rem; font-weight: var(--vcsi-font-weight-bold); }
	.name { font-weight: var(--vcsi-font-weight-semibold); }
	.loc { color: var(--vcsi-muted); font-size: var(--vcsi-font-size-xs); margin-top: 0.1rem; }
	.muted { color: var(--vcsi-muted); font-size: var(--vcsi-font-size-xs); }

	/* My finds / Leaderboard toggle */
	.viewtabs { display: inline-flex; gap: 0.25rem; padding: 0.2rem; margin-bottom: var(--vcsi-space-md); border: 1px solid var(--vcsi-border); border-radius: var(--vcsi-radius-full); }
	.viewtabs button { padding: 0.3rem 0.9rem; border: none; border-radius: var(--vcsi-radius-full); background: transparent; cursor: pointer; font: inherit; font-size: var(--vcsi-font-size-xs); font-weight: var(--vcsi-font-weight-medium); color: var(--vcsi-muted); transition: color var(--vcsi-transition-base), background var(--vcsi-transition-base); }
	.viewtabs button:hover { color: var(--vcsi-fg); }
	.viewtabs button.active { background: var(--ic2s2-coral, var(--vcsi-color-accent)); color: #fff; }

	/* Leaderboard */
	.board { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--vcsi-space-sm); }
	.board li { display: flex; align-items: center; gap: var(--vcsi-space-md); padding: var(--vcsi-space-sm) var(--vcsi-space-md); border: 1px solid var(--vcsi-border); border-radius: var(--vcsi-radius-lg); }
	.board li.me { border-color: var(--ic2s2-coral, var(--vcsi-color-accent)); background: color-mix(in srgb, var(--ic2s2-coral, #ef6a52) 10%, var(--vcsi-bg)); }
	.rank { flex: 0 0 auto; min-width: 1.8rem; text-align: center; font-weight: var(--vcsi-font-weight-bold); font-variant-numeric: tabular-nums; }
	.who { flex: 1 1 auto; font-weight: var(--vcsi-font-weight-semibold); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.tag { font-size: var(--vcsi-font-size-xs); font-weight: var(--vcsi-font-weight-medium); color: var(--ic2s2-coral, var(--vcsi-color-accent)); border: 1px solid currentColor; border-radius: var(--vcsi-radius-full); padding: 0 0.4rem; margin-left: 0.35rem; }
	.stat { flex: 0 0 auto; color: var(--vcsi-muted); font-size: var(--vcsi-font-size-xs); font-variant-numeric: tabular-nums; white-space: nowrap; }
</style>
