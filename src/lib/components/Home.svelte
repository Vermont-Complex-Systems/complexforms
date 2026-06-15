<script>
  import StoryGrid from '$lib/components/StoryGrid.svelte';
  import { getStories } from '$lib/story.remote';
  import { ArrowRight } from '@lucide/svelte';
</script>

<!-- Hero Section -->
<section class="hero page">
  <div class="hero-inner">
    <div class="hero-text">
      <h1>Custom Research Website</h1>
      <p>A maintainable, reusable and extensible website template to tell your stories.</p>
      <span class="github-row">For installation details, features, and more visit <a href="https://github.com/Vermont-Complex-Systems/vcsi-starter/tree/main/templates/fresh" target="_blank" rel="noopener noreferrer" class="github-link">GitHub <ArrowRight size={16} /></a></span>
    </div>
  </div>
</section>

<!-- Stories Section -->
<section class="stories page">
  <h2>Stories</h2>
  {#await getStories()}
    <div class="loading">Loading stories...</div>
  {:then stories}
    <StoryGrid {stories} />
  {/await}
</section>


<style>
/* ---------------- Hero Section ---------------- */

.stories h2 {
  margin-bottom: 2rem;
}

/*
Centering vertically the hero
Fills the full viewport (100dvh)
Uses padding-top: var(--vcsi-nav-height) to create space for the fixed nav
Uses padding-bottom: 0 to make the centering symmetric
*/
.hero {
  display: grid;
  place-items: center;
  min-height: 100dvh;
  box-sizing: border-box;
}

.hero-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: var(--vcsi-page-max-width);
}

.hero-text {
  display: flex;
  flex-direction: column;
  gap: var(--vcsi-space-md);
  max-width: 55%;
}

.hero-text h1 {
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  line-height: 1.3;
  margin: 0;
  font-family: var(--vcsi-font-serif);
}

.hero-text p {
  font-size: clamp(1.2rem, 2.5vw, 1.5rem);
  margin: 0;
  color: var(--vcsi-muted);
}


.github-row {
  display: inline-flex;
  align-items: center;
  font-family: var(--vcsi-font-sans);
  font-size: 0.9rem;
  color: var(--vcsi-muted);
  margin-top: var(--vcsi-space-xs);
}

.github-link {
  display: inline-flex;
  align-items: center;
  gap: var(--vcsi-space-xs);
  font-weight: 500;
  color: var(--vcsi-fg);
  text-decoration: none;
  margin-left: var(--vcsi-space-xs);
  transition: gap var(--vcsi-transition-base);
}

.github-link:hover {
  gap: var(--vcsi-space-sm);
}

/* ---------------- Stories Section ---------------- */

.loading {
  text-align: center;
  padding: var(--vcsi-space-2xl);
  font-size: 1.2rem;
  color: var(--vcsi-fg);
  opacity: 0.7;
}

/* ---------------- Responsive ---------------- */
@media (max-width: 768px) {
  .hero-inner {
    flex-direction: column;
    gap: var(--vcsi-space-xl);
    text-align: center;
  }
  .hero-text {
    max-width: 90%;
  }
  .hero-text h1 {
    font-size: 2.5rem;
  }
  .hero-text p {
    font-size: 1.2rem;
  }
}
</style>
