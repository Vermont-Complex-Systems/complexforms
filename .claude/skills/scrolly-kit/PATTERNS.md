# Story Patterns Reference

## Story File Structure

Each story lives in `src/lib/stories/{slug}/`:

```
src/lib/stories/my-story/
├── components/
│   └── Index.svelte       # Main story component
│   └── ScrollyPlot.svelte # Optional: visualization components
└── data/
    └── copy.json          # Content data
    └── data.csv           # Optional: datasets
```

The route `src/routes/[slug]/+page.svelte` dynamically imports `Index.svelte` and passes `story` metadata + `data` (copy.json contents) as props.

## copy.json Schema

```json
{
  "title": "Story Title",
  "subtitle": "Optional subtitle",
  "authors": [
    { "name": "Author Name", "url": "https://optional-link.com" }
  ],
  "date": "Month Year",

  "introduction": [
    { "type": "markdown", "value": "Markdown text with **bold**, *italic*, $math$" }
  ],

  "steps": [
    { "type": "markdown", "value": "Step content..." },
    { "type": "html", "value": "<strong>Raw HTML</strong>" },
    { "type": "math", "value": "E = mc^2" },
    { "type": "code", "value": "const x = 1;", "language": "javascript" }
  ],

  "conclusion": [
    { "type": "markdown", "value": "Closing text..." }
  ]
}
```

**ContentItem types:**
- `markdown` — Rendered with KaTeX math support (`$inline$`, `$$block$$`)
- `html` — Raw HTML, rendered directly
- `math` — Centered math expression (KaTeX)
- `code` — Syntax-highlighted code block (requires `language` field)

Sections like `introduction`, `steps`, `conclusion` are arrays of ContentItem. You can add custom section names (e.g., `appendix`, `methodology`).

## Multi-Section Stories

Stories can have multiple scrolly sections, each with its own layout:

```svelte
<article class="story">
  <StoryHeader ... />

  <section id="intro">
    <RenderContent items={data.introduction} />
  </section>

  <!-- First scrolly: split layout -->
  <section class="split-layout">
    <div class="sticky-panel"><ChartA {scrollyIndex1} /></div>
    <div class="scrolly-content">
      <ScrollyContent steps={data.part1Steps} bind:value={scrollyIndex1} />
    </div>
  </section>

  <h2>Part Two</h2>
  <p>Transition text between sections...</p>

  <!-- Second scrolly: fullscreen layout -->
  <section class="fullscreen-layout">
    <div class="sticky-panel"><ChartB {scrollyIndex2} /></div>
    <div class="scrolly-content">
      <ScrollyContent steps={data.part2Steps} bind:value={scrollyIndex2} />
    </div>
  </section>

  <section id="conclusion">
    <RenderContent items={data.conclusion} />
  </section>
</article>
```

Each section gets its own `$state()` variable for scroll tracking.

## Story Theming

Stories are isolated from global dark mode by default (light theme with beige background).

```svelte
<!-- Light story (default) -->
<article class="story">...</article>
<Footer theme="light" />

<!-- Dark story -->
<article class="story" data-theme="dark">...</article>
<Footer theme="dark" />

<!-- Custom colors -->
<article class="story" style="--vcsi-story-bg: navy; --vcsi-story-fg: white;">
  ...
</article>
<Footer style="--footer-bg: navy;" />
```

**Footer theming must match the story:**
- `theme="light"` → UVM green background
- `theme="dark"` → Dark grey background
- No `theme` prop → Respects global dark mode (for app pages, not stories)

## SSR / Build Gotchas

The `baked` template uses `adapter-static` — every page is prerendered at build time. Modules that access `window`, `document`, or WebGL at import time will crash the build.

**Fix: Guard browser-only components:**

```svelte
<script>
  import { browser } from '$app/environment';
</script>

{#if browser}
  <MyWebGLChart {data} />
{/if}
```

For code (not components) that must only run in the browser, use `$effect` or dynamic `import()` inside `onMount`.

**Do NOT set `export const ssr = false`** in `[slug]/+page.ts`. In `adapter-static`, this prevents remote functions like `getStory()` from being crawled, producing 404s at runtime.

## Dashboard Pattern

Dashboards use a different layout — no scrolly mechanics:

```svelte
<script>
  import { DashboardShell } from '@the-vcsi/scrolly-kit';
  // OR use raw CSS classes:
</script>

<article class="dashboard-layout">
  <aside class="dashboard-sidebar">
    <button class="sidebar-toggle" onclick={() => collapsed = !collapsed}>
      Toggle
    </button>
    <div class="sidebar-content">
      <!-- Filters, controls, form elements -->
    </div>
  </aside>
  <main class="dashboard-main">
    <!-- Charts, tables, content -->
  </main>
</article>
```

Add `.sidebar-collapsed` to the root element to collapse the sidebar.

## Visualization Component Patterns

For general Svelte 5 + D3 charting patterns (reactive scales with `$derived`, responsive sizing with `bind:clientWidth`), use the Svelte MCP server documentation. This section covers only the scrolly-kit-specific sizing rules.

### Layout-Specific Sizing Rules

| Layout | Bind | Height | Why |
|--------|------|--------|-----|
| `.split-layout` | `bind:clientWidth` only | Fixed constant | Panel has capped height; viewBox scales proportionally |
| `.fullscreen-layout` | `bind:clientWidth` AND `bind:clientHeight` | Derived from bounds | Panel fills viewport; derive `chartHeight` (square on mobile via `width`) |
| `.dashboard-layout` | `bind:clientWidth` only | Fixed or `auto` | Main area is scrollable; no viewport filling |

**Key rule:** Never use `vh`/`vw` in chart components -- the layout already provides those. Use `100%`, `inherit`, or `bind:clientWidth/Height`.

## Scrolly Index Reactivity

The scroll position drives visualization state. Each scrolly section needs its own `$state()` variable that flows through a simple reactive chain:

```
$state (Index.svelte) → bind:value (ScrollyContent) → prop (VizComponent) → $derived (visual changes)
```

### 1. Declare index state in the story's Index.svelte

```svelte
<script lang="ts">
  let barIndex = $state(undefined);  // nothing highlighted until user scrolls in
  let rankIndex = $state(0);         // first step active immediately
</script>
```

- Use `undefined` when the visualization should show a neutral/default state before the user reaches that section.
- Use `0` when the first step should be active as soon as the section is visible.

### 2. Wire up the layout

```svelte
<section class="split-layout">
  <div class="sticky-panel">
    <ScrollyPlot scrollyIndex={barIndex} />
  </div>
  <div class="scrolly-content">
    <ScrollyContent steps={data.steps} bind:value={barIndex} />
  </div>
</section>
```

`ScrollyContent` updates the bound value as the user scrolls through steps. The visualization receives it as a read-only prop.

### 3. React to index changes in the visualization

Use `$derived` to map the index to visual states:

```svelte
<script>
  let { scrollyIndex } = $props();

  // Data transforms driven by scroll position
  let currentData = $derived.by(() => {
    if (scrollyIndex !== undefined && scrollyIndex >= 1) {
      return sortedData;
    }
    return shuffledData;
  });

  // Simple boolean flags for conditional rendering
  let showLabels = $derived(scrollyIndex >= 1);
  let showTail = $derived(scrollyIndex >= 2);

  // Chart type switching
  let chartType = $derived(scrollyIndex >= 2 ? 'lollipop' : 'bar');
</script>
```

**Key patterns in visualization components:**

- **Progressive reveal** — use `$derived` booleans to conditionally show elements (`{#if showLabels}`)
- **Data filtering/sorting** — use `$derived.by()` to compute new datasets based on the index
- **Style switching** — derive opacity, fill, or class names from the index
- **CSS transitions** — add `style="transition: ..."` on SVG elements for smooth animated changes between steps

### 4. Handling `undefined` vs numeric index

When initialized to `undefined`, guard against it in derived values:

```svelte
// Safe: treats undefined as "before step 0"
let currentData = $derived.by(() => {
  if (scrollyIndex !== undefined && scrollyIndex >= 1) {
    return transformedData;
  }
  return defaultData;
});
```

This lets the visualization show a meaningful default before the user scrolls into the section.

### 5. Index as array lookup (time-series / stepper pattern)

Instead of using the index for boolean flags, map it to a value from a predefined array:

```svelte
<script>
  let { scrollyIndex } = $props();

  const years = [2001, 2007, 2013, 2020, 2022];

  // Nullish coalescing handles undefined gracefully
  let currentYear = $derived(years[scrollyIndex ?? 0]);

  // Data pipeline: index → year → filtered dataset → scales → rendering
  let currentData = $derived(
    allData.filter(d => d.year === currentYear && d.x_variable === selectedXVar)
  );
</script>
```

This pattern is ideal for:
- **Time-stepping** through years/dates
- **Category cycling** through discrete states
- Any case where each step represents a named value rather than a threshold

### 6. Combining scroll state with user-controlled state

For rich interactive visualizations, scroll index coexists with UI-driven state:

```svelte
<script>
  let { scrollyIndex } = $props();

  // Scroll-driven (read-only from this component's perspective)
  let currentYear = $derived(years[scrollyIndex ?? 0]);

  // User-controlled (interactive UI elements)
  let selectedXVar = $state('democracy');
  let selectedRegions = $state(new Set());
  let usePopulationSize = $state(true);

  // Data pipeline combines both sources
  let currentData = $derived(
    allData.filter(d =>
      d.year === currentYear &&
      d.x_variable === selectedXVar
    )
  );

  let filteredData = $derived(
    selectedRegions.size === 0
      ? currentData
      : currentData.filter(d => selectedRegions.has(d.owid_region))
  );
</script>
```

The reactive chain flows: `scrollyIndex` + UI state → derived data → derived scales → rendering. Each layer only recomputes when its inputs change.

### 7. Smooth transitions with `Tween.of()`

When the index drives scale changes (e.g., axis domain shifts as data filters), use `Tween.of()` from `svelte/motion` for animated transitions:

```svelte
<script>
  import { Tween } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';

  let lifeExpExtent = $derived.by(() => {
    const data = filteredData.length > 0 ? filteredData : currentData;
    if (data.length === 0) return [40, 90];
    return [
      Math.floor(Math.min(...data.map(d => d.life_expectancy))) - 5,
      Math.ceil(Math.max(...data.map(d => d.life_expectancy))) + 5
    ];
  });

  const yMin = Tween.of(() => lifeExpExtent[0], { duration: 800, easing: cubicOut });
  const yMax = Tween.of(() => lifeExpExtent[1], { duration: 800, easing: cubicOut });

  let yScale = $derived(
    scaleLinear().domain([yMin.current, yMax.current]).range([innerHeight, 0])
  );
</script>
```

Use this when axis domains change between steps — it prevents jarring jumps. Pair with CSS transitions on SVG elements for the data points themselves.

### 8. Config object per step (switch pattern)

When the geometry is static but the visual encoding changes per step, derive a full configuration object using a `switch`:

```svelte
<script>
  let { scrollyIndex } = $props();

  // Normalize index (handle undefined)
  let stepIndex = $derived(scrollyIndex ?? 0);

  // Each step returns a complete rendering config
  let mapConfig = $derived.by(() => {
    switch (stepIndex) {
      case 0:
        return {
          title: 'Montreal',
          colors: null,
          labelsToShow: null,
          legend: null
        };

      case 1: {
        const colorScale = d3.scaleSequential(d3.interpolateSpectral)
          .domain([maxPopulation, 0]);
        const colors = new Map(
          [...pop2011.entries()].map(([arr, pop]) => [arr, colorScale(pop)])
        );
        return { title: 'Population 2011', colors, labelsToShow, legend: colorScale };
      }

      case 2: {
        const colorScale = d3.scaleDiverging(d3.interpolateRdBu)
          .domain([-maxChange, 0, maxChange]);
        const colors = new Map(
          [...changeMap.entries()].map(([arr, change]) => [arr, colorScale(change)])
        );
        return { title: 'Change 2011→2016', colors, labelsToShow, legend: colorScale };
      }

      default:
        return { title: null, colors: null, labelsToShow: null, legend: null };
    }
  });
</script>

<!-- Static geometry, dynamic styling from config -->
{#each districts as feature (feature.properties.id)}
  {@const fill = mapConfig.colors?.get(feature.properties.id) ?? '#e0e0e0'}
  <path d={pathGenerator(feature)} {fill} style="transition: fill 0.5s ease;" />
{/each}

<Legend scale={mapConfig.legend} />
```

**When to use this pattern:**
- **Maps** — geometry stays fixed, only choropleth coloring/labels change
- **Diagrams** — structure is constant, annotations or highlights change per step
- **Any visualization where the layout is expensive to recompute** — only swap the visual encoding

**Key principles:**
- Return `null` for unused fields so the template can use optional chaining (`mapConfig.colors?.get(...)`)
- Include a `default` case for overflow (more steps than configs)
- Put expensive computations (scale construction, data lookups) inside the relevant `case` block so they only run for that step
- Use CSS `transition` on the rendered elements for smooth step-to-step changes

## CSS Variable Scoping

Override variables at any level to customize a section:

```svelte
<!-- Override for one section -->
<section class="split-layout" style="--vcsi-panel-width: 60%; --vcsi-step-max-width: 400px;">
  ...
</section>

<!-- Override for the whole story -->
<article class="story" style="--vcsi-story-max-width: 800px;">
  ...
</article>
```

Variables cascade: story root → layout section → individual step. Set them at the narrowest scope needed.
