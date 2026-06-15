<script>
	import { Footer } from '@the-vcsi/scrolly-kit';
	import Header from '$lib/components/Header.svelte';

	let { children } = $props();
</script>

<Header />

<main id="content">
	{@render children?.()}
</main>

<Footer />