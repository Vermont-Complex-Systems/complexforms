import { form, getRequestEvent } from '$app/server';
import { createHmac } from 'node:crypto';
import * as v from 'valibot';
import { eq } from 'drizzle-orm';
import { APIError } from 'better-auth/api';
import { env } from '$env/dynamic/private';
import { ic2s2Auth } from './auth';
import { db } from './db';
import { user } from './schema';

// Passwordless, single-step sign-in: an attendee just enters the email they
// registered with. First time in creates the account (gated by the registration
// allow-list in auth.ts's create hook); every time after, it signs them in — one
// flow, no "claim vs log in" split, no password UX.
//
// Under the hood we still use better-auth email+password (for its sessions,
// tables and isolation), but the password is a deterministic value DERIVED from
// the email + server secret — never shown, entered, or sent to the client. So the
// same email always resolves to the same account.
//
// Trust-based by product decision: there is no email verification, so knowing a
// registered email is enough to sign in as that person (impersonation possible
// and accepted). Depends on BETTER_AUTH_SECRET being stable per environment —
// change it and existing derived passwords stop matching.

const email = v.pipe(v.string(), v.trim(), v.toLowerCase(), v.email('Enter a valid email'));

// Optional public display name (shown on the leaderboard), captured at login so
// most people set one by default. Blank keeps the account's existing name — the
// email local-part on a brand-new account. Editable later on the account page.
const displayName = v.optional(
	v.pipe(v.string(), v.trim(), v.maxLength(40, 'Keep your display name under 40 characters.'))
);

const passwordFor = (e: string) =>
	createHmac('sha256', env.BETTER_AUTH_SECRET ?? '').update('ic2s2-passwordless:' + e).digest('base64url');

export const signIn = form(v.object({ email, displayName }), async ({ email, displayName }) => {
	const { request } = getRequestEvent();
	const password = passwordFor(email);
	const name = displayName || undefined; // '' / whitespace-only → leave the name as-is
	try {
		await ic2s2Auth.api.signInEmail({ body: { email, password }, headers: request.headers });
		// Existing account: apply a new display name only if one was entered.
		if (name) db.update(user).set({ name }).where(eq(user.email, email)).run();
	} catch {
		// No account yet → create one. The allow-list gate lives in auth.ts's
		// user.create.before hook, so a non-registered email is rejected here.
		try {
			await ic2s2Auth.api.signUpEmail({
				body: { email, password, name: name ?? email.split('@')[0] },
				headers: request.headers
			});
		} catch (e) {
			return { error: e instanceof APIError ? e.message : 'Could not sign in.' };
		}
	}
});

export const logout = form(async () => {
	const { request } = getRequestEvent();
	await ic2s2Auth.api.signOut({ headers: request.headers });
});
