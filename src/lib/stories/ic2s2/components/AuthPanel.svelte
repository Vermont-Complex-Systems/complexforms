<script lang="ts">
	import { signIn } from '../data/auth.remote';
	import { syncAfterLogin } from '../data/sync-session';

	let { scanned = null }: { scanned?: string | null } = $props();
</script>

<div class="auth-card">
	<h2>Log in</h2>

	{#if scanned}
		<p class="scan-note">Log in to record your find.</p>
	{/if}

	<form {...signIn.enhance(syncAfterLogin)}>
		<label>
			Email
			<input {...signIn.fields.email.as('email')} autocomplete="email" placeholder="you@university.edu" />
		</label>
		{#each signIn.fields.email.issues() ?? [] as issue (issue.message)}<p class="error">{issue.message}</p>{/each}

		<label>
			Display name <span class="opt">(optional)</span>
			<input
				{...signIn.fields.displayName.as('text')}
				autocomplete="nickname"
				maxlength="40"
				placeholder="Shown on the leaderboard"
			/>
		</label>
		{#each signIn.fields.displayName.issues() ?? [] as issue (issue.message)}<p class="error">{issue.message}</p>{/each}
		{#if signIn.result?.error}<p class="error">{signIn.result.error}</p>{/if}
		<button type="submit" class="primary" disabled={!!signIn.pending}>
			{signIn.pending ? '…' : 'Log in'}
		</button>
	</form>

	<p class="hint">
		Use the email you registered for IC2S2 with — no password needed. First time in sets up your account.
		The display name is optional — you can set or change it any time from your account.
	</p>
</div>

<style>
	.auth-card { max-width: 22rem; margin: var(--vcsi-space-lg) auto; padding: var(--vcsi-space-lg); border: 1px solid var(--vcsi-border); border-radius: var(--vcsi-radius-lg); background: var(--vcsi-bg); }
	h2 { margin: 0 0 var(--vcsi-space-md); font-size: var(--vcsi-font-size-small); }
	.scan-note { font-size: var(--vcsi-font-size-xs); color: var(--ic2s2-coral, var(--vcsi-color-accent)); margin: 0 0 var(--vcsi-space-sm); }
	form { display: flex; flex-direction: column; gap: var(--vcsi-space-sm); }
	label { display: flex; flex-direction: column; gap: var(--vcsi-space-xs); font-size: var(--vcsi-font-size-xs); }
	.opt { color: var(--vcsi-muted); font-weight: var(--vcsi-font-weight-normal); }
	input { padding: var(--vcsi-space-sm) var(--vcsi-space-md); border: 1px solid var(--vcsi-border); border-radius: var(--vcsi-radius-md); font: inherit; }
	button.primary { padding: var(--vcsi-space-sm); border: none; border-radius: var(--vcsi-radius-md); background: var(--ic2s2-coral, var(--vcsi-color-accent)); color: #fff; font-weight: var(--vcsi-font-weight-semibold); cursor: pointer; }
	button.primary:disabled { opacity: 0.6; }
	.hint { color: var(--vcsi-muted); font-size: var(--vcsi-font-size-xs); margin-top: var(--vcsi-space-sm); }
	.error { color: #b00020; font-size: var(--vcsi-font-size-xs); margin: 0; }
</style>
