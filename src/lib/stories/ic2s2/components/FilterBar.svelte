<script lang="ts">
	import { Search } from '@lucide/svelte';

	type FilterType = 'parallel' | 'lightning' | 'posters';

	interface Props {
		filterType: FilterType;
		searchQuery: string;
		resultCount: number;
	}

	let { filterType = $bindable(), searchQuery = $bindable(), resultCount }: Props = $props();

	const types: [FilterType, string][] = [
		['parallel', 'Parallel'],
		['lightning', 'Lightning'],
		['posters', 'Posters']
	];
</script>

<div class="filters">
	{#each types as [value, label] (value)}
		<button class="pill" class:active={filterType === value} onclick={() => (filterType = value)}>
			{label}
		</button>
	{/each}
	<span class="count">{resultCount}</span>
</div>

<div class="search">
	<span class="icon"><Search size={16} /></span>
	<input type="text" placeholder="Search the whole program — title, author, ID…" bind:value={searchQuery} />
</div>

<style>
	.filters {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--vcsi-space-sm);
		margin: var(--vcsi-space-sm) 0 var(--vcsi-space-md);
	}
	.pill {
		cursor: pointer;
		border: 1px solid var(--vcsi-border);
		border-radius: var(--vcsi-radius-full);
		padding: var(--vcsi-space-xs) var(--vcsi-space-md);
		font-family: var(--vcsi-font-sans);
		font-size: var(--vcsi-font-size-xs);
		font-weight: var(--vcsi-font-weight-medium);
		color: var(--vcsi-muted);
		background: transparent;
		transition:
			background var(--vcsi-transition-base),
			color var(--vcsi-transition-base),
			border-color var(--vcsi-transition-base);
	}
	.pill:hover {
		background: var(--vcsi-hover);
	}
	.pill.active {
		background: var(--vcsi-fg);
		color: var(--vcsi-bg);
		border-color: var(--vcsi-fg);
	}
	.count {
		margin-left: auto;
		font-size: var(--vcsi-font-size-xs);
		color: var(--vcsi-muted);
	}

	.search {
		position: relative;
		margin: var(--vcsi-space-md) 0;
	}
	.icon {
		position: absolute;
		left: var(--vcsi-space-md);
		top: 50%;
		transform: translateY(-50%);
		display: flex;
		color: var(--vcsi-muted);
		pointer-events: none;
	}
	input {
		width: 100%;
		border: 1px solid var(--vcsi-border);
		border-radius: var(--vcsi-radius-lg);
		padding: var(--vcsi-space-sm) var(--vcsi-space-md) var(--vcsi-space-sm) 2.4rem;
		font-family: var(--vcsi-font-sans);
		font-size: var(--vcsi-font-size-xs);
		color: var(--vcsi-fg);
		background: var(--vcsi-bg);
		transition: border-color var(--vcsi-transition-base);
	}
	input::placeholder {
		color: var(--vcsi-muted);
	}
	input:focus {
		outline: none;
		border-color: var(--ic2s2-coral, var(--vcsi-color-accent));
	}

	@media (max-width: 640px) {
		.filters {
			gap: var(--vcsi-space-xs);
			margin: var(--vcsi-space-xs) 0 var(--vcsi-space-sm);
		}
		.pill {
			padding: 0.25rem 0.6rem;
			font-size: 0.72rem;
		}
		.search {
			margin: var(--vcsi-space-sm) 0;
		}
		input {
			padding-block: var(--vcsi-space-xs);
		}
	}
</style>
