<script lang="ts">
	import { base } from '$app/paths';
	import { afterNavigate } from '$app/navigation';
	import { X, Youtube, Github, MessageCircle, Linkedin } from '@lucide/svelte';

	let { visible, close }: { visible: boolean; close: (skipFocus?: boolean) => void } = $props();

	function handleKeyup(e: KeyboardEvent) {
		if (e.key === 'Escape') close();
	}

	afterNavigate(() => {
		close(true);
	});
</script>

<svelte:window onkeyup={handleKeyup} />

<nav id="nav-menu" class:visible aria-hidden={!visible}>
	<div class="nav-content">
		<button
			class="btn-close"
			aria-label="close menu"
			onclick={() => close()}
		>
			<X size={20} />
		</button>

		<div class="nav-links">
			<h4>Navigate</h4>
			<ul>
				<li><a href="{base}/">Home</a></li>
			</ul>
		</div>

		<div class="social-links">
			<h4>Connect</h4>
			<ul>
				<li>
					<a href="https://www.youtube.com/@UVMcomplexity" target="_blank" rel="noreferrer">
						<Youtube size={18} />
						<span>YouTube</span>
					</a>
				</li>
				<li>
					<a href="https://github.com/Vermont-complex-systems" target="_blank" rel="noreferrer">
						<Github size={18} />
						<span>GitHub</span>
					</a>
				</li>
				<li>
					<a href="https://linkedin.com/school/uvm-vcsc/" target="_blank" rel="noreferrer">
						<Linkedin size={18} />
						<span>LinkedIn</span>
					</a>
				</li>
				<li>
					<a href="https://discord.gg/3VYnT5D4" target="_blank" rel="noreferrer">
						<MessageCircle size={18} />
						<span>Discord</span>
					</a>
				</li>
			</ul>
		</div>
	</div>
</nav>

<style>
	nav {
		position: fixed;
		top: 0;
		right: 0;
		width: 100%;
		max-width: min(17.5rem, 85vw);
		height: 100svh;
		z-index: 101;
		visibility: hidden;
		transform: translateX(100%);
		transition: transform var(--vcsi-transition-base);
		overflow-y: auto;
		background: var(--vcsi-gray-900);
		color: var(--vcsi-gray-100);
		border-left: 1px solid var(--vcsi-gray-700);
		box-shadow: -0.25rem 0 1.5rem rgba(0, 0, 0, 0.3);
	}

	:global(.dark) nav {
		background: var(--vcsi-gray-200);
		color: var(--vcsi-gray-800);
		border-left: 1px solid var(--vcsi-gray-300);
	}

	nav.visible {
		visibility: visible;
		transform: translateX(0);
	}

	.nav-content {
		padding: var(--vcsi-space-xl) var(--vcsi-space-lg);
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.btn-close {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 2.5rem;
		height: 2.5rem;
		border: 1px solid var(--vcsi-gray-700);
		border-radius: 0.5rem;
		background: transparent;
		color: var(--vcsi-gray-100);
		cursor: pointer;
		margin-bottom: var(--vcsi-space-xl);
		transition: all var(--vcsi-transition-base);
		align-self: flex-start;
	}

	.btn-close:hover {
		background: var(--vcsi-gray-800);
	}

	:global(.dark) .btn-close {
		border-color: var(--vcsi-gray-400);
		color: var(--vcsi-gray-800);
	}

	:global(.dark) .btn-close:hover {
		background: var(--vcsi-gray-300);
	}

	.nav-links,
	.social-links {
		margin-bottom: var(--vcsi-space-xl);
	}

	h4 {
		font-family: var(--vcsi-font-mono);
		font-size: var(--vcsi-font-size-small);
		text-transform: uppercase;
		color: var(--vcsi-gray-400);
		margin: 0 0 var(--vcsi-space-md) 0;
		letter-spacing: 0.03em;
	}

	:global(.dark) h4 {
		color: var(--vcsi-gray-600);
	}

	ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	li {
		margin-bottom: 0.75rem;
	}

	a {
		font-family: var(--vcsi-font-sans);
		font-size: var(--vcsi-font-size-base);
		font-weight: var(--vcsi-font-weight-medium);
		color: var(--vcsi-gray-100);
		text-decoration: none;
		transition: all var(--vcsi-transition-base);
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: var(--vcsi-space-sm) 0;
	}

	a:hover {
		color: var(--vcsi-color-white);
		transform: translateX(0.25rem);
	}

	:global(.dark) a {
		color: var(--vcsi-gray-800);
	}

	:global(.dark) a:hover {
		color: var(--vcsi-gray-900);
	}
</style>
