// Everything for the IC2S2 story lives in ONE local DB (data/ic2s2.db): its own
// better-auth tables + attendee allow-list + the two features' data. Keeping it
// all in one file means foreign keys to `user` work normally, and the whole
// story stays self-contained and isolated from the app DB / interdisciplinarity.
import { relations, sql, type InferSelectModel } from 'drizzle-orm';
import { integer, sqliteTable, text, index, unique } from 'drizzle-orm/sqlite-core';

/* ------------------------------------------------------------------ *
 * better-auth tables (attendee identity). Default names are fine —
 * this is a separate database file from data/app.db.
 * ------------------------------------------------------------------ */
export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: integer('email_verified', { mode: 'boolean' }).default(false).notNull(),
	image: text('image'),
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.$onUpdate(() => new Date())
		.notNull()
});

export const session = sqliteTable(
	'session',
	{
		id: text('id').primaryKey(),
		expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
		token: text('token').notNull().unique(),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()).notNull(),
		ipAddress: text('ip_address'),
		userAgent: text('user_agent'),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' })
	},
	(t) => [index('session_userId_idx').on(t.userId)]
);

export const account = sqliteTable(
	'account',
	{
		id: text('id').primaryKey(),
		accountId: text('account_id').notNull(),
		providerId: text('provider_id').notNull(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		accessToken: text('access_token'),
		refreshToken: text('refresh_token'),
		idToken: text('id_token'),
		accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp_ms' }),
		refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp_ms' }),
		scope: text('scope'),
		password: text('password'),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()).notNull()
	},
	(t) => [index('account_userId_idx').on(t.userId)]
);

export const verification = sqliteTable(
	'verification',
	{
		id: text('id').primaryKey(),
		identifier: text('identifier').notNull(),
		value: text('value').notNull(),
		expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => new Date())
			.notNull()
	},
	(t) => [index('verification_identifier_idx').on(t.identifier)]
);

/* ------------------------------------------------------------------ *
 * Attendee allow-list, seeded from the conference registration list.
 * Only these (registered) emails may claim an account. Emails are stored
 * normalized (lowercased).
 * ------------------------------------------------------------------ */
export const attendees = sqliteTable('attendees', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	email: text('email').notNull().unique(),
	name: text('name'),
	claimedAt: text('claimed_at'),
	createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`)
});

/* ------------------------------------------------------------------ *
 * Page 1 — Program (talks + posters) & votes. One up-vote per (user, item).
 * Seeded from IC2S2_2026_with_sessions.xlsx (talks) + the POSTERS CSV (poster
 * day assignments). `id` is the submission number.
 * ------------------------------------------------------------------ */
export const confTalks = sqliteTable('conf_talks', {
	id: text('id').primaryKey(),
	kind: text('kind').notNull(), // 'talk' | 'poster' | 'lightning'
	title: text('title').notNull(),
	authors: text('authors'),
	theme: text('theme'),
	day: text('day'), // ISO date, e.g. '2026-07-29' (nullable — some posters unassigned)
	session: text('session'), // parallel-session letter (talks)
	sessionTitle: text('session_title'),
	time: text('time'), // 'AM' | 'PM' (talks)
	abstract: text('abstract'),
	createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`)
});

// Best-of voting: each attendee picks ONE best item per (day, category). `day`
// and `category` are denormalized from the item so the unique constraint can
// enforce the single pick. category = the item's kind ('talk'|'poster'|'lightning').
export const confVotes = sqliteTable(
	'conf_votes',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		talkId: text('talk_id')
			.notNull()
			.references(() => confTalks.id, { onDelete: 'cascade' }),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		day: text('day').notNull(),
		category: text('category').notNull(),
		createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`)
	},
	(t) => [unique('uniq_best_vote').on(t.userId, t.day, t.category)]
);

/* ------------------------------------------------------------------ *
 * Page 2 — Burlington hunt. `id` doubles as the QR token; one find per
 * (user, object).
 * ------------------------------------------------------------------ */
export const huntObjects = sqliteTable('hunt_objects', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	hint: text('hint'),
	location: text('location'),
	points: integer('points').notNull().default(1),
	createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`)
});

export const huntFinds = sqliteTable(
	'hunt_finds',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		objectId: text('object_id')
			.notNull()
			.references(() => huntObjects.id, { onDelete: 'cascade' }),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		foundAt: text('found_at').default(sql`(CURRENT_TIMESTAMP)`)
	},
	(t) => [unique('uniq_hunt_find').on(t.userId, t.objectId)]
);

/* ------------------------------------------------------------------ *
 * Page 3 — Embedding survey. Mirrors the standalone embedding-survey story,
 * but here a response is tied to the logged-in attendee (one row per account,
 * upserted field-by-field) rather than an anonymous browser fingerprint. Kept
 * in this one DB so it references `user` like votes and finds do. Column KEYS
 * match the copy.json question `name`s (favEmbedding, reason) — the remote
 * upserts by that name.
 * ------------------------------------------------------------------ */
export const surveyResponses = sqliteTable('survey_responses', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: text('user_id')
		.notNull()
		.unique()
		.references(() => user.id, { onDelete: 'cascade' }),
	favEmbedding: text('fav_embedding'),
	doEmbedding: text('do_embedding'),
	reason: text('reason'),
	createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`)
});

/* ------------------------------------------------------------------ *
 * Optional attendee profile — extra info a user can fill in on the account
 * page (the public display name lives on `user.name`; everything optional and
 * private-ish lives here). One row per user; add a column per new field.
 * ------------------------------------------------------------------ */
export const attendeeProfiles = sqliteTable('attendee_profiles', {
	userId: text('user_id')
		.primaryKey()
		.references(() => user.id, { onDelete: 'cascade' }),
	researchField: text('research_field'),
	updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`)
});

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account)
}));

export type Attendee = InferSelectModel<typeof attendees>;
export type ConfTalk = InferSelectModel<typeof confTalks>;
export type HuntObject = InferSelectModel<typeof huntObjects>;
export type SurveyResponse = InferSelectModel<typeof surveyResponses>;
export type AttendeeProfile = InferSelectModel<typeof attendeeProfiles>;
