<script lang="ts">
	import { MarkdownRenderer } from '@the-vcsi/scrolly-kit';

	// The question label, rendered as markdown so copy.json can format it (links,
	// **bold**, `code`, math…) like the rest of the story copy. Shared by every
	// SurveyQuestion.* leaf so the heading looks and reads the same everywhere.
	let { question, level = 3 }: { question: string; level?: number } = $props();
</script>

<!--
  A heading for assistive tech, but NOT an <h3> element: MarkdownRenderer emits
  block content (a <p> for a one-line question), which is invalid inside a
  heading and would break SSR hydration. role="heading" keeps question-to-
  question navigation for screen readers.
-->
<div class="question-text" role="heading" aria-level={level}>
	<MarkdownRenderer text={question} />
</div>

<style>
	.question-text {
		text-align: center;
		margin-bottom: 1rem;
		font-size: 1.2rem;
		font-weight: var(--vcsi-font-weight-semibold, 600);
		line-height: 1.4;
		color: var(--vcsi-survey-fg, var(--vcsi-fg, #333));
	}

	/* MarkdownRenderer wraps the question in block elements; strip their margins
	   so it reads like the old single heading rather than a paragraph. */
	.question-text :global(p) {
		margin: 0;
	}

	.question-text :global(a) {
		color: var(--vcsi-survey-accent, #0891b2);
	}

	@media (max-width: 640px) {
		.question-text {
			font-size: 1.3rem;
		}
	}
</style>
