<script lang="ts">
	import type { SaveAnswer, SurveyOption } from './types';
	import { createSaver } from './saver.svelte';
	import SaveFeedback from './SaveFeedback.svelte';

	let {
		question,
		name,
		value = $bindable(''),
		options,
		placeholder = 'Choose an option…',
		saveAnswer
	}: {
		question: string;
		name: string;
		value: string;
		options: SurveyOption[];
		placeholder?: string;
		saveAnswer: SaveAnswer;
	} = $props();

	const saver = createSaver();
</script>

<div class="select-question">
	<div class="question-text">
		<h3>{question}</h3>
	</div>

	<!--
	  Customizable <select> (Chromium 135+). The <button>/<selectedcontent>
	  markup + `appearance: base-select` CSS opt into the styleable picker;
	  browsers without support fall back to a plain native select.
	-->
	<select
		{name}
		class="survey-select"
		aria-label={question}
		bind:value
		onchange={() => saver.save(() => saveAnswer(name, value))}
	>
		<button>
			<selectedcontent></selectedcontent>
			<span class="arrow" aria-hidden="true"></span>
		</button>

		<option value="" disabled>{placeholder}</option>
		{#each options as option (option.value)}
			<option value={option.value}>
				<span class="option-short">{option.label}</span>
				{#if option.description}
					<span class="option-long">{option.description}</span>
				{/if}
			</option>
		{/each}
	</select>

	<SaveFeedback status={saver.status} message={saver.message} />
</div>

<style>
	.select-question {
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

	/*
	  The picker (::picker(select)) renders in the top layer and its own tree,
	  so scoped selectors can't reach it — style the customizable select via a
	  :global block, qualified by .survey-select so nothing leaks site-wide.
	*/
	:global {
		.survey-select,
		.survey-select::picker(select) {
			appearance: base-select;
		}

		.survey-select option::checkmark,
		.survey-select::picker-icon {
			display: none;
		}

		/* Closed control */
		.survey-select {
			display: grid;
			grid-template-columns: 1fr auto;
			align-items: center;
			gap: 1rem;
			width: 100%;
			box-sizing: border-box;
			margin: 0 auto;
			padding: 0.65rem 1rem;
			font: inherit;
			font-size: 1rem;
			color: var(--vcsi-survey-fg, var(--vcsi-fg, #333));
			background: var(--vcsi-survey-control-bg, #fff);
			border: 1px solid var(--vcsi-survey-border, var(--vcsi-border, #e0e0e0));
			border-radius: var(--vcsi-radius-lg, 8px);
			cursor: pointer;
			transition: border-color var(--vcsi-transition-base, 200ms ease);
		}

		.survey-select:hover,
		.survey-select:open {
			border-color: var(--vcsi-survey-accent, #0891b2);
		}

		.survey-select selectedcontent {
			text-align: left;
			font-weight: var(--vcsi-font-weight-semibold, 600);
		}

		/* Only the short label shows in the closed control */
		.survey-select selectedcontent .option-long {
			display: none;
		}

		.survey-select .arrow {
			justify-self: end;
			width: 0.6rem;
			height: 0.6rem;
			background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 66.49 42.37'%3E%3Cpath fill='%23555' d='M3.96,0h58.57c3.37,0,5.2,3.95,3.01,6.52l-29.28,34.46c-1.58,1.86-4.45,1.86-6.03,0L.95,6.52C-1.23,3.95.59,0,3.96,0Z'/%3E%3C/svg%3E");
			background-size: contain;
			background-position: center;
			background-repeat: no-repeat;
			transition: rotate var(--vcsi-transition-base, 200ms ease);
		}

		.survey-select:open .arrow {
			rotate: 180deg;
		}

		/* Options list */
		.survey-select::picker(select) {
			padding: 0;
			border: 1px solid var(--vcsi-survey-border, var(--vcsi-border, #ececec));
			border-radius: var(--vcsi-radius-lg, 8px);
			background: var(--vcsi-survey-control-bg, #fff);
			box-shadow: 0 12.8px 28.8px rgba(0, 0, 0, 0.13), 0 0 9.2px rgba(0, 0, 0, 0.11);
		}

		.survey-select option {
			display: grid;
			gap: 0.15rem;
			padding: 0.6rem 1rem;
			color: var(--vcsi-survey-fg, var(--vcsi-fg, #333));
			cursor: pointer;
		}

		.survey-select option:hover {
			background: var(--vcsi-survey-option-hover, #cbe7ff);
		}

		.survey-select option:disabled {
			color: var(--vcsi-survey-muted, var(--vcsi-muted, #999));
			cursor: default;
		}

		.survey-select option .option-short {
			font-weight: var(--vcsi-font-weight-semibold, 600);
		}

		.survey-select option .option-long {
			font-size: 80%;
			color: var(--vcsi-survey-muted, var(--vcsi-muted, #595959));
		}
	}

	@media (max-width: 640px) {
		.question-text h3 {
			font-size: 1.3rem;
		}
	}
</style>
