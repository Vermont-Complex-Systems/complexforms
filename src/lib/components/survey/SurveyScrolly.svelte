<script lang="ts">
	import { ScrollyContent, RenderContent } from '@the-vcsi/scrolly-kit';
	import type { ContentItem } from '@the-vcsi/scrolly-kit';
	import SurveyQuestion from './SurveyQuestion.svelte';
	import { isQuestionItem, type SaveAnswer, type SurveyAnswers, type SurveyQuestionItem } from './types';

	// A survey step is either a question or any scrolly-kit content item
	// (markdown/html/math/code) rendered as prose between questions.
	type SurveyItem = SurveyQuestionItem | ContentItem;

	let {
		items,
		answers = $bindable(),
		saveAnswer,
		value = $bindable(0)
	}: {
		items: SurveyItem[];
		answers: SurveyAnswers;
		saveAnswer: SaveAnswer;
		value?: number;
	} = $props();
</script>

<!--
  Reuse scrolly-kit's ScrollyContent for the step layout / spacers / scroll
  detection, and supply a custom contentRenderer so each step renders an
  interactive survey question (or prose for non-question items).
-->
<ScrollyContent steps={items as ContentItem[]} bind:value>
	{#snippet contentRenderer(step)}
		{@const item = step as SurveyItem}
		{#if isQuestionItem(item)}
			<SurveyQuestion {item} bind:value={answers[item.value.name]} {saveAnswer} />
		{:else}
			<RenderContent items={item} />
		{/if}
	{/snippet}
</ScrollyContent>
