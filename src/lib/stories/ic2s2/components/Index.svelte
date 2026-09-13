<script lang="ts">
	import { page } from '$app/state';
	import { getCurrentUser } from '../data/data.remote';
	import { getIsOrganizer } from '../data/admin.remote';
	import TopBar from './TopBar.svelte';
	import VotingBanner from './VotingBanner.svelte';
	import AuthPanel from './AuthPanel.svelte';
	import AccountPanel from './AccountPanel.svelte';
	import StatsPanel from './StatsPanel.svelte';
	import HuntPanel from './HuntPanel.svelte';
	import ProgramList from './ProgramList.svelte';
	import SurveyPanel from './SurveyPanel.svelte';

	const DAYS = [
		{ date: '2026-07-29', label: 'Wed · Jul 29' },
		{ date: '2026-07-30', label: 'Thu · Jul 30' },
		{ date: '2026-07-31', label: 'Fri · Jul 31' }
	];

	// Initial day tab: ?day=1..3 wins, else today (falling back to day 1). Votes
	// aren't day-bound — the tabs just keep the program list short.
	function initialDate(): string {
		const p = Number(page.url.searchParams.get('day'));
		if (p >= 1 && p <= DAYS.length) return DAYS[p - 1].date;
		const today = new Date().toLocaleDateString('en-CA');
		return DAYS.some((d) => d.date === today) ? today : DAYS[0].date;
	}

	// Reactive auth: the auth forms auto-invalidate getCurrentUser, so `user` flips
	// on its own. undefined = loading, null = logged out, object = logged in.
	const user = $derived(getCurrentUser().current);

	// Organizers get a TopBar link to the stats dashboard (the 'stats' view).
	// Only ever true for the caller themselves; defaults to false while loading.
	const isAdmin = $derived(user ? (getIsOrganizer().current ?? false) : false);

	// A QR scan (?find=<signed token>) lands on the Hunt tab (and the login view
	// first if logged out, so the find records right after signing in).
	let tab = $state<'program' | 'hunt' | 'survey'>(
		page.url.searchParams.get('tab') === 'hunt' || page.url.searchParams.get('find')
			? 'hunt'
			: page.url.searchParams.get('tab') === 'survey'
				? 'survey'
				: 'program'
	);
	// ?view=stats deep-links organizers to the dashboard (only renders if isAdmin;
	// a non-organizer falls through to the normal program view). No dedicated
	// route — the dashboard is an in-story view, like account/login.
	let view = $state<'main' | 'login' | 'account' | 'stats'>(
		page.url.searchParams.get('find')
			? 'login'
			: page.url.searchParams.get('view') === 'stats'
				? 'stats'
				: 'main'
	);
	const scanned = $derived(page.url.searchParams.get('find'));

	let selectedDate = $state(initialDate());
</script>

<div class="ic2s2-root">
	{#if user && view === 'main'}
		<VotingBanner />
	{/if}

	<TopBar
		user={user ?? null}
		{isAdmin}
		onLogin={() => (view = 'login')}
		onAccount={() => (view = 'account')}
		onStats={() => (view = 'stats')}
	/>

	{#if user && view === 'main'}
		<nav class="tabbar">
			<div class="tabbar-inner">
				<button class:active={tab === 'program'} onclick={() => (tab = 'program')}>🗳️ Vote</button>
				<button class:active={tab === 'hunt'} onclick={() => (tab = 'hunt')}>🗺️ Scavenger Hunt</button>
				<button class:active={tab === 'survey'} onclick={() => (tab = 'survey')}>📊 Embedding Survey</button>
			</div>
		</nav>
	{/if}

	<section class="ic2s2 page body-sec">
		{#if user === undefined}
			<p class="muted">Loading…</p>
		{:else if !user}
			{#if view === 'login'}
				<AuthPanel {scanned} />
			{:else}
				<div class="welcome">
					<p>Log in with your registered email to vote for the best talks &amp; posters — and join the Burlington scavenger hunt.</p>
					<button class="cta" onclick={() => (view = 'login')}>Log in</button>
				</div>
			{/if}
		{:else if view === 'account'}
			<AccountPanel {user} onBack={() => (view = 'main')} />
		{:else if view === 'stats' && isAdmin}
			<StatsPanel onBack={() => (view = 'main')} />
		{:else if tab === 'hunt'}
			<HuntPanel {scanned} />
		{:else if tab === 'survey'}
			<SurveyPanel />
		{:else}
			<nav class="daybar" aria-label="Program day">
				{#each DAYS as d (d.date)}
					<button class:active={selectedDate === d.date} onclick={() => (selectedDate = d.date)}>
						{d.label}
					</button>
				{/each}
			</nav>
			<ProgramList {selectedDate} />
		{/if}
	</section>
</div>

<style>
	.ic2s2-root {
		/* IC2S2 brand accent (coral) layered on the scrolly-kit token system. */
		--ic2s2-coral: #ef6a52;
		font-family: var(--vcsi-font-sans);
	}
	.ic2s2 {
		max-width: 46rem;
		margin-inline: auto;
		padding: var(--vcsi-space-xl) var(--vcsi-space-md);
	}
	.body-sec {
		padding-top: var(--vcsi-space-lg);
	}

	.tabbar { width: 100%; border-bottom: 1px solid var(--vcsi-border); }
	.tabbar-inner { max-width: 46rem; margin-inline: auto; display: flex; padding: 0 var(--vcsi-space-sm); }
	.tabbar button { flex: 1; padding: var(--vcsi-space-sm) var(--vcsi-space-md); margin-bottom: -1px; background: transparent; border: none; border-bottom: 2px solid transparent; cursor: pointer; font: inherit; font-weight: var(--vcsi-font-weight-medium); color: var(--vcsi-muted); transition: color var(--vcsi-transition-base), border-color var(--vcsi-transition-base); }
	.tabbar button:hover { color: var(--vcsi-fg); }
	.tabbar button.active { color: var(--ic2s2-coral); border-bottom-color: var(--ic2s2-coral); }

	.daybar { display: flex; gap: var(--vcsi-space-xs); margin-bottom: var(--vcsi-space-sm); }
	.daybar button { flex: 1; padding: var(--vcsi-space-xs) var(--vcsi-space-sm); border: 1px solid var(--vcsi-border); border-radius: var(--vcsi-radius-lg); background: transparent; cursor: pointer; font: inherit; font-size: var(--vcsi-font-size-xs); font-weight: var(--vcsi-font-weight-medium); color: var(--vcsi-muted); transition: background var(--vcsi-transition-base), color var(--vcsi-transition-base), border-color var(--vcsi-transition-base); }
	.daybar button:hover:not(.active) { background: var(--vcsi-hover); }
	.daybar button.active { background: var(--vcsi-fg); color: var(--vcsi-bg); border-color: var(--vcsi-fg); }

	.welcome { text-align: center; padding: var(--vcsi-space-2xl) var(--vcsi-space-md); color: var(--vcsi-muted); max-width: 30rem; margin-inline: auto; }
	.welcome p { margin-bottom: var(--vcsi-space-lg); }
	.cta { padding: var(--vcsi-space-sm) var(--vcsi-space-xl); border: none; border-radius: var(--vcsi-radius-full); background: var(--ic2s2-coral); color: #fff; font: inherit; font-weight: var(--vcsi-font-weight-semibold); cursor: pointer; }

	.muted { color: var(--vcsi-muted); font-size: var(--vcsi-font-size-xs); }

	@media (max-width: 640px) {
		.ic2s2 { padding: var(--vcsi-space-md) var(--vcsi-space-sm); }
	}
</style>
