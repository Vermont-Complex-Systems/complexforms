# Layout System Reference

Layouts are CSS classes from `@the-vcsi/scrolly-kit/styles/all.css`. Import once in your app:

```css
@import '@the-vcsi/scrolly-kit/styles/all.css';
```

Override any `--vcsi-*` variable on a parent element to customize.

## Story Root (`.story`)

Full-width container for scrollytelling. Isolated from global dark mode by default (light theme).

```html
<article class="story">
  <!-- Direct children get prose styling: centered, max-width 600px -->
  <h2>Section Title</h2>
  <p>Paragraph text...</p>

  <!-- Layout classes break out to full width -->
  <section class="split-layout">...</section>
</article>
```

| Variable | Default | Description |
|----------|---------|-------------|
| `--vcsi-story-bg` | `#f4efea` (beige) | Story background color |
| `--vcsi-story-fg` | `rgb(55, 55, 55)` | Story text color |
| `--vcsi-story-max-width` | `600px` | Max width of prose content |

**Dark theme:** Add `data-theme="dark"` to the story root:

```html
<article class="story" data-theme="dark">...</article>
```

This sets `--vcsi-story-bg: #353839`, `--vcsi-story-fg: white`, and switches all semantic tokens to dark variants. It does NOT depend on the global dark mode toggle — stories control their own theme.

**Custom theme:**

```html
<article class="story" style="--vcsi-story-bg: navy; --vcsi-story-fg: white;">...</article>
```

## Split Layout (`.split-layout`)

Two-column: scrolling text + sticky visualization panel. Default: text left, chart right.

```html
<section class="split-layout">
  <div class="sticky-panel"><!-- visualization --></div>
  <div class="scrolly-content">
    <ScrollyContent steps={data.steps} bind:value={index} />
  </div>
</section>

<!-- Reversed: chart left, text right -->
<section class="split-layout reversed">...</section>
```

| Variable | Default | Description |
|----------|---------|-------------|
| `--vcsi-panel-min-width` | `450px` | Minimum panel width |
| `--vcsi-panel-width` | `45%` | Panel width as percentage |
| `--vcsi-panel-height` | `min(80vh, 600px)` | Panel height (capped) |
| `--vcsi-panel-top-offset` | auto-centered | Vertical position of sticky panel |
| `--vcsi-layout-gap` | `2rem` | Gap between columns |
| `--vcsi-content-padding-inline` | `2rem` | Horizontal padding |

**Mobile (< 768px):** Stacks to single column. Sticky panel becomes full-viewport background, scrolly content overlays on top with `z-index: 1`. `.reversed` has no effect.

**Component CSS inside `.sticky-panel`:**

```css
.chart-container { width: 100%; height: auto; }
svg { width: 100%; height: auto; }
```

The panel has capped height; the component lets the SVG `viewBox` determine its own height.

## Fullscreen Layout (`.fullscreen-layout`)

Full-viewport immersive background with text overlay. For cinematic, full-bleed visualizations.

```html
<section class="fullscreen-layout">
  <div class="sticky-panel"><!-- fills 100vw x 100vh --></div>
  <div class="scrolly-content">
    <ScrollyContent steps={data.steps} bind:value={index} />
  </div>
</section>
```

| Variable | Default | Description |
|----------|---------|-------------|
| `--vcsi-step-max-width` | `500px` | Max width of overlay text boxes |
| `--vcsi-step-padding` | `2rem` | Padding inside step boxes |
| `--vcsi-step-pointer-events` | `none` | Steps pass clicks through to panel |

**Mobile:** Same grid-overlap pattern as split layout.

**Component CSS inside `.sticky-panel`:**

```css
.chart-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
svg { width: 100%; height: 100%; max-height: 100%; }

@media (max-width: 768px) {
  svg { width: 100%; height: auto; aspect-ratio: 1; }
}
```

The panel fills the viewport; the component must fill it with `100%` and use flex centering. On mobile, constrain SVG to a square aspect ratio.

## Triple Layout (`.triple-layout`)

Three columns: scrolling steps + sticky code panel + sticky chart panel. For code-walkthrough stories.

```html
<section class="triple-layout">
  <div class="scrolly-content">
    <ScrollyContent steps={data.steps} bind:value={index} />
  </div>
  <div class="code-panel"><!-- sticky code, e.g. CodeExplainer --></div>
  <div class="chart-panel"><!-- sticky visualization --></div>
</section>
```

| Variable | Default | Description |
|----------|---------|-------------|
| `--vcsi-layout-gap` | `1.5rem` | Gap between columns |
| `--vcsi-panel-height` | `min(95vh, 900px)` | Height of sticky panels |
| `--vcsi-panel-top-offset` | auto-centered | Vertical position of sticky panels |
| `--vcsi-content-padding-inline` | `2rem` | Horizontal padding |

**Tablet (< 1024px):** Two columns — code panel is hidden, steps + chart remain.
**Mobile (< 768px):** Single column — chart becomes full-viewport sticky background, steps overlay on top (same pattern as split layout).

## Full Bleed (`.full-bleed`)

Escape the prose column to full viewport width. For standalone charts, images, or maps that are NOT scrolly sections:

```html
<article class="story">
  <p>Prose stays centered...</p>
  <div class="full-bleed"><MyWideChart /></div>
</article>
```

Padding via `--vcsi-bleed-padding-inline` (default `2rem`).

## Dashboard Layout (`.dashboard-layout`)

Sidebar + main content area. No scrolly mechanics. For interactive data explorers.

```html
<article class="dashboard-layout">
  <aside class="dashboard-sidebar">
    <button class="sidebar-toggle">Toggle</button>
    <div class="sidebar-content"><!-- filters, controls --></div>
  </aside>
  <main class="dashboard-main"><!-- charts, content --></main>
</article>
```

| Variable | Default | Description |
|----------|---------|-------------|
| `--vcsi-sidebar-width` | `280px` | Sidebar width |
| `--vcsi-sidebar-collapsed-width` | `48px` | Width when collapsed |
| `--vcsi-sidebar-bg` | `#ebe6e1` | Sidebar background |

Add `.sidebar-collapsed` class to collapse. **Mobile:** Sidebar becomes slide-down drawer from top. Toggle with `.sidebar-open` class.

## Global Step Tokens

These control ScrollyContent step appearance across all layouts:

| Variable | Default | Description |
|----------|---------|-------------|
| `--vcsi-spacer-height` | `65vh` | Height of top/bottom spacers |
| `--vcsi-step-height` | `90vh` | Vertical space per step |
| `--vcsi-step-max-width` | `600px` | Max width of step box |
| `--vcsi-step-padding` | `1rem` | Step box padding |
| `--vcsi-step-border-radius` | `5px` | Step box border radius |
| `--vcsi-step-box-shadow` | `1px 1px 10px rgba(0,0,0,0.2)` | Step box shadow |
| `--vcsi-step-text-align` | `center` | Text alignment in steps |
| `--vcsi-story-step-bg` | `#fff` | Step background (light) |
| `--vcsi-story-step-fg` | `#333` | Step text color (light) |
| `--vcsi-story-step-bg-inactive` | `#f5f5f5` | Inactive step background |
| `--vcsi-story-step-fg-inactive` | `#ccc` | Inactive step text color |

Override on any parent to customize a section:

```css
.my-section {
  --vcsi-step-height: 40vh;
  --vcsi-step-max-width: 350px;
  --vcsi-step-text-align: left;
}
```

## Containment Rules

**Layouts define space, content fills it.**

| Layer | Responsibility | Allowed units |
|-------|---------------|---------------|
| Layout (CSS classes) | Defines dimensions | `vh`, `vw`, `%` |
| Component (your `.svelte`) | Fills available space | `100%`, `inherit`, `auto` only |

- Children must NOT use `vh`/`vw` for sizing — use `100%` to respect parent bounds.
- Add `overflow: hidden` on containers to prevent content blowout.
- For `height: 100%` to work, every ancestor needs explicit height.
