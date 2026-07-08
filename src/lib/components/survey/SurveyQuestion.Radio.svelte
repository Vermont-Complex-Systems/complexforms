<script lang="ts">
	import { RadioGroup, Label } from 'bits-ui';
	import type { SaveAnswer, SurveyOption } from './types';
	import { createSaver } from './saver.svelte';
	import SaveFeedback from './SaveFeedback.svelte';

	let {
		question,
		name,
		value = $bindable(''),
		options,
		saveAnswer
	}: {
		question: string;
		name: string;
		value: string;
		options: SurveyOption[];
		saveAnswer: SaveAnswer;
	} = $props();

	const saver = createSaver();
</script>

<div class="radio-question">
	<div class="question-text">
		<h3>{question}</h3>
	</div>
	<div class="survey-controls">
		<RadioGroup.Root
			bind:value
			{name}
			class="radio-group"
			onValueChange={() => saver.save(() => saveAnswer(name, value))}
		>
			{#each options as option (option.value)}
				<div class="radio-item" class:checked={value === option.value}>
					<RadioGroup.Item id={`${name}-${option.value}`} value={option.value} class="radio-button" />
					<Label.Root for={`${name}-${option.value}`} class="radio-label">{option.label}</Label.Root>
				</div>
			{/each}
		</RadioGroup.Root>
	</div>
	<SaveFeedback status={saver.status} message={saver.message} />
</div>

<style>
	.radio-question {
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

	/* bits-ui renders these classes on its own elements, so they need :global —
	   qualified by the scoped wrapper so nothing leaks site-wide. */
	.radio-question :global(.radio-group) {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin: 0 auto;
		width: fit-content;
	}

	.radio-question :global(.radio-item) {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		position: relative;
	}

	.radio-question :global(.radio-button) {
		/* Reset native button styles */
		-webkit-appearance: none;
		appearance: none;
		margin: 0;
		padding: 0;

		/* Sizing */
		width: 1.15em;
		height: 1.15em;
		font: inherit;

		/* Visual */
		color: var(--vcsi-survey-muted, var(--vcsi-muted, #666));
		background: var(--vcsi-survey-control-bg, #fff);
		border: 0.15em solid currentColor;
		border-radius: 50%;
		cursor: pointer;

		/* Layout for inner dot */
		display: grid;
		place-content: center;

		/* Prevent shrinking */
		flex-shrink: 0;
	}

	.radio-question :global(.radio-button::before) {
		content: '';
		width: 0.65em;
		height: 0.65em;
		border-radius: 50%;
		transform: scale(0);
		transition: 120ms transform ease-in-out;
		box-shadow: inset 1em 1em var(--vcsi-survey-accent, #0891b2);
	}

	.radio-question :global(.radio-button:hover),
	.radio-question :global(.radio-button[data-state='checked']) {
		color: var(--vcsi-survey-accent, #0891b2);
	}

	.radio-question :global(.radio-button[data-state='checked']::before) {
		transform: scale(1);
	}

	.radio-question :global(.radio-button:focus) {
		outline: none;
	}

	.radio-question :global(.radio-button:focus-visible) {
		outline: max(2px, 0.15em) solid currentColor;
		outline-offset: max(2px, 0.15em);
	}

	.radio-question :global(.radio-label) {
		cursor: pointer;
		user-select: none;
		color: var(--vcsi-survey-fg, var(--vcsi-fg, #333));
	}

	@media (max-width: 640px) {
		.question-text h3 {
			font-size: 1.3rem;
		}
	}
</style>
