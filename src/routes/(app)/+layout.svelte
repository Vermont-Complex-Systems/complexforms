<script>
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';

	let { children, data } = $props();
</script>

<Header user={data.user} />

<main id="content">
	{@render children?.()}
</main>

<Footer />