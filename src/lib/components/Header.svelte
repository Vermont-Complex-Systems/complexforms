<script lang="ts">
	import { base } from '$app/paths';
	import { Menu as MenuIcon } from '@lucide/svelte';
	import HeaderMenu from './Header.Menu.svelte';
	import octopusImg from '$lib/assets/images/octopus-swim-right.png?enhanced';
	import logoLight from '$lib/assets/images/vcsi-bumper-sticker-horizontal-arial-transparent.png?enhanced';
	import logoDark from '$lib/assets/images/bumper-sticker2-white-transparent.png?enhanced';
	import { authClient } from '$lib/auth-client';
	import { invalidateAll } from '$app/navigation';

	let { user }: { user: { name: string } | null } = $props();

	async function logout() {
		await authClient.signOut();
		await invalidateAll();
	}

	let isMenuOpen = $state(false);
	let menuButtonRef: HTMLButtonElement;
	let scrollY = $state(0);
	let isScrolled = $derived(scrollY > 0);

	function closeMenu(skipFocus = false) {
		isMenuOpen = false;
		if (!skipFocus) menuButtonRef?.focus();
	}
</script>

<svelte:window bind:scrollY />

<header class={['nav-header', isScrolled && 'scrolled']}>
	<div class="header-inner">
		<div class="header-left">
			<a href="{base}/" class="title-link">
				<div class="title-text">
					<div class="title-with-octopus">
						<span class="site-title">Complex Forms</span>
						<enhanced:img src={octopusImg} alt="" class="octopus-icon" />
					</div>
					<span class="site-subtitle">Describe, Explain, Create, Share.</span>
				</div>
			</a>
		</div>

		<div class="header-right">
			{#if user}
				<span class="nav-user">{user.name}</span>
				<button class="nav-auth" onclick={logout}>Log out</button>
			{:else}
				<a class="nav-auth" href="{base}/login">Log in</a>
			{/if}

			<a href="https://github.com/Vermont-Complex-Systems" target="_blank" rel="noopener noreferrer" class="github-button" aria-label="View on GitHub">
				<svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true">
					<path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
				</svg>
			</a>

			<div class="logo-container">
				<a href="https://vermontcomplexsystems.org/" class="logo-link" target="_blank" rel="noopener noreferrer" aria-label="VCSI">
					<enhanced:img src={logoLight} alt="VCSI" class="logo logo-light" />
					<enhanced:img src={logoDark} alt="VCSI" class="logo logo-dark" />
				</a>
			</div>

			<button
				onclick={() => isMenuOpen = !isMenuOpen}
				bind:this={menuButtonRef}
				class="icon-button mobile-menu-button"
			>
				<MenuIcon size={28} />
				<span class="sr-only">Open menu</span>
			</button>
		</div>
	</div>
</header>

<HeaderMenu visible={isMenuOpen} close={closeMenu} />

<style>
.nav-header {
	position: sticky;
	top: 0;
	left: 0;
	width: 100%;
	background: var(--vcsi-nav-bg);
	color: var(--vcsi-nav-fg);
	border-bottom: 2px solid transparent;
	z-index: 100;
	transition: border-color var(--vcsi-transition-base);
	padding: 1.5rem 0 0.5rem;
}

.header-inner {
	width: 100%;
	max-width: var(--vcsi-page-max-width);
	margin-inline: auto;
	padding-inline: var(--vcsi-page-inline-padding);
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	min-height: var(--vcsi-nav-height);
}

.header-left {
	display: flex;
	align-items: center;
	padding-top: 1rem;
}

.header-right {
	display: flex;
	align-items: center;
	padding-top: 1rem;
	gap: 0.5rem;
}

.title-link {
	display: flex;
	align-items: center;
	gap: var(--vcsi-space-sm);
	text-decoration: none;
	color: inherit;
	transition: transform var(--vcsi-transition-base);
}

.title-link:hover {
	transform: translateY(-0.125rem);
}

.title-text {
	display: flex;
	flex-direction: column;
}

.title-with-octopus {
	display: flex;
	align-items: center;
	gap: var(--vcsi-space-sm);
}

.octopus-icon,
.octopus-icon :global(img) {
	height: 2.5rem;
	width: auto;
	object-fit: contain;
}

.octopus-icon {
	transform: translateY(0.5rem);
}

.site-title {
	font-family: var(--vcsi-font-serif);
	font-weight: var(--vcsi-font-weight-bold);
	font-size: clamp(1.5rem, 3vw, 2rem);
	line-height: 1.1;
}

.site-subtitle {
	font-family: var(--vcsi-font-serif);
	font-size: var(--vcsi-font-size-small);
	color: var(--vcsi-gray-600);
	text-transform: uppercase;
	letter-spacing: 0.03em;
}

.icon-button {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 2.5rem;
	height: 2.5rem;
	border-radius: var(--vcsi-radius-md, 6px);
	background: transparent;
	color: var(--vcsi-fg);
	border: none;
	cursor: pointer;
	transition: all var(--vcsi-transition-base);
}

.icon-button:hover {
	transform: scale(1.05);
	background: var(--vcsi-hover, rgba(0, 0, 0, 0.05));
}

.nav-user {
	font-family: var(--vcsi-font-sans);
	font-size: 0.95rem;
	color: var(--vcsi-fg);
	align-self: center;
}

.nav-auth {
	font-family: var(--vcsi-font-sans);
	font-size: 1rem;
	font-weight: 500;
	color: var(--vcsi-fg);
	background: transparent;
	border: none;
	cursor: pointer;
	text-decoration: none;
	padding: var(--vcsi-space-sm) 0.75rem;
	border-radius: var(--vcsi-radius-md, 6px);
	transition: background var(--vcsi-transition-base);
}

.nav-auth:hover {
	background: var(--vcsi-hover, rgba(0, 0, 0, 0.05));
}

.github-button {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 2.25rem;
	height: 2.25rem;
	border-radius: var(--vcsi-radius-md, 6px);
	text-decoration: none;
	color: var(--vcsi-fg);
	transition: all var(--vcsi-transition-base);
}

.github-button:hover {
	transform: scale(1.1);
	background: var(--vcsi-hover, rgba(0, 0, 0, 0.05));
}

.logo-container {
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	transition: transform var(--vcsi-transition-base);
}

.logo-container:hover {
	transform: scale(1.05);
}

.logo-link {
	display: block;
	text-decoration: none;
}

.logo,
.logo :global(img) {
	max-height: 2rem;
	width: auto;
	object-fit: contain;
	border-radius: 3px;
}

.logo-dark {
	display: none;
}

:global(.dark) .logo-light {
	display: none;
}

:global(.dark) .logo-dark {
	display: block;
	padding: 0.25rem;
}

.mobile-menu-button {
	display: none;
}

.sr-only {
	position: absolute;
	width: 1px;
	height: 1px;
	padding: 0;
	margin: -1px;
	overflow: hidden;
	clip: rect(0, 0, 0, 0);
	white-space: nowrap;
	border: 0;
}

@media (max-width: 768px) {
	.mobile-menu-button {
		display: flex;
	}

	.header-inner {
		min-height: 0;
	}

	.github-button,
	.octopus-icon,
	.logo-container {
		display: none;
	}
}
</style>
