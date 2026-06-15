<script lang="ts">
	import { generateFingerprint } from '$lib/utils/browserFingerprint.js';
	import { StoryHeader, ScrollIndicator, RenderContent } from '@the-vcsi/scrolly-kit';
	import Footer from '$lib/components/Footer.svelte';
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

	/* The survey questions use dark text, so override the scrolly-kit step-box
	   colors (consumed by ScrollyContent) to render light, readable boxes
	   against the dark story background. Custom properties inherit into
	   ScrollyContent's step boxes. */
	#survey {
		--vcsi-story-step-bg: #ffffff;
		--vcsi-story-step-fg: #333;
		--vcsi-story-step-bg-inactive: #ededed;
		--vcsi-story-step-fg-inactive: #888;
	}
</style>
