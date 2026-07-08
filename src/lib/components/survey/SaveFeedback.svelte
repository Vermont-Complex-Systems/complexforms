<script lang="ts">
	import type { SaveStatus } from './saver.svelte';

	let { status = 'idle', message = '' }: { status?: SaveStatus; message?: string } = $props();
</script>

<div class="save-feedback-container">
	{#if message}
		<span
			class="save-feedback"
			class:success={status === 'saved'}
			class:error={status === 'error'}
			class:saving={status === 'saving'}
		>
			{message}
		</span>
	{/if}
</div>

<style>
	.save-feedback-container {
		display: flex;
		justify-content: center;
		align-items: center;
		margin-top: 0.75rem;
		min-height: 1.5rem;
	}

	.save-feedback {
		display: inline-block;
		font-size: 0.75rem;
		font-weight: var(--vcsi-font-weight-medium, 500);
		padding: 0.2rem 0.6rem;
		border-radius: var(--vcsi-radius-sm, 3px);
		opacity: 0;
		animation: fadeInOut 2s ease-in-out;
		white-space: nowrap;
	}

	.save-feedback.success {
		background: #d4edda;
		color: #155724;
		border: 1px solid #c3e6cb;
	}

	.save-feedback.error {
		background: #f8d7da;
		color: #721c24;
		border: 1px solid #f5c6cb;
	}

	.save-feedback.saving {
		background: #d1ecf1;
		color: #0c5460;
		border: 1px solid #bee5eb;
		opacity: 1;
	}

	@keyframes fadeInOut {
		0% { opacity: 0; transform: translateY(-2px); }
		20% { opacity: 1; transform: translateY(0); }
		80% { opacity: 1; transform: translateY(0); }
		100% { opacity: 0; transform: translateY(-2px); }
	}
</style>
