import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { env } from '$env/dynamic/private';
import { db } from './db';

// App auth (email/password) on data/app.db — used by interdisciplinarity and the
// account pages. The conference/hunt (ic2s2) story runs its OWN, separate
// better-auth instance on its own local DB, so the two logins never mix.
//
// better-auth reads BETTER_AUTH_URL/SECRET from process.env, but SvelteKit
// surfaces .env through $env/dynamic/private — so pass them explicitly. Without
// the secret, `vite build` (production mode) throws BetterAuthError at load.
export const auth = betterAuth({
	baseURL: env.BETTER_AUTH_URL,
	secret: env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: 'sqlite' }),
	emailAndPassword: { enabled: true },
	plugins: [sveltekitCookies(getRequestEvent)]
});
