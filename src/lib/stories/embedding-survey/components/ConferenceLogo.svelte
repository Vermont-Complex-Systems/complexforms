<script lang="ts">
	// Plain Vite asset import: enhanced-img only processes raster formats
	// (avif/gif/jpeg/png/...), and an SVG scales losslessly anyway. The import
	// still yields a hashed, immutably-cacheable URL.
	import logo from '../assets/ic2s2_logo_black.svg';

	let { href = 'https://ic2s2-2026.org/program' }: { href?: string } = $props();
</script>

<header>
	<a {href} class="conference-logo" aria-label="IC2S2 conference website">
		<img src={logo} alt="IC2S2" />
	</a>
</header>

<style>
	/* The SVG embeds a JPEG (no alpha): multiply blends its white box into the
	   light page bg. It must sit HERE, not on the img — position+z-index make
	   this anchor a stacking context (an isolated group), so a blend on the img
	   would only composite against the anchor's transparent backdrop. */
	.conference-logo {
		position: absolute;
		top: 1rem;
		left: 1rem;
		z-index: 100;
		transition: transform 0.2s ease;
		mix-blend-mode: multiply;
	}

	.conference-logo:hover {
		transform: scale(1.05);
	}

	/* Wide horizontal logo (~3.2:1) — keep the height modest. */
	.conference-logo img {
		height: 3rem;
		width: auto;
	}

	@media (max-width: 768px) {
		.conference-logo {
			left: 50%;
			transform: translateX(-50%);
		}

		.conference-logo:hover {
			transform: translateX(-50%) scale(1.05);
		}
	}
</style>
