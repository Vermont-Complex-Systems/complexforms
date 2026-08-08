<script lang="ts">
	import { getVotingStatus } from '../data/data.remote';

	// Reactive query (only rendered when logged in, so it's authorized).
	const statusQ = getVotingStatus();
	const s = $derived(statusQ.current);
</script>

{#if s}
	<div class="banner" class:open={s.open}>
		<div class="banner-inner">
			<span class="dot"></span>
			<span><strong>{s.label}</strong> · star as many favorites as you like, any day</span>
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
