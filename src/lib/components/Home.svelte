<script>
  import StoryGrid from '$lib/components/StoryGrid.svelte';
  import { getStories } from '$lib/story.remote';
</script>

<section class="stories page">
  {#await getStories()}
    <div class="loading">Loading stories...</div>
  {:then stories}
    <StoryGrid {stories} />
  {/await}
</section>

<style>
  .loading {
    text-align: center;
    padding: var(--vcsi-space-2xl);
    font-size: 1.2rem;
    color: var(--vcsi-fg);
    opacity: 0.7;
  }
</style>
