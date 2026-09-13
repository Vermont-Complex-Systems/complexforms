import { createAuthClient } from 'better-auth/svelte';

// App auth client (email/password). The ic2s2 story has its own separate client
// at src/lib/stories/ic2s2/data/auth-client.ts.
export const authClient = createAuthClient();
