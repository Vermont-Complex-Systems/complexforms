<script lang="ts">
	import type { SaveAnswer, SurveyQuestionItem } from './types';
	import RadioQuestion from './SurveyQuestion.Radio.svelte';
	import CheckboxQuestion from './SurveyQuestion.Checkbox.svelte';
	import SelectQuestion from './SurveyQuestion.Select.svelte';
	import TextQuestion from './SurveyQuestion.Text.svelte';

	// Dispatches a copy.json question item (`radio | checkbox | select | text`)
	// to its component, so stories never import the concrete question types.
	let {
		item,
		value = $bindable(),
		saveAnswer
	}: {
		item: SurveyQuestionItem;
		value: string | string[] | undefined;
		saveAnswer: SaveAnswer;
	} = $props();

	// Seed an unanswered question so the leaf components (whose `value` has a
	// fallback) never receive an explicit `undefined` through the binding.
	// Initial-only on purpose: a question item never changes type in place.
	// svelte-ignore state_referenced_locally
	if (value === undefined) value = item.type === 'checkbox' ? [] : '';
</script>

{#if item.type === 'radio'}
	<RadioQuestion
		question={item.value.question}
		name={item.value.name}
		bind:value={value as string}
		options={item.value.options ?? []}
		{saveAnswer}
	/>
{:else if item.type === 'checkbox'}
	<CheckboxQuestion
		question={item.value.question}
		name={item.value.name}
		bind:value={value as string[]}
		options={item.value.options ?? []}
		{saveAnswer}
	/>
{:else if item.type === 'select'}
	<SelectQuestion
		question={item.value.question}
		name={item.value.name}
		bind:value={value as string}
		options={item.value.options ?? []}
		placeholder={item.value.placeholder}
		{saveAnswer}
	/>
{:else if item.type === 'text'}
	<TextQuestion
		question={item.value.question}
		name={item.value.name}
		bind:value={value as string}
		placeholder={item.value.placeholder}
		{saveAnswer}
	/>
{/if}
