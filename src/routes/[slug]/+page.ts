import { error } from '@sveltejs/kit';

// Vite discovers all story entry points at build time.
// Each key is a path like "/src/lib/stories/{slug}/components/Index.svelte".
const storyModules = import.meta.glob('$lib/stories/*/components/Index.svelte');

// The load function only handles the routing concern:
// find the right component for this slug and hand it to the page.
// Data fetching lives in story.remote.ts, not here.
export async function load({ params }) {
	const path = `/src/lib/stories/${params.slug}/components/Index.svelte`;
	const loader = storyModules[path];

	if (!loader) error(404, `Story "${params.slug}" not found`);

	const mod = await loader();
	return { component: (mod as { default: import('svelte').Component }).default, slug: params.slug };
}
