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
			<OverviewTable
				{paperIds}
				{myAnnotations}
				{annotationCounts}
				{agreementData}
				onJumpToPaper={handleJumpToPaper}
			/>
		{:else if mode === 'csv-queue'}
			<QueueHeader
				{mode}
				totalAnnotated={myAnnotations.length}
				totalPapers={paperIds.length}
				remainingInQueue={activePaperIds.length}
				{error}
			/>
			{#if activePaperIds.length === 0}
				<div class="queue-empty">
					<h2>🎉 Queue Complete!</h2>
					<p>Open Overview to review your annotations.</p>
				</div>
			{:else}
				{#await paper}
					<div class="loading">Loading paper…</div>
				{:then paperData}
					<PaperAnnotationCard
						paper={paperData}
						bind:selectedRating
						{isSubmitting}
						onSubmit={handleSubmit}
						onPrevious={previousPaper}
						onNext={nextPaper}
						canGoPrevious={currentIndex > 0}
						canGoNext={currentIndex < activePaperIds.length - 1}
					/>
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
