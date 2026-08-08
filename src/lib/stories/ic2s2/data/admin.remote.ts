import { query, getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';
import * as v from 'valibot';
import { eq, sql } from 'drizzle-orm';
import { db } from './db';
import { attendees, confTalks, confVoteEvents, confVotes, user } from './schema';

// Organizer-only data for the in-story dashboard (StatsPanel, the view === 'stats'
// panel in Index.svelte). Unlike data.remote.ts — which never exposes tallies to
// attendees — this module returns aggregate results and emails, so every export
// is gated on isOrganizer(). Following the guarded-remote-function pattern: the
// guard lives in the query, not a route, so there's no hidden page to protect.
//
// Who's an organizer: DB role first (grant with `npm run attendee -- grant
// <email>`, live with no restart) → IC2S2_ADMIN_EMAILS env override/bootstrap →
// a dev-only fallback that lets any logged-in attendee in when nothing is
// configured yet, so the page works out of the box on local test data.
function isOrganizer(attendee: App.Locals['attendee']): boolean {
	if (!attendee) return false;
	const email = attendee.email.toLowerCase();

	const row = db.select({ role: attendees.role }).from(attendees).where(eq(attendees.email, email)).get();
	if (row?.role === 'organizer') return true;

	const allowed = (env.IC2S2_ADMIN_EMAILS ?? '')
		.split(',')
		.map((s) => s.trim().toLowerCase())
		.filter(Boolean);
	if (allowed.includes(email)) return true;

	if (dev && allowed.length === 0) {
		const anyOrganizer = db.select({ id: attendees.id }).from(attendees).where(eq(attendees.role, 'organizer')).get();
		if (!anyOrganizer) return true;
	}
	return false;
}

function requireOrganizer() {
	const { locals } = getRequestEvent();
	if (!locals.attendee) error(401, 'Log in on the IC2S2 page first.');
	if (isOrganizer(locals.attendee)) return locals.attendee;
	error(403, 'This page is for conference organizers.');
}

// Whether the current attendee is an organizer — the client uses this to show
// the dashboard link in the TopBar. Unguarded on purpose: it only ever reveals
// the caller's OWN status (false for everyone else), never any dashboard data.
export const getIsOrganizer = query(async () => {
	const { locals } = getRequestEvent();
	return isOrganizer(locals.attendee);
});

// Everything the dashboard needs in one round trip: header counts, the vote
// leaderboard, the most active voters, and the raw event log (the client
// buckets it into an hourly timeseries in US/Eastern).
export const getVoteAnalytics = query(async () => {
	requireOrganizer();

	const counts = {
		registered: Number(db.select({ n: sql<number>`count(*)`.as('n') }).from(attendees).get()?.n ?? 0),
		accounts: Number(db.select({ n: sql<number>`count(*)`.as('n') }).from(user).get()?.n ?? 0),
		voters: Number(
			db.select({ n: sql<number>`count(distinct user_id)`.as('n') }).from(confVotes).get()?.n ?? 0
		),
		votes: Number(db.select({ n: sql<number>`count(*)`.as('n') }).from(confVotes).get()?.n ?? 0),
		events: Number(db.select({ n: sql<number>`count(*)`.as('n') }).from(confVoteEvents).get()?.n ?? 0)
	};

	// Per attendee: current stars, lifetime toggles, and last activity. Scalar
	// subqueries keep it one statement; JS drops the never-voted. The outer-row
	// reference must be a literal `"user"."id"` — interpolating ${user.id} here
	// renders unqualified `"id"`, which SQLite binds to the SUBQUERY's own id
	// column, silently zeroing every count.
	const voters = db
		.select({
			name: user.name,
			email: user.email,
			stars: sql<number>`(select count(*) from conf_votes v where v.user_id = "user"."id")`.as('stars'),
			toggles: sql<number>`(select count(*) from conf_vote_events e where e.user_id = "user"."id")`.as('toggles'),
			lastAt: sql<number | null>`(select max(at) from conf_vote_events e where e.user_id = "user"."id")`.as('last_at')
		})
		.from(user)
		.orderBy(sql`stars desc, toggles desc, ${user.name}`)
		.all()
		.filter((v) => v.toggles > 0);

	// Current tallies per item, most-voted first (same shape as scripts/leaderboard.mjs).
	const leaderboard = db
		.select({
			id: confTalks.id,
			kind: confTalks.kind,
			title: confTalks.title,
			authors: confTalks.authors,
			day: confTalks.day,
			session: confTalks.session,
			votes: sql<number>`count(*)`.as('votes')
		})
		.from(confVotes)
		.innerJoin(confTalks, eq(confTalks.id, confVotes.talkId))
		.groupBy(confVotes.talkId)
		.orderBy(sql`votes desc`, confTalks.title)
		.all();

	// The append-only log, oldest first. `at` is ms-epoch (see schema); drizzle
	// hydrates timestamp_ms columns as Date, so serialize to a number.
	const events = db
		.select({ at: confVoteEvents.at, action: confVoteEvents.action })
		.from(confVoteEvents)
		.orderBy(confVoteEvents.at)
		.all()
		.map((e) => ({ at: e.at instanceof Date ? e.at.getTime() : Number(e.at), action: e.action }));

	return { counts, voters, leaderboard, events };
});

// Drill-down: who CURRENTLY has one item starred (unvoting removes the row, so
// this is the live set behind that item's tally). Organizer-only; fetched on
// demand when a leaderboard row is expanded.
export const getItemVoters = query(v.string(), async (talkId) => {
	requireOrganizer();
	return db
		.select({ name: user.name, email: user.email, at: confVotes.createdAt })
		.from(confVotes)
		.innerJoin(user, eq(user.id, confVotes.userId))
		.where(eq(confVotes.talkId, talkId))
		.orderBy(confVotes.createdAt)
		.all();
});
