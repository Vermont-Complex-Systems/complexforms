<script lang="ts">
	import { StoryHeader, ScrollIndicator, RenderContent } from '@the-vcsi/scrolly-kit';
	import Footer from '$lib/components/Footer.svelte';
	import BackToHome from '$lib/components/helpers/BackToHome.svelte';
	import DemographicsBox from './DemographicsBox.svelte';
	import { ConsentPopup, SurveyScrolly, createSurveyClient } from '$lib/components/survey';
	import * as remote from '../data/survey.remote.js';

	let { data } = $props();

	// copy.json content is static, so capturing its initial value is intended.
	// svelte-ignore state_referenced_locally
	const survey = createSurveyClient(remote, {
		questions: data.survey,
		// Research story behind a consent gate: fingerprint dedup, and the same
		// returning browser is recognized as already having consented.
		identity: 'fingerprint'
	});

	let accepted = $state(false);
	const hasConsented = $derived(accepted || !!survey.response?.consent);

	async function handleConsentAccept() {
		accepted = true;
		try {
			// Nothing is persisted server-side until this first save.
			await survey.saveAnswer('consent', 'accepted');
		} catch (err) {
			console.error('Failed to save consent:', err);
		}
	}
</script>

{#if !survey.loading && !hasConsented}
	<ConsentPopup onAccept={handleConsentAccept}>
		<p>This is an interactive data essay on privacy preferences and data sharing behaviors.</p>
		<p>
			As part of the story, we ask a few anonymous questions about privacy preferences and
			demographics to inform the interactive story, and, conditional on consent, inform our ongoing
			research on the topic.
		</p>
	</ConsentPopup>
{/if}

<BackToHome />
<ScrollIndicator />

<article class="story theme-dark" id="dark-data-survey">
	<StoryHeader {...data} />

	<section id="intro" class="prose">
		<RenderContent items={data.intro} />
	</section>

	<section id="survey">
		<SurveyScrolly items={data.survey} bind:answers={survey.answers} saveAnswer={survey.saveAnswer} />
	</section>

	<section id="demographics" class="prose">
		<RenderContent items={data.postSurvey} />
		<DemographicsBox bind:surveyAnswers={survey.answers} saveAnswer={survey.saveAnswer} />
	</section>

	<h2 class="prose">Appendix</h2>
	<section id="appendix" class="prose">
		<RenderContent items={data.appendix} />
	</section>
</article>

<Footer theme="dark" />

<style>
	.story {
		--vcsi-story-bg: rgb(26, 26, 26);
		--vcsi-story-fg: whitesmoke;
	}

	/* The survey questions use dark text, so override the scrolly-kit step-box
	   colors (consumed by ScrollyContent) to render light, readable boxes
	   against the dark story background — and pin the shared survey-control
	   tokens to the light boxes so they don't inherit the dark story theme.
	   Custom properties inherit into ScrollyContent's step boxes. */
	#survey {
		--vcsi-story-step-bg: #ffffff;
		--vcsi-story-step-fg: #333;
		--vcsi-story-step-bg-inactive: #ededed;
		--vcsi-story-step-fg-inactive: #888;
		--vcsi-survey-fg: #333;
		--vcsi-survey-muted: #666;
		--vcsi-survey-border: #e0e0e0;
		--vcsi-survey-control-bg: #fff;
		--vcsi-survey-control-bg-muted: #f9f9f9;
	}
</style>
