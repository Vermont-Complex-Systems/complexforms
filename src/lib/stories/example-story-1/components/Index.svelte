<!--
  Index.svelte - Main story component

  This is the entry point for your scrollytelling story. It receives:
  - story: metadata from stories.csv (slug, title, description, etc.)
  - data: content from data/copy.json (title, subtitle, steps, etc.)
-->
<script lang="ts">
	// scrolly-kit provides reusable components for scrollytelling
	import { Footer, ScrollyContent, StoryHeader, RenderContent } from '@the-vcsi/scrolly-kit';

	// BackToHome shows a floating home button in the top-left corner
	import BackToHome from '$lib/components/helpers/BackToHome.svelte';

	// Your custom visualization component that reacts to scroll position
	import ScrollyPlot from './ScrollyPlot.svelte';

	// Props passed from the route's +page.svelte
	// - story: row from stories.csv matching this slug
	// - data: parsed content from data/copy.json
	let { story, data } = $props();

	// Track which step the user has scrolled to (0-indexed)
	// This value is bound to ScrollyContent and passed to ScrollyPlot
	let scrollyIndex = $state(0);
</script>

<!-- Floating home button - use 'colored' prop on light backgrounds -->
<BackToHome />

<!--
  The .story class provides default prose styling:
  - Centered content with max-width
  - Nice typography and spacing
  - Direct children get prose treatment automatically
-->
<article class="story">
	
	<!-- 
	You can use the exported StoryHeader component as:
	<StoryHeader
		title="My Story"
		subtitle="A deep dive into data"
		authors={[{ name: "Alice", url: "https://..." }]}
		date="February 2025"
		/> 
	Since copy.json contains the right arguments by design,
	we can simply "spread" props...	
	https://svelte.dev/tutorial/svelte/spread-props
	-->
	<StoryHeader {...data} />

	<!-- Alternatively, use header section centered by default -->
	<!-- <h1>{data.title}</h1>
	<p>{data.subtitle}</p> -->

	<!-- This component knows how to ingest copy.json -->
	<section class="intro">
		<RenderContent items={data.introduction} />
	</section>
	<!--
	  .split-layout creates a two-column scrollytelling layout:
	  - Left: sticky visualization panel (stays in view)
	  - Right: scrollable content steps

	  On mobile, it becomes an overlay layout where steps
	  appear over the visualization.
	-->
	<section class="split-layout">
		<!--
		  .sticky-panel stays fixed while user scrolls through steps.
		  Your visualization goes here - it receives scrollyIndex to
		  know which step is active and update accordingly.
		-->
		<div class="sticky-panel">
			<ScrollyPlot {scrollyIndex} steps={data.steps}/>
		</div>

		<!--
		  .scrolly-content contains the step boxes that trigger
		  scroll events. ScrollyContent renders each step from
		  data.steps and updates scrollyIndex as user scrolls.
		-->
		<div class="scrolly-content">
			<ScrollyContent steps={data.steps} bind:value={scrollyIndex}/>
		</div>
	</section>

	<h2>Conclusion</h2>
	<p>{data.conclusion}</p>
</article>

<!-- Footer - use theme="light" or theme="dark" to match your story's theme -->
<Footer />

<style>
	.story {
		--vcsi-step-height: 40vh;
		--vcsi-step-box-shadow: transparent;

		--vcsi-story-bg: rgb(44, 44, 44);
		--vcsi-story-fg: whitesmoke;

		--vcsi-story-step-bg: transparent;
		--vcsi-story-step-bg-inactive: transparent;
		--vcsi-story-step-fg-inactive: #666;
		--vcsi-story-step-fg: whitesmoke;
	}
	
	.split-layout {
		--vcsi-panel-width: 70%;
		--vcsi-layout-gap: 0rem;
		--separator-position: calc(100vw - var(--vcsi-panel-width, 45%) - var(--vcsi-content-padding-inline, 2rem));
	}

	.split-layout::before {
		content: '';              /* Creates an empty pseudo-element (required for ::before to render) */
		position: absolute;       /* Positions relative to .split-layout (which has position: relative) */
		
		right: calc(var(--vcsi-panel-width, 45%) + var(--vcsi-layout-gap, 2rem) / 2);
		/* ↑ Places the line from the right edge:
			- 70% (your panel width) + half the gap
			- So it sits between the content and panel columns */
		
		top: 0;                   /* Starts at the top of split-layout */
		bottom: 0;                /* Extends to the bottom of split-layout */
		
		width: 1px;               /* Line thickness */
		background: var(--vcsi-border, #ddd);  /* Line color (falls back to light gray) */
		pointer-events: none;     /* Clicks pass through the line to elements behind */
	}

	.intro {
		margin-bottom: 5rem;
	}

	
</style>
