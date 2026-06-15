<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let error = $state('');
	let submitting = $state(false);

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		submitting = true;
		error = '';
		const { error: err } = await authClient.signUp.email({ name, email, password });
		submitting = false;
		if (err) error = err.message ?? 'Registration failed';
		else goto('/');
	}
</script>

<section class="auth page">
	<h1>Create an account</h1>
	<form onsubmit={handleSubmit}>
		<label>Name<input bind:value={name} required autocomplete="name" /></label>
		<label>Email<input type="email" bind:value={email} required autocomplete="email" /></label>
		<label>Password<input type="password" bind:value={password} required minlength="8" autocomplete="new-password" /></label>
		{#if error}<p class="error">{error}</p>{/if}
		<button type="submit" disabled={submitting}>{submitting ? 'Creating…' : 'Sign up'}</button>
	</form>
	<p>Already have an account? <a href="/login">Log in</a></p>
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
