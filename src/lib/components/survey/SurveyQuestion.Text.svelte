<script lang="ts">
	import type { SaveAnswer } from './types';
	import { createSaver } from './saver.svelte';
	import SaveFeedback from './SaveFeedback.svelte';

	let {
		question,
		name,
		value = $bindable(''),
		placeholder = '',
		saveAnswer
	}: {
		question: string;
		name: string;
		value: string;
		placeholder?: string;
		saveAnswer: SaveAnswer;
	} = $props();

	const saver = createSaver();

	const submit = () => saver.save(() => saveAnswer(name, value));

	function onkeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
			e.preventDefault();
			submit();
		}
	}
</script>

<div class="text-question">
	<div class="question-text">
		<h3>{question}</h3>
	</div>
	<!-- Free text needs an explicit submit: unlike a select/radio there is no
	     obvious "change" moment, and a silent blur-save is undiscoverable. -->
	<textarea {name} {placeholder} rows="4" bind:value {onkeydown}></textarea>
	<div class="actions">
		<SaveFeedback status={saver.status} message={saver.message} />
		<button
			type="button"
			title="Ctrl+Enter / ⌘+Enter"
			onclick={submit}
			disabled={saver.status === 'saving'}
		>
			Save
		</button>
	</div>
</div>

<style>
	.text-question {
		width: 100%;
	}

	.question-text {
		text-align: center;
		margin-bottom: 1rem;
	}

	.question-text h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.2rem;
		font-weight: var(--vcsi-font-weight-semibold, 600);
		color: var(--vcsi-survey-fg, var(--vcsi-fg, #333));
	}

	textarea {
		display: block;
		width: 100%;
		box-sizing: border-box;
		padding: 0.75rem;
		font: inherit;
		font-size: 1rem;
		color: var(--vcsi-survey-fg, var(--vcsi-fg, #333));
		background: var(--vcsi-survey-control-bg-muted, #f9f9f9);
		border: 1px solid var(--vcsi-survey-border, var(--vcsi-border, #e0e0e0));
		border-radius: var(--vcsi-radius-sm, 3px);
		resize: vertical;
		transition: border-color var(--vcsi-transition-base, 200ms ease);
	}

	textarea:hover {
		border-color: var(--vcsi-survey-accent, #0891b2);
	}

	textarea:focus {
		outline: none;
		border-color: var(--vcsi-survey-accent, #0891b2);
		background: var(--vcsi-survey-control-bg, #fff);
	}

	.actions {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.75rem;
		margin-top: 0.75rem;
	}

	/* The feedback chip brings its own top margin for the stacked layout;
	   inside this flex row the row provides the spacing instead. */
	.actions :global(.save-feedback-container) {
		margin-top: 0;
	}

	.actions button {
		font: inherit;
		font-size: 0.9rem;
		font-weight: var(--vcsi-font-weight-semibold, 600);
		color: #fff;
		background: var(--vcsi-survey-accent, #0891b2);
		border: none;
		border-radius: var(--vcsi-radius-sm, 3px);
		padding: 0.45rem 1.1rem;
		cursor: pointer;
		transition: filter var(--vcsi-transition-base, 200ms ease);
	}

	.actions button:hover:not(:disabled) {
		filter: brightness(1.1);
	}

	.actions button:disabled {
		opacity: 0.6;
		cursor: default;
	}

	@media (max-width: 640px) {
		.question-text h3 {
			font-size: 1.3rem;
		}
	}
</style>
