import { getCurrentUser } from './data.remote';

// Reflect a log-in / log-out in the UI right after the form submits.
//
// Both hard-reload the current URL once the cookie change is applied — that's the
// only reliable way. The tidier options all misfired:
//   - `form.result` isn't populated inside the enhance callback.
//   - reactive `refresh()` / `set(null)` intermittently left the page showing the
//     OLD auth state (the "had to refresh" bug, on both log-in and log-out).
//   - a single-flight `submit().updates(getCurrentUser())` is STALE: the query
//     reads `locals.attendee`, which hooks compute at the START of the request —
//     before signIn/signOut changes the cookie.
// A full reload re-runs hooks with the new cookie, and for a `?find=` QR scan it
// records the find on the clean mount.
//   - log in : reload only if we're actually signed in, so a failed attempt keeps
//              its error on screen instead of reloading it away.
//   - log out: always reload — the fresh render shows the true (signed-out) state.

type AuthForm = { submit: () => Promise<unknown> };

export async function syncAfterLogin(form: AuthForm) {
	await form.submit();
	await getCurrentUser().refresh();
	if (getCurrentUser().current) location.reload();
}

export async function syncAfterLogout(form: AuthForm) {
	await form.submit();
	location.reload();
}
