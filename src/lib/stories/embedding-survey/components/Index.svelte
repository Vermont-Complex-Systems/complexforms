<script lang="ts">
	import Footer from '$lib/components/Footer.svelte';
	import ConferenceLogo from './ConferenceLogo.svelte';
	import { SurveyQuestion, createSurveyClient, type SurveyQuestionItem } from '$lib/components/survey';
	import * as remote from '../data/survey.remote.js';

	let { data } = $props();

	const questions = $derived(data.survey as SurveyQuestionItem[]);

	// copy.json content is static, so capturing its initial value is intended.
	// svelte-ignore state_referenced_locally
	const survey = createSurveyClient(remote, { questions: data.survey });
</script>

<ConferenceLogo />

<article class="story">
	<section class="survey prose">
		{#each questions as item (item.value.name)}
			<SurveyQuestion {item} bind:value={survey.answers[item.value.name]} saveAnswer={survey.saveAnswer} />
		{/each}
	</section>
</article>

<Footer theme="dark" />

<style>
	/* Fill at least one viewport (footer below the fold on landing) and center
	   the questions vertically within it. Top padding keeps short viewports
	   from pushing content under the absolutely-positioned logo. */
	.story {
		min-height: 100svh;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding: 5rem 1rem 2rem;
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
