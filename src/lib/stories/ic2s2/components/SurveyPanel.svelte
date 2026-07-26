<script lang="ts">
	import { onMount } from 'svelte';
	import { SurveyQuestion, type SurveyQuestionItem } from '$lib/components/survey';
	import { getMySurvey, saveSurveyAnswer } from '../data/survey.remote';
	import copy from '../data/copy.json';

	const questions = (copy.survey ?? []) as SurveyQuestionItem[];

	// Bindable answers, seeded empty so a binding never sees `undefined`.
	let answers = $state<Record<string, string | string[]>>(
		Object.fromEntries(questions.map((q) => [q.value.name, q.type === 'checkbox' ? [] : '']))
	);

	// Hydrate once from the attendee's saved row (identity = the logged-in
	// account, resolved server-side). Only fill still-empty fields, so a value
	// typed before this resolves is never clobbered by its stored predecessor.
	onMount(async () => {
		const row = (await getMySurvey()) as Record<string, unknown> | null;
		if (!row) return;
		for (const q of questions) {
			const stored = row[q.value.name];
			if (stored == null || stored === '') continue;
			const current = answers[q.value.name];
			const untouched = current === '' || (Array.isArray(current) && current.length === 0);
			if (untouched) {
				answers[q.value.name] = q.type === 'checkbox' ? String(stored).split(',') : String(stored);
			}
		}
	});

	// The shared question components call saveAnswer(name, value) with a plain
	// string name; the cast just meets the command's picklist input type (derived
	// from the command so it tracks the server's fields) — the server re-validates
	// the field, and the value is always a string here.
	type SurveyField = Exclude<Parameters<typeof saveSurveyAnswer>[0], void>['field'];
	const saveAnswer = (field: string, value: string | number | string[]) =>
		saveSurveyAnswer({
			field: field as SurveyField,
			value: Array.isArray(value) ? value : String(value)
		});
</script>

<div class="survey-panel">
	<section class="survey">
		{#each questions as item (item.value.name)}
			<SurveyQuestion {item} bind:value={answers[item.value.name]} {saveAnswer} />
		{/each}
	</section>
</div>

<style>
	.survey-panel {
		margin-top: 4rem;
	}
	.survey {
		display: flex;
		flex-direction: column;
		gap: 2.5rem;
		width: 100%;
		max-width: 40rem;
		margin: 0 auto;
	}
</style>
