<script lang="ts">
	import { getVotingWindows } from '../data/data.remote';

	let { date, label }: { date: string; label: string } = $props();

	// Reactive query (only rendered when logged in, so it's authorized).
	const windows = getVotingWindows();
	const w = $derived(windows.current?.[date]);
</script>

{#if w}
	<div class="banner" class:open={w.open}>
		<div class="banner-inner">
			<span class="dot"></span>
			<span><strong>{label}</strong> · {w.label} · one pick per category</span>
		</div>
	</div>
{/if}

<style>
	.banner { width: 100%; background: var(--vcsi-gray-100); border-bottom: 1px solid var(--vcsi-border); }
	.banner-inner { max-width: 46rem; margin-inline: auto; display: flex; align-items: center; gap: var(--vcsi-space-sm); padding: var(--vcsi-space-sm) var(--vcsi-space-md); font-size: var(--vcsi-font-size-xs); font-weight: var(--vcsi-font-weight-medium); color: var(--vcsi-muted); }
	.banner .dot { width: 0.55rem; height: 0.55rem; border-radius: var(--vcsi-radius-full); background: var(--vcsi-gray-400); flex: 0 0 auto; }
	.banner.open { background: color-mix(in srgb, var(--ic2s2-coral, #ef6a52) 12%, var(--vcsi-bg)); border-bottom-color: var(--ic2s2-coral, #ef6a52); }
	.banner.open .banner-inner { color: var(--vcsi-fg); }
	.banner.open .dot { background: var(--ic2s2-coral, #ef6a52); }

	@media (max-width: 640px) {
		.banner { font-size: 0.72rem; }
		.banner-inner { padding: var(--vcsi-space-xs) var(--vcsi-space-sm); }
	}
</style>
