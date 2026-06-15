<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let submitting = $state(false);

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		submitting = true;
		error = '';
		const { error: err } = await authClient.signIn.email({ email, password });
		submitting = false;
		if (err) error = err.message ?? 'Login failed';
		// invalidateAll re-runs the layout server load so the nav reflects the
		// new session without a manual refresh.
		else await goto('/', { invalidateAll: true });
	}
</script>

<section class="auth page">
	<h1>Log in</h1>
	<form onsubmit={handleSubmit}>
		<label>Email<input type="email" bind:value={email} required autocomplete="email" /></label>
		<label>Password<input type="password" bind:value={password} required autocomplete="current-password" /></label>
		{#if error}<p class="error">{error}</p>{/if}
		<button type="submit" disabled={submitting}>{submitting ? 'Logging in…' : 'Log in'}</button>
	</form>
	<p>No account? <a href="/register">Sign up</a></p>
</section>

<style>
	.auth { max-width: 24rem; margin-inline: auto; padding-block: var(--vcsi-space-2xl, 3rem); }
	form { display: flex; flex-direction: column; gap: var(--vcsi-space-md, 1rem); }
	label { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.95rem; }
	input { padding: 0.55rem 0.65rem; border: 1px solid var(--vcsi-border, #ccc); border-radius: 6px; font: inherit; }
	button { padding: 0.6rem 1rem; border: none; border-radius: 6px; background: var(--vcsi-color-uvm-green, #154734); color: #fff; font-weight: 600; cursor: pointer; }
	button:disabled { opacity: 0.6; cursor: default; }
	.error { color: #b00020; font-size: 0.9rem; margin: 0; }
</style>
