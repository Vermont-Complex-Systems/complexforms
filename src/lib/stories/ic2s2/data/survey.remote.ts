import { query, command, getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';
import * as v from 'valibot';
import { eq } from 'drizzle-orm';
import { db } from './db';
import { surveyResponses } from './schema';

// The answer fields the embedding survey collects (copy.json question `name`s).
// A picklist so a spoofed field name can never reach the dynamic column update.
const FIELDS = ['favEmbedding', 'doEmbedding', 'reason'] as const;

// Identity is the logged-in IC2S2 attendee — resolved from the session HERE on
// the server, never from a client-supplied id. So a response is always the
// caller's own: it can't be read or written on another attendee's behalf.
function requireAttendeeId(): string {
	const { locals } = getRequestEvent();
	if (!locals.attendee) error(401, 'Log in to continue.');
	return locals.attendee.id;
}

// The current attendee's survey row (all fields), or null before they answer.
export const getMySurvey = query(async () => {
	const userId = requireAttendeeId();
	const row = db.select().from(surveyResponses).where(eq(surveyResponses.userId, userId)).get();
	return row ?? null;
});

// Upsert one answer for the current attendee (one row per account, keyed by
// userId's unique constraint). Checkbox-style arrays are stored comma-joined,
// mirroring the shared survey convention.
export const saveSurveyAnswer = command(
	v.object({
		field: v.picklist(FIELDS),
		value: v.union([v.string(), v.array(v.string())])
	}),
	async ({ field, value }) => {
		const userId = requireAttendeeId();
		const stored = Array.isArray(value) ? value.join(',') : value;

		const existing = db
			.select({ id: surveyResponses.id })
			.from(surveyResponses)
			.where(eq(surveyResponses.userId, userId))
			.get();

		if (!existing) {
			db.insert(surveyResponses)
				.values({ userId, [field]: stored })
				.run();
		} else {
			db.update(surveyResponses)
				.set({ [field]: stored })
				.where(eq(surveyResponses.userId, userId))
				.run();
		}

		return { message: `${field} saved` };
	}
);
