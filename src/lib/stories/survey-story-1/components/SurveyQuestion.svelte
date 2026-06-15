<script lang="ts">
	import RadioQuestion from './SurveyQuestion.Radio.svelte';
	import CheckboxQuestion from './SurveyQuestion.Checkbox.svelte';
	import type { SurveyField } from '../data/schema';

	let {
		question,
		name,
		value = $bindable(),
		options,
		multiple = false,
		userFingerprint,
		saveAnswer
	}: {
		question: string;
		name: SurveyField;
		value: string | string[];
		options: { value: string; label: string }[];
		multiple?: boolean;
		userFingerprint: string;
		saveAnswer: (field: SurveyField, value: string | number | string[]) => Promise<unknown>;
	} = $props();

	let saveStatus: 'idle' | 'saving' | 'saved' | 'error' = $state('idle');
	let saveMessage = $state('');

	async function handleSave() {
		saveStatus = 'saving';
		saveMessage = 'Saving...';
		try {
			await saveAnswer(name, value);
			saveStatus = 'saved';
			saveMessage = 'Saved ✓';
			setTimeout(() => {
				saveStatus = 'idle';
				saveMessage = '';
			}, 2000);
		} catch (error) {
			console.error('Failed to save answer:', error);
			saveStatus = 'error';
			saveMessage = 'Error ✗';
			setTimeout(() => {
				saveStatus = 'idle';
				saveMessage = '';
			}, 3000);
		}
	}
</script>

{#if multiple}
	<CheckboxQuestion
		{question}
		{name}
		bind:value={value as string[]}
		{options}
		onchange={handleSave}
		{saveStatus}
		{saveMessage}
	/>
{:else}
	<RadioQuestion
		{question}
		{name}
		bind:value={value as string}
		{options}
		onchange={handleSave}
		{saveStatus}
		{saveMessage}
	/>
{/if}
