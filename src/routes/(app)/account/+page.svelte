<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';

	let { data } = $props();

	let currentPassword = $state('');
	let newPassword = $state('');
	let message = $state('');
	let error = $state('');
	let submitting = $state(false);

	async function changePassword(event: SubmitEvent) {
		event.preventDefault();
		submitting = true;
		message = '';
		error = '';
		const { error: err } = await authClient.changePassword({
			currentPassword,
			newPassword,
			revokeOtherSessions: true
		});
		submitting = false;
		if (err) {
			error = err.message ?? 'Could not change password';
		} else {
			message = 'Password updated.';
			currentPassword = '';
			newPassword = '';
		}
	}

	async function signOut() {
		await authClient.signOut();
		await goto('/', { invalidateAll: true });
	}
</script>

<section class="account page">
	<h1>Account</h1>
	<p class="who">{data.user.name} · {data.user.email}</p>

	<form onsubmit={changePassword}>
		<h2>Change password</h2>
		<label>Current password
			<input type="password" bind:value={currentPassword} required autocomplete="current-password" />
		</label>
		<label>New password
			<input type="password" bind:value={newPassword} required minlength="8" autocomplete="new-password" />
		</label>
		{#if error}<p class="error">{error}</p>{/if}
		{#if message}<p class="ok">{message}</p>{/if}
		<button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Update password'}</button>
	</form>

	<button class="signout" onclick={signOut}>Log out</button>
</section>

<style>
	.account { max-width: 24rem; margin-inline: auto; padding-block: var(--vcsi-space-2xl, 3rem); }
	.who { color: var(--vcsi-muted, #666); margin-bottom: var(--vcsi-space-lg, 1.5rem); }
	form { display: flex; flex-direction: column; gap: var(--vcsi-space-md, 1rem); margin-bottom: var(--vcsi-space-lg, 1.5rem); }
	label { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.95rem; }
	input { padding: 0.55rem 0.65rem; border: 1px solid var(--vcsi-border, #ccc); border-radius: 6px; font: inherit; }
	button { padding: 0.6rem 1rem; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; }
	button[type='submit'] { background: var(--vcsi-color-uvm-green, #154734); color: #fff; }
	button:disabled { opacity: 0.6; cursor: default; }
	.signout { background: transparent; border: 1px solid var(--vcsi-border, #ccc); color: var(--vcsi-fg, inherit); }
	.error { color: #b00020; font-size: 0.9rem; margin: 0; }
	.ok { color: #137333; font-size: 0.9rem; margin: 0; }
</style>
