import { query, command, getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import * as v from 'valibot';
import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from './db';
import { confTalks, confVotes, huntObjects, huntFinds, user, attendeeProfiles } from './schema';
import { CONF_DAYS, isVotingOpen, votingStatus } from './voting';
import { verifyToken } from './hunt-token.js';

// Guard for the app's data: everything except getCurrentUser requires an
// authenticated IC2S2 attendee. Logged-out requests get a 401 (the UI shows the
// login view based on getCurrentUser).
function requireAttendee() {
	const { locals } = getRequestEvent();
	if (!locals.attendee) error(401, 'Log in to continue.');
	return locals.attendee;
}

// Who is the logged-in attendee? (This story's own session, not the app login.)
// Unguarded on purpose — the client uses it to decide logged-in vs logged-out.
export const getCurrentUser = query(async () => {
	const { locals } = getRequestEvent();
	return locals.attendee
		? { id: locals.attendee.id, name: locals.attendee.name, email: locals.attendee.email }
		: null;
});

// The current attendee's optional profile fields (display name lives on the user
// row / getCurrentUser; this is the extra stuff). Defaults to blanks before they
// fill anything in.
export const getMyProfile = query(async () => {
	const id = requireAttendee().id;
	const row = db.select().from(attendeeProfiles).where(eq(attendeeProfiles.userId, id)).get();
	return { researchField: row?.researchField ?? '' };
});

// Save the editable profile. Display name is the public one (user.name, shown on
// the leaderboard); the rest is upserted into attendee_profiles. Identity is the
// session attendee — you can only edit your own. To add a field later: add a
// column (schema), a line to the valibot object, and a `set` below.
export const updateProfile = command(
	v.object({
		displayName: v.pipe(v.string(), v.trim(), v.maxLength(40, 'Keep your display name under 40 characters.')),
		researchField: v.pipe(v.string(), v.trim(), v.maxLength(80, 'Keep your research field under 80 characters.'))
	}),
	async ({ displayName, researchField }) => {
		const attendee = requireAttendee();

		// Blank display name resets to the email local-part, so the leaderboard
		// name is never empty.
		const name = displayName || attendee.email.split('@')[0];
		db.update(user).set({ name }).where(eq(user.id, attendee.id)).run();

		const field = researchField || null;
		db.insert(attendeeProfiles)
			.values({ userId: attendee.id, researchField: field })
			.onConflictDoUpdate({ target: attendeeProfiles.userId, set: { researchField: field } })
			.run();

		return { name, researchField: field ?? '' };
	}
);

// The whole program (talks + posters). Vote TALLIES are deliberately NOT included:
// attendees only ever see their OWN pick (getMyVotes), never the running totals —
// showing totals would bias voting (bandwagon) and leak standings. Aggregate
// results live only in the admin leaderboard.
export const getProgram = query(async () => {
	requireAttendee();
	return db
		.select({
			id: confTalks.id,
			kind: confTalks.kind,
			title: confTalks.title,
			authors: confTalks.authors,
			theme: confTalks.theme,
			day: confTalks.day,
			session: confTalks.session,
			sessionTitle: confTalks.sessionTitle,
			time: confTalks.time
		})
		.from(confTalks)
		.all();
});

// The item ids the current attendee has picked (at most one per day+category).
export const getMyVotes = query(async () => {
	const attendee = requireAttendee();
	return db
		.select({ talkId: confVotes.talkId })
		.from(confVotes)
		.where(eq(confVotes.userId, attendee.id))
		.all()
		.map((r) => r.talkId);
});

// Voting-window status for each program day, so the UI can enable/disable and
// show a banner.
export const getVotingWindows = query(async () => {
	requireAttendee();
	const out: Record<string, { open: boolean; label: string }> = {};
	for (const d of CONF_DAYS) out[d] = votingStatus(d);
	return out;
});

// Cast (or move / clear) your single best-of pick for the item's day+category.
// Re-picking the same item clears it; picking another in the same category moves
// your vote. Enforced by the unique(user, day, category) constraint + the window.
// Single-flight: the client's getMyVotes() is refreshed with the response.
export const castVote = command(v.string(), async (talkId) => {
	const userId = requireAttendee().id;

	const item = db
		.select({ day: confTalks.day, kind: confTalks.kind })
		.from(confTalks)
		.where(eq(confTalks.id, talkId))
		.get();
	if (!item) throw new Error('Unknown item.');
	if (!item.day) throw new Error('This item is not scheduled on a day yet.');
	if (!isVotingOpen(item.day)) throw new Error('Voting is not open right now.');

	const { day, kind: category } = item;
	const existing = db
		.select({ id: confVotes.id, talkId: confVotes.talkId })
		.from(confVotes)
		.where(and(eq(confVotes.userId, userId), eq(confVotes.day, day), eq(confVotes.category, category)))
		.get();

	if (existing && existing.talkId === talkId) {
		db.delete(confVotes).where(eq(confVotes.id, existing.id)).run();
	} else if (existing) {
		db.update(confVotes).set({ talkId }).where(eq(confVotes.id, existing.id)).run();
	} else {
		db.insert(confVotes).values({ talkId, userId, day, category }).run();
	}

	void getMyVotes().refresh(); // only the user's own pick changes; the program (no tallies) doesn't
});

// Scavenger hunt is DISCOVERY mode: attendees only see objects they've found.
// Returns the found objects (most recent first) + the total that exist, so the
// UI can show "X of N found" without revealing the unfound ones.
export const getMyFinds = query(async () => {
	const userId = requireAttendee().id;
	const found = db
		.select({
			id: huntObjects.id,
			name: huntObjects.name,
			hint: huntObjects.hint,
			location: huntObjects.location,
			points: huntObjects.points,
			foundAt: huntFinds.foundAt
		})
		.from(huntFinds)
		.innerJoin(huntObjects, eq(huntFinds.objectId, huntObjects.id))
		.where(eq(huntFinds.userId, userId))
		.orderBy(desc(huntFinds.foundAt))
		.all();
	const total = Number(db.select({ n: sql<number>`count(*)`.as('n') }).from(huntObjects).get()?.n ?? 0);
	return { found, total };
});

// Hunt standings across ALL attendees. Unlike the votes (where tallies are
// hidden), a leaderboard only reveals who is ahead — never WHICH objects are
// unfound — so it doesn't break discovery mode. Ranked like the admin CLI
// (scripts/leaderboard.mjs): finds, then points, then name. Only names + counts
// leave the server (no emails/ids); the caller's own row is flagged server-side.
export const getHuntLeaderboard = query(async () => {
	const meId = requireAttendee().id;
	const rows = db
		.select({
			userId: huntFinds.userId,
			name: user.name,
			finds: sql<number>`count(*)`.as('finds'),
			points: sql<number>`coalesce(sum(${huntObjects.points}), 0)`.as('points')
		})
		.from(huntFinds)
		.innerJoin(user, eq(user.id, huntFinds.userId))
		.innerJoin(huntObjects, eq(huntObjects.id, huntFinds.objectId))
		.groupBy(huntFinds.userId)
		.orderBy(sql`finds desc`, sql`points desc`, user.name)
		.all();

	// Standard competition ranking: equal (finds, points) share a rank, the next
	// distinct score jumps to its absolute position (1, 2, 2, 4…).
	let rank = 0;
	let prevFinds = -1;
	let prevPoints = -1;
	return rows.map((r, i) => {
		if (r.finds !== prevFinds || r.points !== prevPoints) {
			rank = i + 1;
			prevFinds = r.finds;
			prevPoints = r.points;
		}
		return { rank, name: r.name, finds: r.finds, points: r.points, isMe: r.userId === meId };
	});
});

// Record a QR-scanned find. The QR carries a SIGNED token (see hunt-token.js),
// not a raw object id, so ids can't be guessed/forged. Verify → object id, then
// record idempotently (one per attendee per object). Single-flight refreshes.
export const recordFind = command(v.string(), async (token) => {
	const userId = requireAttendee().id;
	const objectId = verifyToken(token, env.BETTER_AUTH_SECRET ?? '');
	if (!objectId) throw new Error("That QR code isn't valid.");
	const object = db
		.select({ id: huntObjects.id, name: huntObjects.name })
		.from(huntObjects)
		.where(eq(huntObjects.id, objectId))
		.get();
	if (!object) throw new Error("That code doesn't match a hunt object.");
	db.insert(huntFinds).values({ objectId, userId }).onConflictDoNothing().run();
	void getMyFinds().refresh();
	return { name: object.name };
});
