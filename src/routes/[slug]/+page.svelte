<!--
  Story page — renders any story from $lib/stories/{slug}/.

  This file stays the same across all phases:
    Phase 1 (static):  getStory uses prerender()  → built at compile time
    Phase 2 (dynamic): getStory uses query()      → runs on the server
    Phase 3 (mutations): add form()/command() alongside, this file unchanged

  The load function (+page.ts) provides the component and slug.
  The remote function (story.remote.ts) provides the data.
-->
<script>
  import { page } from '$app/state';
  import { getStory } from '$lib/story.remote.js';

  // Component and slug come from the load function in +page.ts
  let { data } = $props();
  const StoryComponent = $derived(data.component);

  // Data comes from the remote function — the bit that swaps between phases
  const { story, copyData } = await getStory(page.params.slug);
</script>

<StoryComponent {story} data={copyData} />
