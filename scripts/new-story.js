#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Parse arguments
const args = process.argv.slice(2);
const detailed = args.includes('--detailed');
const slug = args.find((arg) => !arg.startsWith('--'));

if (!slug) {
	console.error('Usage: npm run new-story <slug> [--detailed]');
	console.error('');
	console.error('Examples:');
	console.error('  npm run new-story my-story           # minimal template');
	console.error('  npm run new-story my-story --detailed  # with documentation');
	process.exit(1);
}

// Validate slug format
if (!/^[a-z0-9-]+$/.test(slug)) {
	console.error('Error: Slug must contain only lowercase letters, numbers, and hyphens');
	process.exit(1);
}

const storyDir = path.join('src/lib/stories', slug);

// Check if story already exists
if (fs.existsSync(storyDir)) {
	console.error(`Error: Story "${slug}" already exists at ${storyDir}`);
	process.exit(1);
}

// Create directory structure
fs.mkdirSync(path.join(storyDir, 'components'), { recursive: true });
fs.mkdirSync(path.join(storyDir, 'data'), { recursive: true });

// Generate title from slug (my-story -> My Story)
const title = slug
	.split('-')
	.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
	.join(' ');

// =============================================================================
// TEMPLATES
// =============================================================================

const indexSvelteMinimal = `<script lang="ts">
	import { Footer, ScrollyContent } from '@the-vcsi/scrolly-kit';
	import BackToHome from '$lib/components/helpers/BackToHome.svelte';
	import ScrollyPlot from './ScrollyPlot.svelte';

	let { story, data } = $props();

	let scrollyIndex = $state(0);
</script>

<BackToHome />

<article class="story">
	<h1>{data.title}</h1>
	<p>{data.subtitle}</p>

	<section class="split-layout">
		<div class="sticky-panel">
			<ScrollyPlot {scrollyIndex}/>
		</div>

		<div class="scrolly-content">
			<ScrollyContent steps={data.steps} bind:value={scrollyIndex}/>
		</div>
	</section>
</article>

<Footer />
`;

const indexSvelteDetailed = `<!--
  Index.svelte - Main story component

  This is the entry point for your scrollytelling story. It receives:
  - story: metadata from stories.csv (slug, title, description, etc.)
  - data: content from data/copy.json (title, subtitle, steps, etc.)
-->
<script lang="ts">
	// scrolly-kit provides reusable components for scrollytelling
	import { Footer, ScrollyContent, StoryHeader } from '@the-vcsi/scrolly-kit';

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
	<h1>{data.title}</h1>
	<p>{data.subtitle}</p>

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
</article>

<!-- Footer - use theme="light" or theme="dark" to match your story's theme -->
<Footer />

<style>
	/* .scrolly-content {
		--vcsi-step-height: 20vh;
		--vcsi-story-step-bg-inactive: red;
	} */
</style>
`;

const scrollyPlotMinimal = `<script>
	import { Tween } from 'svelte/motion';
	import data from '../data/data.csv';

	let { scrollyIndex } = $props();

	let highlighted = $derived(
		scrollyIndex === 0 ? null :
		scrollyIndex === 1 ? 'B' :
		scrollyIndex === 2 ? 'A' : 'all'
	);

	// Tween the Y-axis max value to "zoom in" on the data
	// Tween.of() reactively tracks the derived value
	const maxValue = Tween.of(() => scrollyIndex >= 3 ? 35 : 60, { duration: 600 });

	const width = 300;
	const height = 200;
	const barWidth = 40;
	const gap = 15;
	const marginY = 40;

	// Center bars horizontally
	const totalBarsWidth = data.length * barWidth + (data.length - 1) * gap;
	const marginX = (width - totalBarsWidth) / 2;
</script>

<div class="chart">
	<svg viewBox="0 0 {width} {height}">
		{#each data as d, i}
			{@const value = +d.value}
			{@const barHeight = (value / maxValue.current) * (height - marginY)}
			{@const x = marginX + i * (barWidth + gap)}
			{@const y = height - marginY - barHeight}
			{@const isHighlighted = highlighted === 'all' || highlighted === d.label}

			<rect
				{x}
				{y}
				width={barWidth}
				height={barHeight}
				fill={isHighlighted ? 'var(--vcsi-color-accent, #154734)' : '#ccc'}
				rx="4"
				style="transition: fill 0.3s ease;"
			/>
			<text
				x={x + barWidth / 2}
				y={height - marginY + 15}
				text-anchor="middle"
				font-size="12"
			>
				{d.label}
			</text>
		{/each}
	</svg>
</div>

<style>
	.chart {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	svg {
		max-width: 100%;
		height: auto;
	}

	text {
		fill: var(--vcsi-color-text, #333);
	}
</style>
`;

const scrollyPlotDetailed = `<!--
  ScrollyPlot.svelte - Visualization component

  This component renders a visualization that responds to scroll position.
  It receives scrollyIndex (0, 1, 2, ...) and updates its display accordingly.

  This example demonstrates:
  - Importing data from CSV
  - Using D3 scales for proper positioning
  - Per-bar scaling based on scroll step
-->
<script>
	import { scaleBand, scaleLinear } from 'd3';
	import chartData from '../data/data.csv';

	let { scrollyIndex, steps } = $props();

	// Chart dimensions - width is reactive via bind:clientWidth
	let width = $state(300);
	const height = 200;
	const margin = { top: 20, right: 20, bottom: 30, left: 20 };

	let innerWidth = $derived(width - margin.left - margin.right);
	let innerHeight = $derived(height - margin.top - margin.bottom);

	// Fixed yMax for consistent scale
	const yMax = 70;

	// Step config from copy.json steps
	let stepConfig = $derived.by(() => {
		const step = steps[scrollyIndex] ?? {};
		return {
			highlighted: step.highlighted ?? null,
			scale: step.scale ?? {},
			shape: step.shape ?? 'bar',  // 'bar' or 'dot'
			animate: step.animate ?? null  // 'bounce', etc.
		};
	});

	// D3 scales - recompute when dimensions or yMax change
	let xScale = $derived(
		scaleBand()
			.domain(chartData.map(d => d.label))
			.range([0, innerWidth])
			.padding(0.2)
	);

	let yScale = $derived(
		scaleLinear()
			.domain([0, yMax])
			.range([innerHeight, 0])
	);
</script>

<div class="chart-container" bind:clientWidth={width}>
	<svg viewBox={"0 0 {width} {height}"}>
		<g transform={"translate({margin.left},{margin.top})"}>
			{#each chartData as d}
				{@const isHighlighted = stepConfig.highlighted === 'all' || stepConfig.highlighted === d.label}
				{@const scale = stepConfig.scale[d.label] ?? 1}
				{@const baseHeight = innerHeight - yScale(+d.value)}
				{@const barHeight = baseHeight * scale}
				{@const barY = innerHeight - barHeight}
				{@const isDot = stepConfig.shape === 'dot'}
				{@const dotSize = Math.min(xScale.bandwidth(), barHeight)}
				{@const finalWidth = isDot ? dotSize : xScale.bandwidth()}
				{@const finalHeight = isDot ? dotSize : barHeight}
				{@const finalX = xScale(d.label) + (xScale.bandwidth() - finalWidth) / 2}
				{@const finalY = isDot ? innerHeight - dotSize : barY}
				{@const finalRx = isDot ? dotSize / 2 : 4}

				<rect
					class:bounce={stepConfig.animate === 'bounce'}
					x={finalX}
					y={finalY}
					width={finalWidth}
					height={finalHeight}
					fill={isHighlighted ? 'var(--vcsi-color-accent, #154734)' : '#ccc'}
					rx={finalRx}
					style="transition: all 0.4s ease; animation-delay: {0.1 * chartData.indexOf(d)}s;"
				/>

				<text
					x={xScale(d.label) + xScale.bandwidth() / 2}
					y={innerHeight + 15}
					text-anchor="middle"
					font-size="12"
				>
					{d.label}
				</text>
			{/each}
		</g>
	</svg>

	<p class="caption">Step: {scrollyIndex}</p>
</div>

<style>
	.chart-container {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	svg {
		width: 100%;
		height: auto;
	}

	text {
		fill: var(--vcsi-color-text, #333);
	}

	.caption {
		margin-top: 1rem;
		font-size: 0.875rem;
		color: var(--vcsi-color-text-muted, #666);
	}

	@keyframes bounce {
		0%, 100% { transform: translateY(0); }
		30% { transform: translateY(-50px); }
		50% { transform: translateY(0); }
		70% { transform: translateY(-10px); }
	}

	.bounce {
		animation: bounce 0.6s ease infinite;
	}
</style>
`;

// =============================================================================
// WRITE FILES
// =============================================================================

// Write Index.svelte
fs.writeFileSync(
	path.join(storyDir, 'components/Index.svelte'),
	detailed ? indexSvelteDetailed : indexSvelteMinimal
);

// Write ScrollyPlot.svelte
fs.writeFileSync(
	path.join(storyDir, 'components/ScrollyPlot.svelte'),
	detailed ? scrollyPlotDetailed : scrollyPlotMinimal
);

// Create copy.json with example steps
const copyJson = {
	title,
	subtitle: 'Story subtitle',
	authors: [{ name: 'Author Name', url: '' }],
	date: new Date().toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	}),
	steps: [
		{ type: 'markdown', value: 'This is the **first step**. All bars start neutral.' },
		{ type: 'markdown', value: 'Now we highlight **bar B** — the highest value.' },
		{ type: 'markdown', value: "Let's look at **bar A** instead." },
		{ type: 'markdown', value: 'Finally, the Y-axis **zooms in** using Tween — bars grow as maxValue shrinks.' }
	]
};

const copyJsonDetailed = {
	"title": "Example Story 1",
	"subtitle": "Story subtitle",
	"authors": [
		{
			"name": "Author Name",
			"url": ""
		}
	],
	"date": "Feb 18, 2026",
	"steps": [
		{
			"type": "markdown",
			"value": "This is the **first step**. All bars start neutral.",
			"highlighted": null,
			"scale": {}
		},
		{
			"type": "markdown",
			"value": "Now we highlight **bar B** — the highest value.",
			"highlighted": "B",
			"scale": { "B": 1.4 }
		},
		{
			"type": "markdown",
			"value": "Let's look at **bar A** instead.",
			"highlighted": "A",
			"scale": { "A": 1.5 }
		},
		{
			"type": "markdown",
			"value": "Finally, all bars grow together.",
			"highlighted": "all",
			"scale": { "A": 1.5, "B": 1.4, "C": 1.3 }
		},
		{
			"type": "markdown",
			"value": "Now let's transform to **dots**.",
			"highlighted": "all",
			"scale": {},
			"shape": "dot"
		},
		{
			"type": "markdown",
			"value": "And now they **bounce**!",
			"highlighted": "all",
			"scale": {},
			"shape": "dot",
			"animate": "bounce"
		},
		{
			"type": "markdown",
			"value": "Lets stop now, Good bye!",
			"highlighted": "all",
			"scale": {},
			"shape": "dot"
		}
	],
	"conclusion": "That's all folks, have fun."
};

fs.writeFileSync(
	path.join(storyDir, 'data/copy.json'), 
	JSON.stringify(detailed ? copyJsonDetailed : copyJson, null, '\t'));

// Create data.csv for the example visualization
const dataCsv = `label,value
A,30
B,50
C,20
D,40`;

fs.writeFileSync(path.join(storyDir, 'data/data.csv'), dataCsv);

// Append to stories.csv
const csvPath = 'src/lib/data/stories.csv';
const today = new Date().toISOString().split('T')[0];
const csvRow = `\n${slug},${title},Description,Author Name,${today},,Tags`;

fs.appendFileSync(csvPath, csvRow);

console.log(`✓ Created story: ${slug}${detailed ? ' (with documentation)' : ''}`);
console.log(`  → ${storyDir}/components/Index.svelte`);
console.log(`  → ${storyDir}/components/ScrollyPlot.svelte`);
console.log(`  → ${storyDir}/data/copy.json`);
console.log(`  → ${storyDir}/data/data.csv`);
console.log(`  → Added entry to ${csvPath}`);
