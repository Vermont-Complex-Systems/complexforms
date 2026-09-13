import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { APIError } from 'better-auth/api';
import { getRequestEvent } from '$app/server';
import { env } from '$env/dynamic/private';
import { eq } from 'drizzle-orm';
import { db } from './db';
import { attendees } from './schema';

// The IC2S2 story's OWN better-auth instance, fully isolated from the app auth
// ($lib/server/auth.ts) used by interdisciplinarity:
//   - its own DB file (data ⇢ src/lib/stories/ic2s2/data/ic2s2.db)
//   - its own API namespace  (basePath /api/ic2s2-auth)
//   - its own cookie         (cookiePrefix 'ic2s2')
// So a session here is invisible to the app login and vice versa.
//
// Auth is email + password, gated on the conference registration list: a person
// claims an account with the email they registered with, then logs in with it.

const claimedEmail = (user: Record<string, unknown>, ctx: unknown): string => {
	const body = (ctx as { body?: Record<string, unknown> } | null)?.body;
	const raw = (body?.email ?? user.email ?? '') as string;
	return String(raw).trim().toLowerCase();
};

export const ic2s2Auth = betterAuth({
	baseURL: env.BETTER_AUTH_URL,
	secret: env.BETTER_AUTH_SECRET,
	basePath: '/api/ic2s2-auth',
	database: drizzleAdapter(db, { provider: 'sqlite' }),
	emailAndPassword: { enabled: true },
	plugins: [sveltekitCookies(getRequestEvent)],
	advanced: { cookiePrefix: 'ic2s2' },
	databaseHooks: {
		user: {
			create: {
				// Gate account creation on the registration allow-list.
				before: async (user, ctx) => {
					const email = claimedEmail(user, ctx);
					if (!email) throw new APIError('BAD_REQUEST', { message: 'An email is required.' });
					const row = db.select().from(attendees).where(eq(attendees.email, email)).get();
					if (!row)
						throw new APIError('FORBIDDEN', {
							message: `"${email}" is not on the IC2S2 registration list.`
						});
					if (row.claimedAt)
						throw new APIError('FORBIDDEN', {
							message: 'This account has already been claimed. Try logging in.'
						});
				},
				// Mark the attendee row claimed so it can't be taken twice.
				after: async (user, ctx) => {
					const email = claimedEmail(user, ctx);
					if (email) {
						db.update(attendees)
							.set({ claimedAt: new Date().toISOString() })
							.where(eq(attendees.email, email))
							.run();
					}
				}
			}
		}
	}
});
