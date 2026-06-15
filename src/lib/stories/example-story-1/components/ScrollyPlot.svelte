<!--
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

	rect {
		transform: translateY(0);
		transition: all 0.4s ease;
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
