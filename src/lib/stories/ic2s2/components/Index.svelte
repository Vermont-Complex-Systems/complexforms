<script lang="ts">
	import { page } from '$app/state';
	import { getCurrentUser } from '../data/data.remote';
	import TopBar from './TopBar.svelte';
	import VotingBanner from './VotingBanner.svelte';
	import AuthPanel from './AuthPanel.svelte';
	import AccountPanel from './AccountPanel.svelte';
	import HuntPanel from './HuntPanel.svelte';
	import ProgramList from './ProgramList.svelte';
	import SurveyPanel from './SurveyPanel.svelte';

	const DAY_DATE: Record<number, string> = { 1: '2026-07-29', 2: '2026-07-30', 3: '2026-07-31' };
	const CONF_DATES = ['2026-07-29', '2026-07-30', '2026-07-31'];
	const DAY_LABEL: Record<number, string> = {
		1: 'Wednesday, July 29',
		2: 'Thursday, July 30',
		3: 'Friday, July 31'
	};

	function currentDayIndex(): number {
		const today = new Date().toLocaleDateString('en-CA');
		const i = CONF_DATES.indexOf(today);
		return i >= 0 ? i + 1 : 1;
	}
	function votingDay(): number {
		const p = Number(page.url.searchParams.get('day'));
		return p === 1 || p === 2 || p === 3 ? p : currentDayIndex();
	}

	// Reactive auth: the auth forms auto-invalidate getCurrentUser, so `user` flips
	// on its own. undefined = loading, null = logged out, object = logged in.
	const user = $derived(getCurrentUser().current);

	// A QR scan (?find=<signed token>) lands on the Hunt tab (and the login view
	// first if logged out, so the find records right after signing in).
	let tab = $state<'program' | 'hunt' | 'survey'>(
		page.url.searchParams.get('tab') === 'hunt' || page.url.searchParams.get('find')
			? 'hunt'
			: page.url.searchParams.get('tab') === 'survey'
				? 'survey'
				: 'program'
	);
	let view = $state<'main' | 'login' | 'account'>(
		page.url.searchParams.get('find') ? 'login' : 'main'
	);
	const scanned = $derived(page.url.searchParams.get('find'));

	const filterDay = votingDay();
	const selectedDate = DAY_DATE[filterDay];
	const dayLabel = DAY_LABEL[filterDay];
</script>

<div class="ic2s2-root">
	{#if user && view !== 'account'}
		<VotingBanner date={selectedDate} label={dayLabel} />
	{/if}

	<TopBar user={user ?? null} onLogin={() => (view = 'login')} onAccount={() => (view = 'account')} />

	{#if user && view !== 'account'}
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
					<p>Log in with your registered email to vote for the best talks &amp; posters — and join the Burlington hunt.</p>
					<button class="cta" onclick={() => (view = 'login')}>Log in</button>
				</div>
			{/if}
		{:else if view === 'account'}
			<AccountPanel {user} onBack={() => (view = 'main')} />
		{:else if tab === 'hunt'}
			<HuntPanel {scanned} />
		{:else if tab === 'survey'}
			<SurveyPanel />
		{:else}
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

	.welcome { text-align: center; padding: var(--vcsi-space-2xl) var(--vcsi-space-md); color: var(--vcsi-muted); max-width: 30rem; margin-inline: auto; }
	.welcome p { margin-bottom: var(--vcsi-space-lg); }
	.cta { padding: var(--vcsi-space-sm) var(--vcsi-space-xl); border: none; border-radius: var(--vcsi-radius-full); background: var(--ic2s2-coral); color: #fff; font: inherit; font-weight: var(--vcsi-font-weight-semibold); cursor: pointer; }

	.muted { color: var(--vcsi-muted); font-size: var(--vcsi-font-size-xs); }

	@media (max-width: 640px) {
		.ic2s2 { padding: var(--vcsi-space-md) var(--vcsi-space-sm); }
	}
</style>
