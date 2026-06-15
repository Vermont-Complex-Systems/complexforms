<script lang="ts">
	import { Avatar } from 'bits-ui';
	import { base } from '$app/paths';
	import HelpPopover from './HelpPopover.svelte';

	let {
		mode,
		generalQueueCount = 0,
		onModeChange = (_m: string) => {},
		user = null
	}: {
		mode: string;
		generalQueueCount?: number;
		onModeChange?: (m: string) => void;
		user?: { name: string } | null;
	} = $props();

	function getUserInitials(name: string) {
		if (!name) return 'U';
		const parts = name.trim().split(/\s+/);
		if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
		return name.slice(0, 2).toUpperCase();
	}
</script>

<div class="top-bar">
	<a href="{base}/" class="logo-link">
		<img src="{base}/octopus-swim-right.png" alt="Home" class="octopus-icon" />
	</a>
	<div class="mode-switcher">
		<button class="mode-btn" class:active={mode === 'story'} onclick={() => onModeChange('story')}>
			Why
		</button>
		<button class="mode-btn" class:active={mode === 'overview'} onclick={() => onModeChange('overview')}>
			📊 Overview
		</button>
		<button
			class="mode-btn"
			class:active={mode === 'csv-queue'}
			onclick={() => onModeChange('csv-queue')}
			disabled={generalQueueCount === 0}
		>
			📝 Queue ({generalQueueCount})
		</button>
		<button class="mode-btn" class:active={mode === 'stats'} onclick={() => onModeChange('stats')}>
			📈 Stats
		</button>
	</div>
	<div class="right-section">
		<HelpPopover side="bottom" align="end" sideOffset={2} iconSize={30} />
		{#if user}
			<a class="avatar-button" href="{base}/account" title={user.name}>
				<Avatar.Root class="avatar-root">
					<Avatar.Fallback class="avatar-fallback">{getUserInitials(user.name)}</Avatar.Fallback>
				</Avatar.Root>
			</a>
		{:else}
			<a href="{base}/login" class="login-button">Log in</a>
		{/if}
	</div>
</div>

<style>
	.top-bar {
		display: flex;
		flex-direction: row;
		gap: 1rem;
		background: var(--color-sticky-bg);
		border-bottom: 1px solid var(--color-sticky-border);
		position: sticky;
		top: 0;
		z-index: 100;
		align-items: center;
		justify-content: space-between;
	}

	.logo-link {
		display: flex;
		align-items: center;
		text-decoration: none;
		transition: transform 0.2s;
		transform: translateY(5px);
	}

	.logo-link:hover {
		transform: translateY(-2px);
	}

	.octopus-icon {
		height: 4rem;
		object-fit: contain;
	}

	.right-section {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.875rem;
	}

	.mode-switcher {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		flex: 1;
		justify-content: center;
	}

	.mode-btn {
		padding: 0.5rem 1rem;
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
		background: var(--color-sticky-bg);
		color: var(--color-secondary-gray);
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.mode-btn:hover {
		background: var(--color-input-bg);
		border-color: var(--color-secondary-gray);
	}

	.mode-btn.active {
		background: var(--color-fg);
		color: var(--color-bg);
		border-color: var(--color-fg);
	}

	.mode-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
		background: var(--color-input-bg);
	}

	.avatar-button,
	.login-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		height: 2.5rem;
		padding: 0 0.75rem;
		border-radius: 0.5rem;
		background: transparent;
		color: var(--color-fg);
		text-decoration: none;
		font-weight: 500;
		font-size: 0.875rem;
		transition: all 0.2s;
	}

	.avatar-button:hover,
	.login-button:hover {
		background: var(--color-input-bg);
		transform: scale(1.05);
	}

	:global(.avatar-root) {
		width: 2rem;
		height: 2rem;
	}

	:global(.avatar-fallback) {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		background: var(--color-fg);
		color: var(--color-bg);
		border-radius: 50%;
		font-size: 0.75rem;
		font-weight: 600;
	}

	@media (max-width: 1024px) {
		.top-bar {
			flex-wrap: wrap;
		}

		.mode-switcher {
			order: 3;
			flex-basis: 100%;
			justify-content: flex-start;
		}
	}

	@media (max-width: 768px) {
		.top-bar {
			padding: 0.75rem 1rem;
			gap: 0.75rem;
		}

		.octopus-icon {
			height: 3.5rem;
		}

		.mode-btn {
			padding: 0.4rem 0.9rem;
			font-size: 0.75rem;
			flex: 0 1 auto;
		}
	}

	@media (max-width: 480px) {
		.mode-btn {
			font-size: 0.9rem;
			padding: 0.35rem 0.6rem;
		}

		.octopus-icon {
			height: 3rem;
		}
	}
</style>
