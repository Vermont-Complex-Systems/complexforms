<script lang="ts">
	import { ScrollyContent, RenderContent } from '@the-vcsi/scrolly-kit';
	import type { ContentItem } from '@the-vcsi/scrolly-kit';
	import Question from './SurveyQuestion.svelte';
	import type { SurveyField } from '../data/schema';

	type QuestionItem = {
		type: 'question';
		value: {
			question: string;
			name: SurveyField;
			options: { value: string; label: string }[];
			multiple?: boolean;
		};
	};

	// A survey step is either a question or any scrolly-kit content item
	// (markdown/html/math/code) rendered as prose between questions.
	type SurveyItem = QuestionItem | ContentItem;

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

<!--
  Reuse scrolly-kit's ScrollyContent for the step layout / spacers / scroll
  detection, and supply a custom contentRenderer so each step renders an
  interactive survey question (or prose for non-question items).
-->
<ScrollyContent steps={items as ContentItem[]} bind:value={scrollyIndex}>
	{#snippet contentRenderer(step)}
		{@const item = step as SurveyItem}
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
	{/snippet}
</ScrollyContent>
