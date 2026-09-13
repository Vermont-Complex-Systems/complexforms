// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { auth } from '$lib/server/auth';
import type { ic2s2Auth } from '$lib/stories/ic2s2/data/auth';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: typeof auth.$Infer.Session.user | null;
			session: typeof auth.$Infer.Session.session | null;
			// Separate IC2S2 attendee session (isolated from the app login above).
			attendee: typeof ic2s2Auth.$Infer.Session.user | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	// prevent typescript error when importing csv with plugin-dsv
	declare module '*.csv' {
		const data: any[];
		export default data;
	}
}

export {};
