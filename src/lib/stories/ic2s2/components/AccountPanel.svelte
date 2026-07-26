<script lang="ts">
	import { onMount } from 'svelte';
	import { logout } from '../data/auth.remote';
	import { getCurrentUser, getMyProfile, updateProfile } from '../data/data.remote';
	import { syncAfterLogout } from '../data/sync-session';

	let {
		user,
		onBack
	}: {
		user: { name: string; email: string };
		onBack: () => void;
	} = $props();

	// Editable profile fields. Display name seeds from the user row; the rest load
	// from getMyProfile once (onMount, so no reactive write-loop). Seeding from the
	// initial `user.name` is intended — this is a local draft the user then edits.
	// svelte-ignore state_referenced_locally
	let displayName = $state(user.name);
	let researchField = $state('');
	onMount(async () => {
		const p = await getMyProfile();
		researchField = p.researchField;
	});

	let status = $state<'idle' | 'saving' | 'saved' | 'error'>('idle');
	let errorMsg = $state('');
	const touch = () => (status = 'idle');

	async function save(e: SubmitEvent) {
		e.preventDefault();
		status = 'saving';
		errorMsg = '';
		try {
			const res = await updateProfile({ displayName, researchField });
			// Reflect any server normalization (e.g. blank name → email local-part).
			displayName = res.name;
			researchField = res.researchField;
			await getCurrentUser().refresh(); // update the name shown in TopBar / elsewhere
			status = 'saved';
		} catch (err) {
			errorMsg = err instanceof Error ? err.message : 'Could not save your changes.';
			status = 'error';
		}
	}
</script>

<div class="account-card">
	<h2>Your account</h2>

	<form class="profile" onsubmit={save}>
		<label>
			Display name <span class="opt">(optional)</span>
			<input bind:value={displayName} maxlength="40" placeholder="Shown on the leaderboard" oninput={touch} />
		</label>
		<label>
			Research field <span class="opt">(optional)</span>
			<input bind:value={researchField} maxlength="80" placeholder="e.g. Computational social science" oninput={touch} />
		</label>

		<dl>
			<dt>Email</dt>
			<dd>{user.email}</dd>
		</dl>

		<div class="save-row">
			<button type="submit" class="save" disabled={status === 'saving'}>
				{status === 'saving' ? 'Saving…' : 'Save changes'}
			</button>
			{#if status === 'saved'}<span class="ok">Saved ✓</span>
			{:else if status === 'error'}<span class="err">{errorMsg}</span>{/if}
		</div>
	</form>

	<div class="actions">
		<form {...logout.enhance(syncAfterLogout)}>
			<button type="submit" class="logout" disabled={!!logout.pending}>
				{logout.pending ? '…' : 'Log out'}
			</button>
		</form>
		<button class="back" onclick={onBack}>Back to voting</button>
	</div>
</div>

<style>
	.account-card { max-width: 24rem; margin: var(--vcsi-space-lg) auto; padding: var(--vcsi-space-lg); border: 1px solid var(--vcsi-border); border-radius: var(--vcsi-radius-lg); background: var(--vcsi-bg); }
	h2 { margin: 0 0 var(--vcsi-space-md); font-size: var(--vcsi-font-size-small); }

	.profile { display: flex; flex-direction: column; gap: var(--vcsi-space-sm); margin-bottom: var(--vcsi-space-lg); }
	label { display: flex; flex-direction: column; gap: var(--vcsi-space-xs); font-size: var(--vcsi-font-size-xs); }
	.opt { color: var(--vcsi-muted); font-weight: var(--vcsi-font-weight-normal); }
	input { padding: var(--vcsi-space-sm) var(--vcsi-space-md); border: 1px solid var(--vcsi-border); border-radius: var(--vcsi-radius-md); font: inherit; }

	dl { display: grid; grid-template-columns: auto 1fr; gap: var(--vcsi-space-xs) var(--vcsi-space-md); margin: var(--vcsi-space-xs) 0 0; font-size: var(--vcsi-font-size-xs); }
	dt { color: var(--vcsi-muted); }
	dd { margin: 0; word-break: break-all; }

	.save-row { display: flex; align-items: center; gap: var(--vcsi-space-md); margin-top: var(--vcsi-space-xs); }
	.save { padding: var(--vcsi-space-sm) var(--vcsi-space-lg); border: none; border-radius: var(--vcsi-radius-md); background: var(--ic2s2-coral, var(--vcsi-color-accent)); color: #fff; font: inherit; font-weight: var(--vcsi-font-weight-semibold); cursor: pointer; }
	.save:disabled { opacity: 0.6; cursor: default; }
	.ok { font-size: var(--vcsi-font-size-xs); color: var(--ic2s2-coral, var(--vcsi-color-accent)); }
	.err { font-size: var(--vcsi-font-size-xs); color: #b00020; }

	.actions { display: flex; flex-direction: column; gap: var(--vcsi-space-sm); }
	.actions form { margin: 0; }
	.logout { width: 100%; padding: var(--vcsi-space-sm); border: none; border-radius: var(--vcsi-radius-md); background: var(--ic2s2-coral, var(--vcsi-color-accent)); color: #fff; font: inherit; font-weight: var(--vcsi-font-weight-semibold); cursor: pointer; }
	.logout:disabled { opacity: 0.6; }
	.back { padding: var(--vcsi-space-sm); border: 1px solid var(--vcsi-border); border-radius: var(--vcsi-radius-md); background: transparent; color: var(--vcsi-fg); font: inherit; cursor: pointer; }
	.back:hover { background: var(--vcsi-hover); }
</style>
