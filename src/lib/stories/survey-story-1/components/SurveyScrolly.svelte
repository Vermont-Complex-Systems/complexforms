<script lang="ts">
	import { Scrolly, RenderContent } from '@the-vcsi/scrolly-kit';
	import Question from './SurveyQuestion.svelte';
	import type { SurveyField } from '$lib/server/db/schema';

	type SurveyItem = {
		type: 'question' | 'text';
		value: {
			question: string;
			name: SurveyField;
			options: { value: string; label: string }[];
			multiple?: boolean;
			text?: string;
		};
	};

	let {
		items,
		userFingerprint,
		saveAnswer,
		surveyAnswers
	}: {
		items: SurveyItem[];
		userFingerprint: string;
		saveAnswer: (field: SurveyField, value: string | number | string[]) => Promise<unknown>;
		surveyAnswers: Partial<Record<SurveyField, string | string[]>>;
	} = $props();

	let scrollyIndex = $state(0);
</script>

<div class="scrolly-content survey-scrolly">
	<Scrolly bind:value={scrollyIndex}>
		{#each items as item, i (i)}
			{@const active = scrollyIndex === i}
			<div class="step" class:active>
				<div class="step-content">
					{#if item.type === 'question'}
						<Question
							question={item.value.question}
							name={item.value.name}
							bind:value={surveyAnswers[item.value.name] as string | string[]}
							options={item.value.options}
							multiple={item.value.multiple || false}
							{userFingerprint}
							{saveAnswer}
						/>
					{:else}
						<RenderContent items={item} />
					{/if}
				</div>
			</div>
		{/each}
	</Scrolly>
	<div class="spacer"></div>
</div>
