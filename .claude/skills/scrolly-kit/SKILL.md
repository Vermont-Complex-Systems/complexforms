---
name: scrolly-kit
description: Core craft for building good scrollytelling stories and site pages with @the-vcsi/scrolly-kit — the token system, scroll-index reactivity, mobile-first sizing, story theming, SSR safety, and the CSV-registry page pattern. Load this whenever writing or editing a story, a step visualization, copy.json, or non-story pages (home, about, member/publication listings) in a scrolly-kit project, even if the user doesn't name scrolly-kit. (Scaffolding/workflow lives in AGENTS.md; exact props and full CSS-variable lists live in the scrolly-kit MCP.)
---

## Start with a conversation

A story belongs to its author, not to you. Your job is to figure out where the author is in the process and meet them there: they may arrive with data and prose ready, or with nothing but a topic. Either way, the workflow is **propose, confirm, then build** — the author steers at each checkpoint, because only they know what the story is really about.

Before building anything beyond the scaffold, establish:

1. **Data** — do they already have it, or should it be fetched, and from where exactly? Be careful: **a topic is not a data source**. "A story on NSF awards" names a subject; it does not tell you whether an awards file exists on disk, which API to query, or which slice of it matters. When fetching is the answer, make it auditable (MCP section `getting-data`): a small loader script named after its output, or a provenance note when scripting is not possible.
2. **Scope** — how many sections, roughly how many steps? Default small: one scrolly section is a complete first deliverable.
3. **Direction** — what claim or arc does the author want? Stick to their numbers and their framing; don't embellish with facts they didn't provide.

Then **present the plan in a few lines** (data source, layout, sections, arc) **and get a yes before fetching any data or writing any loader**. This gate is unconditional: even a brief that seems clear leaves these open, and a wrong guess here costs the author more to unwind than the question would have cost. After the yes, build the smallest reviewable slice, show it, and check in before expanding. A beautiful six-section story nobody asked for is worse than one good section the author steered.

### Elicit, don't fill in

The questions above are not a toll booth you pass once before working alone. The whole engagement is the conversation — scrolly-kit is not meant to run in auto-mode (unless the user explicitly asks for that, e.g. "just make it nice, don't ask me"; then respect it). The vaguer the brief, the more the job becomes drawing the answer out of the user, in the spirit of Polya's *How to Solve It*: guide by questions, never solve past the user's own understanding. The tell is a brief that names a **quality** instead of a change — "nicer", "cleaner", "more professional", "more like us". The user has a picture they haven't put into words, and putting it into words **is** the task. The moves that work:

- **Inventory before asking.** Name what exists — the sections of the page, the steps of the story — so the user has concrete handles to react to, instead of a blank canvas.
- **Offer contrasts, not open questions.** Nobody can answer "what's your taste?"; anyone can pick between "warm and editorial, like a magazine" and "minimal and stark, mostly whitespace". Two or three opposed, concrete directions beat any questionnaire. A reference point helps too: "is there a site whose feel you like?"
- **Work in rounds.** One visible change, shown, then their reaction — a user reacting to something real articulates more in one sentence than in any amount of up-front questioning. The two ways to fail a quality-brief: a single token change presented as done, and a wholesale redesign in your own taste.

One more thing: the author is likely a scientist, not a web developer. Prefer plain words over web jargon, and briefly define terms like "prerender" or "layout token" when they first come up.

## Content is data, not markup

Story prose lives in `copy.json` as an array of `{ type, value }` items (`type`: `markdown | html | math | code | component`) — not hardcoded in the component. Render plain prose with `RenderContent`:

```svelte
<RenderContent items={data.introduction} />
```

The steps of a scrolly section are content too, rendered by `ScrollyContent` — but it's never standalone. A scrolly section is a **layout** that pairs a sticky visual with the scrolling steps, bound by one index:

```svelte
<section class="split-layout">
  <div class="sticky-panel"><ScrollyPlot {step} /></div>
  <div class="scrolly-content">
    <ScrollyContent steps={data.steps} bind:value={step} />
  </div>
</section>
```

Keeping content in `copy.json` lets a non-coder edit the story without touching Svelte. Full schema, content-item types, inline-component embedding, and multi-section stories: see [copy-json.md](references/copy-json.md).

## Drive visuals from the scroll index — derive, don't react

A scrolly section exposes one number: the active step. Flow it one way and let `$derived` compute the visual state; reach for `$effect` only for genuine external side effects.

```
$state (Index.svelte) → bind:value (ScrollyContent) → prop → $derived (visual state)
```

```svelte
// Index.svelte — one $state per scrolly section
let step = $state(undefined);   // undefined = neutral default until the reader scrolls in; use 0 to start active
```

Initialize to `undefined` for a neutral state before the reader arrives (guard with `step ?? 0`), or `0` to start active.

How you turn the step into visuals depends on the story — **don't reflexively ladder thresholds** (`step >= 1`, `step >= 2`, …); that's only the simplest case. The general workhorse is a **config object per step** (a `switch` returning a full render config on fixed geometry), with array-lookup for time-steppers and threshold flags for simple reveals. Pick what fits — see [reactive-index.md](references/reactive-index.md) for the full menu and when to use each.

## Style through the token system

scrolly-kit ships `--vcsi-*` design tokens for color, font, spacing, radius, and transition. **Any custom UI you build — a home page, a card, a legend, a nav — consumes them; it never hardcodes.** Hardcoded values drift from the brand and silently break dark mode.

```css
/* ❌ hardcoded — drifts from the theme, ignores dark mode */
.card { background: #fff; color: #333; padding: 20px; border-radius: 8px; font-family: system-ui; }

/* ✅ consume the tokens */
.card {
  background: var(--vcsi-bg);
  color: var(--vcsi-fg);
  padding: var(--vcsi-space-lg);
  border: 1px solid var(--vcsi-border);
  border-radius: var(--vcsi-radius-md);
  font-family: var(--vcsi-font-sans);
}
```

To *customize*, **override** a token on a scope rather than writing a competing rule — it cascades (story root → layout section → step) and stays consistent:

```svelte
<article class="story" style="--vcsi-story-max-width: 800px;">
  <section class="split-layout" style="--vcsi-panel-width: 60%;">…</section>
</article>
```

Reach for a token before inventing a value. The full global catalog (`--vcsi-space-*`, `--vcsi-radius-*`, fonts, colors, transitions) is the MCP's `tokens` section (`get-documentation tokens`); layout- and component-specific tokens (`--vcsi-panel-*`, `--vcsi-step-*`, …) live beside their layout in the `reference` section.

Inheritable text properties are set once on `body` and cascade: set `font-size`/`color`/`line-height` on a container and its children follow. Only headings (token-sized), code (`em`-sized), blockquotes (`1.1em`), and tables (`0.875em`) carry their own sizes.

Match where you write a style to how far it reaches: whole-site changes are token overrides in `src/lib/styles/app.css`; one-off styling for a single page or story lives in that component's own `<style>` block (Svelte scopes it), still consuming tokens. Never edit `app.css` or a token default to fix one page — and if you're copying the same local styles into a third place, promote them to a shared component or an `app.css` class instead.

## Layouts own space; components fill it — design mobile-first

The layout classes (`.split-layout`, `.fullscreen-layout`, `.triple-layout`, `.dashboard-layout`) set dimensions with `vh`/`vw`/`%`. Your chart component must **not** — it fills with `100%`, `inherit`, or a bound size. A `vh`/`vw` inside a component fights the layout and breaks containment.

- `.split-layout`: bind `clientWidth` only — the panel height is capped and the SVG `viewBox` scales.
- `.fullscreen-layout`: bind `clientWidth` **and** `clientHeight` — the panel fills the viewport.

Most readers are on a phone, so design for mobile first: below 768px every layout collapses to one column and the sticky panel becomes a full-viewport background with the steps overlaid. Make the SVG square on mobile, keep step boxes legible, and check the small screen before the wide one. Markup for each layout, the component-fill CSS recipes, and the containment rules: see [layouts.md](references/layouts.md).

## A story owns its theme

Stories are isolated from the site's dark-mode toggle by default. Opt into dark **explicitly** on the root and match the footer — don't rely on the global toggle, because a story's look shouldn't flip when the reader toggles the rest of the site.

```svelte
<article class="story" data-theme="dark">…</article>
<Footer theme="dark" />
```

For custom colors, set `--vcsi-story-bg` / `--vcsi-story-fg` rather than restyling.

## Pages are the other half

Home, about, and other Nav-and-Footer pages are ordinary Svelte the user owns, styled with the `.page` container and tokens. For listing pages (members, publications, datasets) the templates model one reusable shape: a CSV registry driving a grid of cards, with optional prerendered detail routes. The pattern, the wiring, and the keep-the-user-in-the-loop rules: see [pages.md](references/pages.md).

## Guard browser-only code on static builds

The `baked`/`simple` templates prerender every page (`adapter-static`). A module that touches `window`/`document`/WebGL at import time (DuckDB-wasm, some d3 measurement code) crashes `npm run build`. Guard the component:

```svelte
<script>import { browser } from '$app/environment';</script>
{#if browser}<MyWebGLChart {data} />{/if}
```

Never reach for `export const ssr = false` globally — in `adapter-static` it stops remote functions from being crawled and 404s at runtime. (The `fresh`/adapter-node template is exempt.)
