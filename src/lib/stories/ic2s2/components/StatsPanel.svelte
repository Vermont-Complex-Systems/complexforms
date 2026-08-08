<!--
  Organizer dashboard — an in-story view (like AccountPanel), not a route. Shown
  only to organizers: the TopBar link is gated by getIsOrganizer, and the data
  itself is guarded in the remote function (getVoteAnalytics → requireOrganizer),
  so a non-organizer who reached this view would just get the error notice.
  Shows the aggregate numbers the attendee app deliberately hides: vote
  leaderboard, most active voters, and an hourly timeseries of the vote log.
-->
<script lang="ts">
	import { getVoteAnalytics, getItemVoters } from '../data/admin.remote';

	let { onBack }: { onBack: () => void } = $props();

	const q = getVoteAnalytics();
	const data = $derived(q.current);

	const KINDS = [
		{ id: 'all', label: 'All' },
		{ id: 'talk', label: 'Talks' },
		{ id: 'lightning', label: 'Lightning' },
		{ id: 'poster', label: 'Posters' }
	] as const;
	const KIND_LABEL: Record<string, string> = { talk: 'Talk', lightning: 'Lightning', poster: 'Poster' };
	let kindFilter = $state<'all' | 'talk' | 'lightning' | 'poster'>('all');

	// Which table is shown — one at a time so each fills the column width instead
	// of the cramped two-up layout.
	let tableTab = $state<'leaderboard' | 'voters'>('leaderboard');

	// Leaderboard drill-down: the expanded item id, and its voter list (fetched on
	// demand, one item at a time). getItemVoters caches per talkId, so re-expanding
	// is instant.
	let expandedId = $state<string | null>(null);
	const itemVoters = $derived(expandedId ? getItemVoters(expandedId) : null);
	function toggleItem(id: string) {
		expandedId = expandedId === id ? null : id;
	}

	// Competition ranking within the current filter (1, 2, 2, 4…), same
	// convention as the hunt leaderboard.
	const board = $derived.by(() => {
		const rows = (data?.leaderboard ?? []).filter((r) => kindFilter === 'all' || r.kind === kindFilter);
		let rank = 0;
		let prev = -1;
		return rows.map((r, i) => {
			if (r.votes !== prev) {
				rank = i + 1;
				prev = r.votes;
			}
			return { ...r, rank };
		});
	});

	/* ---- hourly timeseries of the vote log, in conference time (ET) ---- */

	const hourFmt = new Intl.DateTimeFormat('en-US', {
		timeZone: 'America/New_York',
		month: 'short',
		day: 'numeric',
		weekday: 'short',
		hour: 'numeric',
		hour12: true
	});
	function hourParts(ms: number) {
		const p = hourFmt.formatToParts(ms);
		const get = (t: string) => p.find((x) => x.type === t)?.value ?? '';
		return {
			day: `${get('weekday')} ${get('month')} ${get('day')}`,
			hour: `${get('hour')} ${get('dayPeriod').toUpperCase()}`
		};
	}

	const HOUR = 3_600_000;
	// One bucket per wall-clock hour from the first event to the last. ET offsets
	// are whole hours, so flooring on the UTC epoch lines up with ET hours.
	const buckets = $derived.by(() => {
		const events = data?.events ?? [];
		if (!events.length) return [];
		const counts = new Map<number, { votes: number; unvotes: number }>();
		for (const e of events) {
			const t = Math.floor(e.at / HOUR) * HOUR;
			const c = counts.get(t) ?? { votes: 0, unvotes: 0 };
			if (e.action === 'unvote') c.unvotes += 1;
			else c.votes += 1;
			counts.set(t, c);
		}
		const first = Math.floor(events[0].at / HOUR) * HOUR;
		const last = Math.floor(events[events.length - 1].at / HOUR) * HOUR;
		const out = [];
		for (let t = first; t <= last; t += HOUR) {
			out.push({ t, ...hourParts(t), ...(counts.get(t) ?? { votes: 0, unvotes: 0 }) });
		}
		return out;
	});

	// Diverging bar chart geometry: votes grow up from the baseline, unvotes down.
	const BW = 16; // px per hour column in the viewBox
	const UP = 96; // tallest vote bar
	const DOWN = 40; // tallest unvote bar
	const BASE = 12 + UP;
	const CHART_H = BASE + DOWN + 26; // + x-axis labels
	const chartW = $derived(buckets.length * BW);
	const maxUp = $derived(Math.max(1, ...buckets.map((b) => b.votes)));
	const maxDown = $derived(Math.max(1, ...buckets.map((b) => b.unvotes)));

	const timeFmt = new Intl.DateTimeFormat('en-US', {
		timeZone: 'America/New_York',
		weekday: 'short',
		hour: 'numeric',
		minute: '2-digit',
		hour12: true
	});
</script>

<div class="stats-panel">
	<header>
		<div>
			<button class="back" onclick={onBack}>← Back</button>
			<h1>Voting stats</h1>
			<p class="sub">Organizer view — attendees never see these tallies.</p>
		</div>
		<button class="refresh" onclick={() => q.refresh()}>↻ Refresh</button>
	</header>

	{#if q.error}
		<div class="notice">
			<p>{q.error.message ?? 'This page is for conference organizers.'}</p>
			<button class="link" onclick={onBack}>Back to the app</button>
		</div>
	{:else if !data}
		<p class="muted">Loading…</p>
	{:else}
		<section class="cards">
			<div class="card">
				<span class="num">{data.counts.accounts}</span>
				<span class="label">accounts claimed<br />of {data.counts.registered} registered</span>
			</div>
			<div class="card">
				<span class="num">{data.counts.voters}</span>
				<span class="label">attendees<br />have voted</span>
			</div>
			<div class="card">
				<span class="num">{data.counts.votes}</span>
				<span class="label">stars currently<br />placed</span>
			</div>
			<div class="card">
				<span class="num">{data.counts.events}</span>
				<span class="label">vote events<br />(incl. unvotes)</span>
			</div>
		</section>

		<section>
			<h2>Vote activity by hour <span class="tz">(US/Eastern)</span></h2>
			{#if !buckets.length}
				<p class="muted">No vote events yet.</p>
			{:else}
				<div class="chart-scroll">
					<svg viewBox="0 0 {chartW} {CHART_H}" width={chartW} height={CHART_H} role="img" aria-label="Votes and unvotes per hour">
						<line x1="0" y1={BASE} x2={chartW} y2={BASE} class="axis" />
						{#each buckets as b, i (b.t)}
							{@const up = (b.votes / maxUp) * UP}
							{@const down = (b.unvotes / maxDown) * DOWN}
							<g>
								<title>{b.day}, {b.hour} — {b.votes} votes, {b.unvotes} unvotes</title>
								<rect class="hit" x={i * BW} y="0" width={BW} height={BASE + DOWN} />
								{#if b.votes}
									<rect class="vote" x={i * BW + 2} y={BASE - up} width={BW - 4} height={up} rx="1.5" />
								{/if}
								{#if b.unvotes}
									<rect class="unvote" x={i * BW + 2} y={BASE + 1} width={BW - 4} height={down} rx="1.5" />
								{/if}
							</g>
							{#if b.hour === '12 AM'}
								<line x1={i * BW} y1="0" x2={i * BW} y2={BASE + DOWN} class="day-line" />
								<text x={i * BW + 3} y={CHART_H - 14} class="tick day">{b.day}</text>
							{:else if ['6 AM', '12 PM', '6 PM'].includes(b.hour)}
								<text x={i * BW + BW / 2} y={CHART_H - 14} class="tick">{b.hour.replace(' ', '')}</text>
							{/if}
						{/each}
					</svg>
				</div>
				<p class="legend">
					<span class="swatch vote"></span> votes
					<span class="swatch unvote"></span> unvotes — each column is one hour
				</p>
			{/if}
		</section>

		<section>
			<div class="table-tabs" role="tablist">
				<button role="tab" aria-selected={tableTab === 'leaderboard'} class={{ active: tableTab === 'leaderboard' }} onclick={() => (tableTab = 'leaderboard')}>
					Leaderboard
				</button>
				<button role="tab" aria-selected={tableTab === 'voters'} class={{ active: tableTab === 'voters' }} onclick={() => (tableTab = 'voters')}>
					Most active voters
				</button>
			</div>

			{#if tableTab === 'leaderboard'}
				<div class="kind-tabs">
					{#each KINDS as k (k.id)}
						<button class={{ active: kindFilter === k.id }} onclick={() => { kindFilter = k.id; expandedId = null; }}>
							{k.label}
						</button>
					{/each}
				</div>
				{#if !board.length}
					<p class="muted">No votes in this category yet.</p>
				{:else}
					<div class="table-wrap">
						<table>
							<thead>
								<tr><th class="r">#</th><th class="r">★</th><th>Item</th><th>When</th></tr>
							</thead>
							<tbody>
								{#each board as r (r.id)}
									<tr class:expanded={expandedId === r.id}>
										<td class="r rank">{['🥇', '🥈', '🥉'][r.rank - 1] ?? r.rank}</td>
										<td class="r votes">{r.votes}</td>
										<td>
											<button class="item-toggle" onclick={() => toggleItem(r.id)} aria-expanded={expandedId === r.id}>
												<span class="caret" class:open={expandedId === r.id}>▸</span>
												<span class="title">{r.title}</span>
											</button>
											{#if kindFilter === 'all'}<span class="badge">{KIND_LABEL[r.kind] ?? r.kind}</span>{/if}
											{#if r.authors}<span class="authors">{r.authors}</span>{/if}
										</td>
										<td class="when">{r.day ?? '—'}{r.session ? ` · ${r.session}` : ''}</td>
									</tr>
									{#if expandedId === r.id}
										<tr class="detail-row">
											<td></td>
											<td colspan="3">
												{#if itemVoters?.error}
													<p class="muted small">Couldn't load voters.</p>
												{:else if !itemVoters?.current}
													<p class="muted small">Loading voters…</p>
												{:else if itemVoters.current.length === 0}
													<p class="muted small">No current voters.</p>
												{:else}
													<p class="detail-head">{itemVoters.current.length} voter{itemVoters.current.length === 1 ? '' : 's'}</p>
													<ul class="voter-list">
														{#each itemVoters.current as vv (vv.email)}
															<li><span class="vname">{vv.name}</span> <span class="vemail">{vv.email}</span></li>
														{/each}
													</ul>
												{/if}
											</td>
										</tr>
									{/if}
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			{:else if !data.voters.length}
				<p class="muted">Nobody has voted yet.</p>
			{:else}
				<div class="table-wrap">
					<table>
						<thead>
							<tr><th class="r">#</th><th>Attendee</th><th class="r">★ now</th><th class="r">toggles</th><th>last active</th></tr>
						</thead>
						<tbody>
							{#each data.voters as v, i (v.email)}
								<tr>
									<td class="r rank">{i + 1}</td>
									<td>
										<span class="title">{v.name}</span>
										<span class="authors">{v.email}</span>
									</td>
									<td class="r votes">{v.stars}</td>
									<td class="r">{v.toggles}</td>
									<td class="when">{v.lastAt ? timeFmt.format(v.lastAt) : '—'}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</section>
	{/if}
</div>

<style>
	.stats-panel {
		--ink: #1c2733;
		--muted: #64748b;
		--line: #e2e8f0;
		--accent: #2563eb;
		--accent-soft: #dbeafe;
		--red: #dc2626;
		color: var(--ink);
		font-family: system-ui, sans-serif;
		max-width: 72rem;
		margin: 0 auto;
		padding: 0 clamp(0rem, 2vw, 1.5rem) 3rem;
	}

	header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}
	.back {
		border: none;
		background: none;
		padding: 0;
		margin-bottom: 0.4rem;
		color: var(--muted);
		font: inherit;
		font-size: 0.85rem;
		cursor: pointer;
	}
	.back:hover {
		color: var(--accent);
	}
	h1 {
		font-size: 1.4rem;
		margin: 0;
	}
	.sub {
		margin: 0.25rem 0 0;
		color: var(--muted);
		font-size: 0.85rem;
	}
	.refresh {
		border: 1px solid var(--line);
		background: #fff;
		border-radius: 0.5rem;
		padding: 0.45rem 0.9rem;
		font: inherit;
		font-size: 0.85rem;
		cursor: pointer;
	}
	.refresh:hover {
		border-color: var(--accent);
		color: var(--accent);
	}

	.notice {
		background: #fff;
		border: 1px solid var(--line);
		border-radius: 0.75rem;
		padding: 1.25rem 1.5rem;
	}
	.link {
		border: none;
		background: none;
		padding: 0;
		color: var(--accent);
		font: inherit;
		cursor: pointer;
		text-decoration: underline;
	}
	.muted {
		color: var(--muted);
	}

	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
		gap: 0.75rem;
		margin-bottom: 2rem;
	}
	.card {
		background: #fff;
		border: 1px solid var(--line);
		border-radius: 0.75rem;
		padding: 0.9rem 1.1rem;
		display: flex;
		align-items: baseline;
		gap: 0.7rem;
	}
	.num {
		font-size: 1.9rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}
	.label {
		color: var(--muted);
		font-size: 0.78rem;
		line-height: 1.25;
	}

	section {
		margin-bottom: 2rem;
	}
	h2 {
		font-size: 1rem;
		margin: 0 0 0.6rem;
	}
	.tz {
		color: var(--muted);
		font-weight: 400;
		font-size: 0.8rem;
	}

	.chart-scroll {
		overflow-x: auto;
		background: #fff;
		border: 1px solid var(--line);
		border-radius: 0.75rem;
		padding: 0.75rem;
	}
	.axis {
		stroke: var(--ink);
		stroke-width: 1;
	}
	.day-line {
		stroke: var(--line);
		stroke-dasharray: 2 3;
	}
	rect.hit {
		fill: transparent;
	}
	g:hover rect.hit {
		fill: var(--accent-soft);
		opacity: 0.4;
	}
	rect.vote,
	.swatch.vote {
		fill: var(--accent);
		background: var(--accent);
	}
	rect.unvote,
	.swatch.unvote {
		fill: var(--red);
		background: var(--red);
	}
	.tick {
		font-size: 9px;
		fill: var(--muted);
		text-anchor: middle;
	}
	.tick.day {
		text-anchor: start;
		font-weight: 600;
		fill: var(--ink);
	}
	.legend {
		color: var(--muted);
		font-size: 0.78rem;
		display: flex;
		align-items: center;
		gap: 0.4rem;
		margin: 0.5rem 0 0;
	}
	.swatch {
		display: inline-block;
		width: 0.7rem;
		height: 0.7rem;
		border-radius: 2px;
		margin-left: 0.6rem;
	}
	.swatch:first-of-type {
		margin-left: 0;
	}

	.table-tabs {
		display: flex;
		gap: 1.25rem;
		border-bottom: 1px solid var(--line);
		margin-bottom: 1rem;
	}
	.table-tabs button {
		border: none;
		background: none;
		padding: 0 0 0.5rem;
		margin-bottom: -1px;
		border-bottom: 2px solid transparent;
		font: inherit;
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--muted);
		cursor: pointer;
		transition:
			color 0.15s,
			border-color 0.15s;
	}
	.table-tabs button:hover {
		color: var(--ink);
	}
	.table-tabs button.active {
		color: var(--ink);
		border-bottom-color: var(--accent);
	}

	/* Horizontal-scroll safety net: if a table can't shrink enough for the narrow
	   story column, it scrolls inside its own box instead of bleeding off-page. */
	.table-wrap {
		overflow-x: auto;
	}

	.kind-tabs {
		display: flex;
		gap: 0.4rem;
		margin-bottom: 0.6rem;
	}
	.kind-tabs button {
		border: 1px solid var(--line);
		background: #fff;
		border-radius: 999px;
		padding: 0.25rem 0.8rem;
		font: inherit;
		font-size: 0.8rem;
		cursor: pointer;
		color: var(--muted);
	}
	.kind-tabs button.active {
		background: var(--accent);
		border-color: var(--accent);
		color: #fff;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		background: #fff;
		border: 1px solid var(--line);
		border-radius: 0.75rem;
		overflow: hidden;
		font-size: 0.85rem;
	}
	th {
		text-align: left;
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--muted);
		padding: 0.55rem 0.75rem;
		border-bottom: 1px solid var(--line);
	}
	td {
		padding: 0.55rem 0.75rem;
		border-bottom: 1px solid var(--line);
		vertical-align: top;
	}
	tr:last-child td {
		border-bottom: none;
	}
	.r {
		text-align: right;
		white-space: nowrap;
	}
	.rank {
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}
	.votes {
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}
	.item-toggle {
		display: flex;
		align-items: baseline;
		gap: 0.4rem;
		width: 100%;
		border: none;
		background: none;
		padding: 0;
		font: inherit;
		text-align: left;
		color: inherit;
		cursor: pointer;
	}
	.item-toggle:hover .title {
		color: var(--accent);
	}
	.caret {
		flex: none;
		color: var(--muted);
		font-size: 0.7rem;
		transition: transform 0.15s;
	}
	.caret.open {
		transform: rotate(90deg);
	}
	tr.expanded > td {
		border-bottom-color: transparent;
	}

	.detail-row td {
		padding-top: 0;
		padding-bottom: 0.75rem;
	}
	.detail-head {
		margin: 0.25rem 0 0.4rem;
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--muted);
	}
	.voter-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.3rem;
	}
	.voter-list li {
		font-size: 0.82rem;
	}
	.vname {
		font-weight: 550;
	}
	.vemail {
		color: var(--muted);
		overflow-wrap: anywhere;
	}
	.small {
		font-size: 0.82rem;
	}

	.title {
		display: block;
		font-weight: 550;
		overflow-wrap: anywhere;
	}
	.authors {
		display: block;
		color: var(--muted);
		font-size: 0.78rem;
		margin-top: 0.1rem;
		/* Emails have no spaces to wrap at — break anywhere so the column can
		   shrink and the table fits the narrow story width. */
		overflow-wrap: anywhere;
	}
	.badge {
		display: inline-block;
		background: var(--accent-soft);
		color: var(--accent);
		border-radius: 999px;
		font-size: 0.68rem;
		padding: 0.05rem 0.5rem;
		margin-top: 0.15rem;
	}
	.when {
		color: var(--muted);
		white-space: nowrap;
		font-size: 0.78rem;
	}
</style>
