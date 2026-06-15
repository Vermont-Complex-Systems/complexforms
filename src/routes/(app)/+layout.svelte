<script>
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';

	let { children } = $props();
</script>

<Header />

<main id="content">
	{@render children?.()}
</main>

<Footer />