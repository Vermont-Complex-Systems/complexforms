<script lang="ts">
	import { generateFingerprint } from '$lib/utils/browserFingerprint.js';
	import { StoryHeader, ScrollIndicator, RenderContent, Footer } from '@the-vcsi/scrolly-kit';
	import BackToHome from '$lib/components/helpers/BackToHome.svelte';
	import ConsentPopup from './ConsentPopup.svelte';
	import DemographicsBox from './DemographicsBox.svelte';
	import SurveyScrolly from './SurveyScrolly.svelte';
	import { saveAnswer as saveAnswerRemote, getSurveyResponse } from '../data/survey.remote.js';
	import type { SurveyField } from '$lib/server/db/schema';

	let { story, data } = $props();

	let hasConsented = $state(false);
	let checkingConsent = $state(true);
	let userFingerprint = $state('');

	let surveyAnswers: Partial<Record<SurveyField, string | string[]>> = $state({
		socialMediaPrivacy: '',
		platformMatters: [],
		relativePreferences: '',
		age: '',
		genderOrd: '',
		orientationOrd: '',
		raceOrd: ''
	});

	async function checkExistingConsent() {
		try {
			userFingerprint = await generateFingerprint();
			const survey = await getSurveyResponse(userFingerprint);
			hasConsented = !!survey?.consent;
		} catch (err) {
			console.error('Failed to check existing consent:', err);
		} finally {
			checkingConsent = false;
		}
	}

	$effect(() => {
		checkExistingConsent();
	});

	async function handleConsentAccept() {
		hasConsented = true;
		try {
			userFingerprint ||= await generateFingerprint();
			await saveAnswer('consent', 'accepted');
		} catch (err) {
			console.error('Failed to save consent:', err);
		}
	}

	// Plain function: it reads the $state `userFingerprint` at call time, so it
	// always sees the latest value without needing $derived.
	function saveAnswer(field: SurveyField, value: string | number | string[]) {
		if (!userFingerprint) return Promise.resolve();
		return saveAnswerRemote({ fingerprint: userFingerprint, field, value });
	}
</script>

{#if !checkingConsent && !hasConsented}
	<ConsentPopup onAccept={handleConsentAccept} {userFingerprint} {saveAnswer} />
{/if}

<BackToHome />
<ScrollIndicator />

<article class="story theme-dark" id="dark-data-survey">
	<StoryHeader {...data} />

	<section id="intro" class="prose">
		<RenderContent items={data.intro} />
	</section>

	<section id="survey">
		<SurveyScrolly items={data.survey} {userFingerprint} {saveAnswer} {surveyAnswers} />
	</section>

	<section id="demographics" class="prose">
		<RenderContent items={data.postSurvey} />
		<DemographicsBox {userFingerprint} {saveAnswer} {surveyAnswers} />
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

	/* Survey step boxes render light so the question controls (which use dark
	   text) stay readable against the dark story background. */
	:global(#dark-data-survey .survey-scrolly .step > *) {
		padding: 1rem;
		background: #f5f5f5;
		color: #333;
		border-radius: 5px;
		box-shadow: 1px 1px 10px rgba(0, 0, 0, 0.2);
		transition: all 500ms ease;
		text-align: center;
		max-width: 600px;
		margin: 0 auto;
	}
</style>
