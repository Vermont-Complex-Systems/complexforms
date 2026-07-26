<script lang="ts">
	// Two logos, swapped by color scheme (see .logo-light/.logo-dark below):
	//  - light: the black SVG (plain import — enhanced-img doesn't process SVG).
	//  - dark:  the white transparent PNG, through enhanced-img so it's optimized.
	import logoBlack from '../assets/ic2s2_logo_black.svg';
	import logoWhite from '../assets/ic2s2_logo_white.png?enhanced';

	let {
		user,
		onLogin,
		onAccount
	}: {
		user: { name: string } | null;
		onLogin: () => void;
		onAccount: () => void;
	} = $props();

	function initials(name: string) {
		if (!name) return 'U';
		const parts = name.trim().split(/\s+/);
		if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
		return name.slice(0, 2).toUpperCase();
	}
</script>

<div class="topbar">
	<div class="topbar-inner">
		<a
			class="logo"
			href="https://ic2s2-2026.org/program/"
			target="_blank"
			rel="noopener noreferrer"
			aria-label="IC2S2 2026 program"
		>
			<img class="logo-light" src={logoBlack} alt="IC2S2 2026" />
			<enhanced:img class="logo-dark" src={logoWhite} alt="IC2S2 2026" />
		</a>

		{#if user}
			<button class="account" onclick={onAccount} aria-label="Account: {user.name}">
				<span class="name">{user.name}</span>
				<span class="avatar">{initials(user.name)}</span>
			</button>
		{:else}
			<button class="login" onclick={onLogin}>Log in</button>
		{/if}
	</div>
</div>

<style>
	.topbar {
		width: 100%;
		background: var(--vcsi-bg);
		border-bottom: 1px solid var(--vcsi-border);
	}
	.topbar-inner {
		max-width: 46rem;
		margin-inline: auto;
		padding: var(--vcsi-space-sm) var(--vcsi-space-md);
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--vcsi-space-md);
	}

	/* The black logo SVG embeds a white-boxed JPEG (no alpha); multiply blends the
	   box into the (light) bar. The blend must sit on this stacking-context anchor. */
	.logo {
		position: relative;
		z-index: 0;
		display: inline-flex;
		mix-blend-mode: multiply;
		transition: transform var(--vcsi-transition-base);
	}
	.logo:hover {
		transform: scale(1.04);
	}
	.logo img,
	.logo :global(img) {
		height: 2.4rem;
		width: auto;
		display: block;
	}

	/* Dark mode: show the white (transparent) logo and drop the multiply blend
	   (which would darken it to nothing). Mirrors scrolly-kit's --vcsi-bg cascade:
	   OS preference by default, with .dark/.light classes overriding it. */
	.logo-dark {
		display: none;
	}
	@media (prefers-color-scheme: dark) {
		.logo {
			mix-blend-mode: normal;
		}
		.logo-light {
			display: none;
		}
		.logo-dark {
			display: block;
		}
	}
	:global(.light) .logo {
		mix-blend-mode: multiply;
	}
	:global(.light) .logo-light {
		display: block;
	}
	:global(.light) .logo-dark {
		display: none;
	}
	:global(.dark) .logo {
		mix-blend-mode: normal;
	}
	:global(.dark) .logo-light {
		display: none;
	}
	:global(.dark) .logo-dark {
		display: block;
	}

	.account {
		display: flex;
		align-items: center;
		gap: var(--vcsi-space-sm);
		padding: 0;
		background: none;
		border: none;
		cursor: pointer;
		font: inherit;
		transition: transform var(--vcsi-transition-base);
	}
	.account:hover {
		transform: scale(1.03);
	}
	.name {
		font-size: var(--vcsi-font-size-xs);
		color: var(--vcsi-muted);
	}
	.avatar {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: var(--vcsi-radius-full);
		background: var(--ic2s2-coral, var(--vcsi-color-accent));
		color: #fff;
		font-size: 0.72rem;
		font-weight: var(--vcsi-font-weight-semibold);
	}
	.login {
		padding: var(--vcsi-space-xs) var(--vcsi-space-lg);
		border: 1px solid var(--ic2s2-coral, var(--vcsi-color-accent));
		border-radius: var(--vcsi-radius-full);
		background: var(--ic2s2-coral, var(--vcsi-color-accent));
		color: #fff;
		font: inherit;
		font-size: var(--vcsi-font-size-xs);
		font-weight: var(--vcsi-font-weight-semibold);
		cursor: pointer;
		transition: opacity var(--vcsi-transition-base);
	}
	.login:hover {
		opacity: 0.9;
	}

	@media (max-width: 640px) {
		.name {
			display: none;
		}
		.logo img {
			height: 2rem;
		}
	}
</style>
