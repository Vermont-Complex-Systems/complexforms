# Layouts

Layouts are CSS classes from `@the-vcsi/scrolly-kit`. **They own the dimensions; your components fill them.** Tune a layout by overriding its `--vcsi-*` tokens — the full variable list and defaults are in the MCP's `reference` section (the global design tokens are in `tokens`).

## The story container (`.story`)

Wrap a story in `<article class="story">`. Direct children get prose styling (centered, ~600px); layout sections break out to full width.

```html
<article class="story">
  <h2>Section</h2>
  <p>Centered prose…</p>
  <section class="split-layout">…</section>  <!-- breaks out full width -->
</article>
```

## Picking a layout

| Layout | Use when | Structure |
|---|---|---|
| `.split-layout` | guided narrative, visual beside the text | `.sticky-panel` + `.scrolly-content`; add `.reversed` to flip sides |
| `.fullscreen-layout` | immersive, full-viewport visual | `.sticky-panel` (fills viewport) + `.scrolly-content` overlay |
| `.triple-layout` | code walkthrough | `.scrolly-content` + `.code-panel` + `.chart-panel` |
| `.dashboard-layout` | explorable filters, no scroll | `.dashboard-sidebar` + `.dashboard-main` |
| `.full-bleed` | a standalone wide chart/image (not scrolly) | escapes the prose column to full width |

## Split layout

```html
<section class="split-layout">              <!-- add `reversed` for chart-left -->
  <div class="sticky-panel"><MyChart {step} /></div>
  <div class="scrolly-content">
    <ScrollyContent steps={data.steps} bind:value={step} />
  </div>
</section>
```

The panel height is capped, so the chart binds `clientWidth` only and lets its SVG `viewBox` scale:

```css
.chart-container { width: 100%; height: auto; }
svg { width: 100%; height: auto; }
```

## Fullscreen layout

```html
<section class="fullscreen-layout">
  <div class="sticky-panel"><MyMap {step} /></div>
  <div class="scrolly-content">
    <ScrollyContent steps={data.steps} bind:value={step} />
  </div>
</section>
```

The panel fills the viewport, so the chart binds `clientWidth` **and** `clientHeight` and fills with flex centering:

```css
.chart-container { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
svg { width: 100%; height: 100%; }
@media (max-width: 768px) { svg { width: 100%; height: auto; aspect-ratio: 1; } }  /* square on mobile */
```

## Triple layout

Three columns — steps + sticky code + sticky chart — for code walkthroughs. **Tablet (<1024px):** the code panel hides; steps + chart remain. **Mobile (<768px):** single column; the chart becomes the sticky background.

```html
<section class="triple-layout">
  <div class="scrolly-content"><ScrollyContent steps={data.steps} bind:value={step} /></div>
  <div class="code-panel"><!-- CodeExplainer, etc. --></div>
  <div class="chart-panel"><MyChart {step} /></div>
</section>
```

## Dashboard layout

Sidebar + main, no scrolly mechanics — for interactive explorers. Add `.sidebar-collapsed` to collapse; on mobile the sidebar becomes a slide-down drawer. (Or use the `DashboardShell` component for a snippet-based API.)

```html
<article class="dashboard-layout">
  <aside class="dashboard-sidebar"><!-- filters --></aside>
  <main class="dashboard-main"><!-- charts --></main>
</article>
```

## Containment & sizing — the #1 bug

**Layouts define space, content fills it.** The most common mistake is a chart using `vh`/`vw` and fighting its container.

| Layer | Allowed units |
|---|---|
| Layout (the CSS classes) | `vh`, `vw`, `%` |
| Your component | `100%`, `inherit`, `auto`, `bind:clientWidth/Height` |

| Layout | Bind | Height |
|---|---|---|
| `.split-layout` | `clientWidth` only | fixed; `viewBox` scales |
| `.fullscreen-layout` | `clientWidth` + `clientHeight` | derived from bounds (square on mobile) |
| `.dashboard-layout` | `clientWidth` only | fixed or `auto` |

- Never use `vh`/`vw` inside a chart component.
- Pacing: `--vcsi-step-height` (default 90vh, one step per screen) sets reading rhythm — comfortable for 3-6 substantial steps; drop toward 40-60vh for many short steps so the story does not drag.
- Add `overflow: hidden` on containers to prevent blowout.
- For `height: 100%` to work, every ancestor needs an explicit height.

## Mobile

Below 768px, split and fullscreen collapse to one column: the sticky panel becomes a full-viewport background and the steps overlay on top. Design for that first.
