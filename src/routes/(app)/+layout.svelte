<script>
	import { Nav, Footer } from '@the-vcsi/scrolly-kit';

	let { children } = $props();
</script>

<Nav />

<main id="content">
	{@render children?.()}
</main>

<Footer />