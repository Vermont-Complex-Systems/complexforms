<script lang="ts">
	import type { Snippet } from 'svelte';

	// Generic consent gate: the story supplies the body text as children and
	// decides in onAccept what "consent" means (fingerprint, saved field, …).
	// Declining just dismisses — nothing is generated or stored.
	let {
		onAccept,
		onDecline,
		acceptLabel = 'I Consent',
		declineLabel = 'Decline',
		children
	}: {
		onAccept: () => void | Promise<void>;
		onDecline?: () => void;
		acceptLabel?: string;
		declineLabel?: string;
		children: Snippet;
	} = $props();

	let showPopup = $state(true);

	async function handleAccept() {
		showPopup = false;
		await onAccept();
	}

	function handleDecline() {
		showPopup = false;
		onDecline?.();
	}

	// Dismiss only when the backdrop itself is clicked, not its content.
	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) handleDecline();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') handleDecline();
	}
</script>

{#if showPopup}
<div
	class="popup-overlay"
	role="button"
	tabindex="0"
	aria-label="Dismiss consent dialog"
	onclick={handleBackdropClick}
	onkeydown={handleKeydown}
>
	<div class="popup-content">
		<div class="popup-body">
			{@render children()}
		</div>

		<div class="popup-actions">
			<button class="btn-decline" onclick={handleDecline}>{declineLabel}</button>
			<button class="btn-accept" onclick={handleAccept}>{acceptLabel}</button>
		</div>
	</div>
</div>
{/if}

<style>
	.popup-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(0, 0, 0, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10000;
		padding: 1rem;
		box-sizing: border-box;
	}

	.popup-content {
		background: var(--vcsi-survey-popup-bg, #1a1a1a);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 12px;
		max-width: 400px;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
	}

	.popup-body {
		padding: 1.5rem;
		color: var(--vcsi-survey-popup-fg, rgba(255, 255, 255, 0.9));
		line-height: var(--vcsi-line-height-relaxed, 1.6);
	}

	.popup-body :global(p) {
		margin: 0 0 1rem 0;
	}

	.popup-actions {
		padding: 1rem 1.5rem 1.5rem;
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	button {
		padding: 0.75rem 1.5rem;
		border-radius: var(--vcsi-radius-md, 6px);
		font-size: 1rem;
		font-weight: var(--vcsi-font-weight-medium, 500);
		cursor: pointer;
		transition: all var(--vcsi-transition-base, 200ms ease);
		border: none;
	}

	.btn-decline {
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.7);
	}

	.btn-decline:hover {
		background: rgba(255, 255, 255, 0.15);
		color: whitesmoke;
	}

	.btn-accept {
		background: var(--vcsi-survey-accent, #0891b2);
		color: white;
	}

	.btn-accept:hover {
		background: var(--vcsi-survey-accent-hover, #0e7490);
	}

	@media (max-width: 640px) {
		.popup-content {
			max-height: 95vh;
		}

		.popup-body {
			padding: 1rem;
			font-size: 0.9rem;
		}

		.popup-actions {
			flex-direction: column-reverse;
		}

		button {
			width: 100%;
		}
	}
</style>
