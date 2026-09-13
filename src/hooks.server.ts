import { auth } from '$lib/server/auth';
import { ic2s2Auth } from '$lib/stories/ic2s2/data/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';

// Two independent auth instances. They use different cookie prefixes, so each
// getSession only ever reads its own cookie — an app login and an IC2S2 attendee
// login are fully isolated.
export async function handle({ event, resolve }) {
	const appSession = await auth.api.getSession({ headers: event.request.headers });
	event.locals.user = appSession?.user ?? null;
	event.locals.session = appSession?.session ?? null;

	const attSession = await ic2s2Auth.api.getSession({ headers: event.request.headers });
	event.locals.attendee = attSession?.user ?? null;

	// Route each auth API namespace to the instance that owns it.
	if (event.url.pathname.startsWith('/api/ic2s2-auth')) {
		return svelteKitHandler({ event, resolve, auth: ic2s2Auth, building });
	}
	return svelteKitHandler({ event, resolve, auth, building });
}
