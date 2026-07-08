# Reactive index techniques

The scroll position gives a visualization one number — the active step. This is the menu of ways to turn that number into visuals, smallest to most general. **Don't reflexively reach for threshold flags** (`step >= 1`); pick the technique that fits how the visual actually changes.

## The chain and the index value

```
$state (Index.svelte) → bind:value (ScrollyContent) → prop → $derived (visual state)
```

One `$state` per scrolly section. Initialize to `undefined` when the visual should sit in a neutral state until the reader arrives, or `0` to start active. Note that the bound value also **reverts to `undefined`** whenever the section scrolls fully out of view, not just before first arrival. The component receives it as a read-only prop and **always guards** the `undefined` case (`step ?? 0`).

**Reference your own DOM with `bind:this`, never `document.querySelector`.** A global selector like `document.querySelector('.chart')` grabs the *first* match on the page — in a multi-section story that is very likely a different section's element. Bind the node you own instead:

```svelte
<script>
  let chartEl = $state();  // always THIS component's node
</script>

<div class="chart" bind:this={chartEl}>…</div>
```

## Which technique?

| The visual changes by… | Use |
|---|---|
| revealing/hiding elements as you pass steps | **Threshold flags** |
| stepping through named values (years, categories) | **Array lookup** |
| swapping the whole encoding on fixed geometry (colors, legend, title) | **Config object per step** ← the general one |
| the reader's controls *and* scroll | **Scroll + UI state** |
| scale domains shifting between steps | **Tween** for smooth motion |

## 1. Threshold flags — simple reveals

```svelte
let { step } = $props();
let showLabels = $derived((step ?? -1) >= 1);
let chartType  = $derived((step ?? 0) >= 2 ? 'lollipop' : 'bar');
```

Good for progressive reveal. If you find yourself writing `>= 3`, `>= 4`, … you've outgrown this — move to a config object.

## 2. Array lookup — time-steppers

Each step maps to a named value; map the index into an array rather than laddering thresholds.

```svelte
const years = [2001, 2007, 2013, 2020, 2022];
let year = $derived(years[step ?? 0]);
let rows = $derived(all.filter(d => d.year === year));
```

Ideal for time-stepping through dates or cycling discrete categories.

## 3. Config object per step — the workhorse

When the geometry is fixed but the encoding changes per step (a choropleth recoloring, a diagram re-annotating), derive a **complete render config** with a `switch` and render from it with optional chaining. This scales: adding a step is adding a `case`, not threading another threshold through the component.

```svelte
let stepIndex = $derived(scrollyIndex ?? 0);

let mapConfig = $derived.by(() => {
  switch (stepIndex) {
    case 0:
      return { title: 'Montreal', colors: null, legend: null };
    case 1: {
      const scale = d3.scaleSequential(d3.interpolateSpectral).domain([maxPop, 0]);
      const colors = new Map([...pop2011].map(([id, p]) => [id, scale(p)]));
      return { title: 'Population 2011', colors, legend: scale };
    }
    default:
      return { title: null, colors: null, legend: null };
  }
});
```

```svelte
{#each districts as f (f.properties.id)}
  {@const fill = mapConfig.colors?.get(f.properties.id) ?? '#e0e0e0'}
  <path d={path(f)} {fill} style="transition: fill 0.5s ease;" />
{/each}
```

Principles: return `null` for unused fields so the template can optional-chain; include a `default` for overflow steps; put expensive work (building scales) **inside** the relevant `case` so it only runs for that step; add a CSS `transition` on the rendered elements for smooth step-to-step changes.

## 4. Scroll + user-controlled state

Scroll index and interactive controls coexist in one derived pipeline — each layer recomputes only when its inputs change.

```svelte
let year = $derived(years[step ?? 0]);        // scroll-driven
let selectedRegions = $state(new Set());      // user-driven
let current = $derived(all.filter(d => d.year === year));
let shown   = $derived(
  selectedRegions.size === 0 ? current : current.filter(d => selectedRegions.has(d.region))
);
```

## 5. Smooth transitions — `Tween.of()`

When a step shifts a scale's domain, tween it so the axis glides instead of jumping. Pair with CSS transitions on the marks themselves.

```svelte
import { Tween } from 'svelte/motion';
import { cubicOut } from 'svelte/easing';

let extent = $derived.by(() => /* compute [min, max] from the step's data */);
const yMin = Tween.of(() => extent[0], { duration: 800, easing: cubicOut });
const yMax = Tween.of(() => extent[1], { duration: 800, easing: cubicOut });
let y = $derived(scaleLinear().domain([yMin.current, yMax.current]).range([h, 0]));
```
