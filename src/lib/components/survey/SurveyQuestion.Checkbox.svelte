<script lang="ts">
	import type { SaveAnswer, SurveyOption } from './types';
	import { createSaver } from './saver.svelte';
	import SaveFeedback from './SaveFeedback.svelte';

	let {
		question,
		name,
		value = $bindable([]),
		options,
		saveAnswer
	}: {
		question: string;
		name: string;
		value: string[];
		options: SurveyOption[];
		saveAnswer: SaveAnswer;
	} = $props();

	const saver = createSaver();

	function handleCheckboxChange(optionValue: string, isChecked: boolean) {
		if (isChecked) {
			value = [...value, optionValue];
		} else {
			value = value.filter((v) => v !== optionValue);
		}
		saver.save(() => saveAnswer(name, value));
	}
</script>

<div class="checkbox-question">
	<div class="question-text">
		<h3>{question}</h3>
	</div>
	<div class="options">
		{#each options as option (option.value)}
			<label class="checkbox-option">
				<input
					type="checkbox"
					{name}
					value={option.value}
					checked={value.includes(option.value)}
					onchange={(e) => handleCheckboxChange(option.value, (e.target as HTMLInputElement).checked)}
				/>
				<span>{option.label}</span>
			</label>
		{/each}
	</div>
	<SaveFeedback status={saver.status} message={saver.message} />
</div>

<style>
	.checkbox-question {
		width: 100%;
	}

	.question-text {
		text-align: center;
		margin-bottom: 1rem;
	}

	.question-text h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.1rem;
		font-weight: var(--vcsi-font-weight-semibold, 600);
		color: var(--vcsi-survey-fg, var(--vcsi-fg, #333));
		line-height: 1.4;
	}

	.options {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.checkbox-option {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background: var(--vcsi-survey-control-bg-muted, #f9f9f9);
		border: 1px solid var(--vcsi-survey-border, var(--vcsi-border, #e0e0e0));
		border-radius: var(--vcsi-radius-sm, 3px);
		cursor: pointer;
		transition: all var(--vcsi-transition-base, 200ms ease);
	}

	.checkbox-option:hover {
		background: var(--vcsi-survey-control-bg, #f0f0f0);
		border-color: var(--vcsi-survey-accent, #0891b2);
	}

	input[type='checkbox'] {
		width: 18px;
		height: 18px;
		cursor: pointer;
		accent-color: var(--vcsi-survey-accent, #0891b2);
	}

	.checkbox-option span {
		flex: 1;
		font-size: 1rem;
		color: var(--vcsi-survey-fg, var(--vcsi-fg, #333));
	}

	@media (max-width: 640px) {
		.question-text h3 {
			font-size: 1.3rem;
		}

		.checkbox-option {
			padding: 0.6rem;
		}

		.checkbox-option span {
			font-size: 0.9rem;
		}
	}
</style>
