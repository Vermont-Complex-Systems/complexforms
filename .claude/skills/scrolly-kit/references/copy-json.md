# copy.json — the content model

A story's text and structure live in `data/copy.json`, separate from the Svelte. The story's `Index.svelte` receives it as `data`. Keeping content here lets a non-coder edit the story (and lets the SharePoint/OpenAlex add-ons sync it) without touching code.

## Shape

```json
{
  "title": "Story Title",
  "subtitle": "Optional subtitle",
  "authors": [{ "name": "Author Name", "url": "https://optional-link" }],
  "date": "Month Year",

  "introduction": [{ "type": "markdown", "value": "Opening prose…" }],
  "steps":        [{ "type": "markdown", "value": "Step one…" }],
  "conclusion":   [{ "type": "markdown", "value": "Closing…" }]
}
```

Top-level metadata (`title`, `subtitle`, `authors`, `date`) feeds `StoryHeader`. Everything else is a **named section** — an array of content items. The section names are yours: `introduction`, `steps`, `conclusion`, `methodology`, `appendix`, whatever the story needs.

## Content item types

Each item is `{ type, value }`:

| type | renders as | extra fields |
|---|---|---|
| `markdown` | Markdown + KaTeX (`$inline$`, `$$block$$`) | — |
| `html` | raw HTML, inserted directly | — |
| `math` | centered KaTeX expression | — |
| `code` | syntax-highlighted block | `language`, `highlightLines` (e.g. `"1-3,5"`) |
| `component` | a Svelte component by name | — (RenderContent only, see below; `ScrollyContent` steps don't render `component` items) |

Render a text section with `RenderContent`, scrolly steps with `ScrollyContent`:

```svelte
<RenderContent items={data.introduction} />
<ScrollyContent steps={data.steps} bind:value={step} />
```

## Embedding a component inline

To drop a chart mid-prose, add a `component` item naming it, then pass a `components` map. The `value` must match a map key exactly; inline components render with **no props**, so make them self-contained.

```json
"interlude": [
  { "type": "markdown", "value": "Before the chart." },
  { "type": "component", "value": "SlopeChart" },
  { "type": "markdown", "value": "After the chart." }
]
```

```svelte
import { RenderContent } from '@the-vcsi/scrolly-kit';
import SlopeChart from './SlopeChart.svelte';
const components = { SlopeChart };

<RenderContent items={data.interlude} {components} />
```

## Multi-section stories

A story can have several scrolly sections, each with its own layout and its own scroll index — plain prose sits between them.

```svelte
<article class="story">
  <StoryHeader title={data.title} subtitle={data.subtitle} authors={data.authors} date={data.date} />
  <section id="intro"><RenderContent items={data.introduction} /></section>

  <section class="split-layout">
    <div class="sticky-panel"><ChartA step={stepA} /></div>
    <div class="scrolly-content"><ScrollyContent steps={data.partA} bind:value={stepA} /></div>
  </section>

  <section class="fullscreen-layout">
    <div class="sticky-panel"><ChartB step={stepB} /></div>
    <div class="scrolly-content"><ScrollyContent steps={data.partB} bind:value={stepB} /></div>
  </section>

  <section id="conclusion"><RenderContent items={data.conclusion} /></section>
</article>
```

**One `$state` per scrolly section** (`stepA`, `stepB`) — never share a single index across sections, or they'll fight over the bound value. See [reactive-index.md](reactive-index.md) for what to do with each index.
