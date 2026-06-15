# Component API Reference

All components are imported from `@the-vcsi/scrolly-kit`.

## Scrolling

### Scrolly

Base scroll detection using IntersectionObserver. Tracks which child element is most in view.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `number` | — | Index of most visible child (bindable) |
| `root` | `Element \| null` | `null` | IntersectionObserver root element |
| `top` | `number` | `0` | Top margin offset in pixels |
| `bottom` | `number` | `0` | Bottom margin offset in pixels |
| `increments` | `number` | `100` | Number of threshold steps |

```svelte
<script>
  import { Scrolly } from '@the-vcsi/scrolly-kit';
  let index = $state(0);
</script>

<Scrolly bind:value={index}>
  <div>Step 1</div>
  <div>Step 2</div>
  <div>Step 3</div>
</Scrolly>

<p>Current step: {index}</p>
```

### ScrollyContent

Scrollytelling content container with styled step boxes. Renders an array of ContentItem steps.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `steps` | `ContentItem[]` | — | Array of content items with type and value |
| `value` | `number` | — | Current step index (bindable) |
| `topSpacer` | `boolean` | `true` | Add spacer before first step |
| `bottomSpacer` | `boolean` | `true` | Add spacer after last step |
| `contentRenderer` | `Snippet` | — | Custom snippet for rendering step content |

**CSS Variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `--spacer-height` | `65vh` | Height of top/bottom spacers |
| `--step-height` | `90vh` | Vertical space per step |
| `--step-max-width` | `600px` | Max width of step box |
| `--step-padding` | `1rem` | Padding inside step box |

```svelte
<script>
  import { ScrollyContent } from '@the-vcsi/scrolly-kit';
  let index = $state(0);
  const steps = [
    { type: 'markdown', value: '## Introduction' },
    { type: 'markdown', value: 'Step **two** with emphasis' },
    { type: 'math', value: '$E = mc^2$' }
  ];
</script>

<section class="split-layout">
  <div class="sticky-panel">
    <MyVisualization {index} />
  </div>
  <ScrollyContent {steps} bind:value={index} />
</section>
```

## Layout

### StoryHeader

Story header with title, subtitle, authors, and date.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | — | Story title (required) |
| `subtitle` | `string` | — | Optional subtitle |
| `authors` | `Author[]` | — | Array of `{ name, url? }` |
| `date` | `string` | — | Publication date string |
| `class` | `string` | `''` | Additional CSS classes |

```svelte
<StoryHeader
  title="Climate Change in Vermont"
  subtitle="A data-driven exploration"
  authors={[{ name: "Alice Smith", url: "https://..." }, { name: "Bob Jones" }]}
  date="February 2025"
/>
```

### Nav

Responsive navigation bar with logo, links, and mobile hamburger menu.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `logoSrc` | `string` | VCSI logo | Logo image source |
| `logoAlt` | `string` | `'VCSI Logo'` | Logo alt text |
| `links` | `NavLink[]` | — | Array of `{ href, label }` |
| `showThemeToggle` | `boolean` | `true` | Show dark mode toggle |

```svelte
<Nav links={[{ href: '/about', label: 'About' }, { href: '/stories', label: 'Stories' }]} />
```

### Footer

Site footer with logo, social links, and copyright. Supports theme forcing for stories.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `theme` | `'light' \| 'dark'` | — | Force light (UVM green) or dark theme |
| `logoSrc` | `string` | UVM logo | Logo image source |
| `socialLinks` | `SocialLink[]` | VCSI socials | Social media links |
| `bottomLinks` | `BottomLink[]` | — | Footer bottom row links |
| `copyright` | `string` | VCSI copyright | Copyright text |

```svelte
<Footer />                <!-- Respects global dark mode (app pages) -->
<Footer theme="light" />  <!-- Forces UVM green (light stories) -->
<Footer theme="dark" />   <!-- Forces dark theme -->
```

## Content

### MarkdownRenderer

Renders markdown with KaTeX math support and syntax highlighting.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `text` | `string` | — | Markdown text to render |

```svelte
<MarkdownRenderer text="The equation $E = mc^2$ shows..." />
```

### RenderContent

Renders ContentItem(s) from a story's copy.json. Accepts a single item or an array.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `ContentItem \| ContentItem[]` | — | One or more content items to render |
| `components` | `Record<string, Component>` | `undefined` | Map of Svelte components for `type: "component"` items |

**Supported types:**

| Type | Description | Extra fields |
|------|-------------|-------------|
| `markdown` | Rendered via MarkdownRenderer (supports KaTeX: `$inline$`, `$$block$$`) | — |
| `html` | Raw HTML, rendered directly | — |
| `math` | Centered math expression (KaTeX) | — |
| `code` | Syntax-highlighted code block | `language`, `highlightLines` (optional) |
| `component` | Renders a Svelte component by name from the `components` map | — |

**Basic usage (text sections):**

```svelte
<RenderContent items={data.introduction} />
<RenderContent items={data.conclusion} />
```

**Embedding Svelte components inline:**

To render a component within a text section, add a `{ "type": "component", "value": "ComponentName" }` entry in copy.json, then pass a components map:

```json
// copy.json
{
  "interlude": [
    { "type": "markdown", "value": "Here is some text before the chart." },
    { "type": "component", "value": "SlopeChart" },
    { "type": "markdown", "value": "And text after the chart." }
  ]
}
```

```svelte
<script>
  import { RenderContent } from '@the-vcsi/scrolly-kit';
  import SlopeChart from './SlopeChart.svelte';

  let { data } = $props();
  const components = { SlopeChart };
</script>

<section id="interlude">
  <RenderContent items={data.interlude} {components} />
</section>
```

The `value` in copy.json must match a key in the `components` map exactly. Components are rendered with no props — they should be self-contained.

### CodeBlock

Syntax-highlighted code display.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `code` | `string` | — | Code content to display |
| `language` | `string` | — | Language for syntax highlighting |
| `showLineNumbers` | `boolean` | `false` | Show line numbers |

### CopyCodeBlock

Copyable code block with one-click clipboard support.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `command` | `string` | — | Text to display and copy (required) |
| `label` | `string` | `''` | Optional label above code block |

### CodeExplainer

Code with step-by-step explanations. Each step highlights specific lines.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `CodeExplainerData` | — | `{ code, language, steps: CodeStep[] }` |

`CodeStep`: `{ lines: number[], text: string }`

### DashboardShell

Dashboard wrapper with collapsible sidebar (snippet-based API). Alternative to the raw `.dashboard-layout` CSS classes. For finer control, use the `Sidebar.*` compound components (`import { Sidebar } from '@the-vcsi/scrolly-kit'`).

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `collapsed` | `boolean` | `false` | Sidebar collapsed state (bindable) |
| `sidebarWidth` | `string` | `'280px'` | Width when expanded |
| `collapsedWidth` | `string` | `'48px'` | Width when collapsed |
| `sidebar` | `Snippet` | — | Sidebar content (required) |
| `children` | `Snippet` | — | Main content (required) |

```svelte
<DashboardShell>
  {#snippet sidebar()}
    <h2>Filters</h2>
  {/snippet}
  <div class="chart">...</div>
</DashboardShell>
```

## UI Controls

### ThemeToggle

Dark/light mode toggle button. Works with mode-watcher.

No props.

### SimpleSelect

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `options` | `string[]` | — | Array of option values |
| `value` | `string` | — | Selected value (bindable) |
| `label` | `string` | — | Optional label |

### SimpleToggle

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `checked` | `boolean` | `false` | Toggle state (bindable) |
| `label` | `string` | — | Optional label |

### RangeSlider

Dual-thumb range slider (bits-ui based). Supports single-value mode when both thumbs coincide.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `min` | `number` | `1880` | Minimum value |
| `max` | `number` | `2020` | Maximum value |
| `value` | `[number, number]` | `[1950, 1959]` | Selected range (bindable) |
| `step` | `number` | `1` | Step increment |

### ChartTooltip

Popover-style tooltip anchored to a chart element (renders as a bottom sheet on mobile).

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | `false` | Whether tooltip is shown (bindable) |
| `anchor` | `Element \| { x, y, width?, height? } \| null` | `null` | Element or virtual point to anchor to |
| `side` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` | Preferred side |
| `sideOffset` | `number` | `10` | Distance from anchor in pixels |
| `onClose` | `() => void` | — | Called when the tooltip is dismissed |
| `children` | `Snippet` | — | Tooltip content (required) |

### Tooltip

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `text` | `string` | — | Tooltip text content |
| `position` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` | Tooltip position |

```svelte
<Tooltip text="More information here">
  <button>Hover me</button>
</Tooltip>
```

## Utilities

### Meta

SEO meta tags for social sharing (Open Graph, Twitter cards).

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | — | Page title |
| `description` | `string` | — | Page description |
| `image` | `string` | — | Social sharing image URL |
| `url` | `string` | — | Canonical URL |

### Spinner

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `number` | `24` | Spinner size in pixels |
| `color` | `string` | `'currentColor'` | Spinner color |

### ScrollIndicator

Animated scroll-down indicator arrow. No props.

### Actions & helpers

- `scrollReveal` — Svelte action; sets `data-revealed="true"` when the element enters the viewport (style the transition in your own CSS): `<section use:scrollReveal>`
- `useIsMobile()` / `useMediaQuery(query)` — reactive media-query helpers (from `utils/media.svelte`)
- `renderCodeHtml(code, language?, highlightLines?)` — builds highlighted code HTML for MarkdownRenderer

## Types

```typescript
type ContentItem = {
  type: 'html' | 'markdown' | 'math' | 'code' | 'component';
  value: string;
  language?: string;       // code blocks only
  highlightLines?: string; // code blocks only, e.g. "1-3,5"
};
type Author = { name: string; url?: string };
type CodeStep = { lines: number[]; text: string };
type CodeExplainerData = { code: string; language: string; steps: CodeStep[] };
```
