import * as v from 'valibot';
import { command, query } from '$app/server';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { darkDataSurvey } from '$lib/server/db/schema';
import { isValidField, processValue } from './survey.fields';

// Single entry point for saving a survey answer (upsert by fingerprint).
// better-sqlite3 is synchronous, so .get()/.run() are called without await.
export const saveAnswer = command(
	v.object({
		fingerprint: v.string(),
		field: v.string(),
		value: v.union([v.number(), v.string(), v.array(v.string())])
	}),
	async (data) => {
		const { fingerprint, field } = data;
		if (!isValidField(field)) throw new Error(`Invalid field: ${field}`);

		const value = processValue(field, data.value);

		const existing = db
			.select()
			.from(darkDataSurvey)
			.where(eq(darkDataSurvey.fingerprint, fingerprint))
			.get();

		if (!existing) {
			db.insert(darkDataSurvey).values({ fingerprint, [field]: value }).run();
		} else {
			db.update(darkDataSurvey)
				.set({ [field]: value })
				.where(eq(darkDataSurvey.fingerprint, fingerprint))
				.run();
		}

		return { message: `${field} saved` };
	}
);

export const getSurveyResponse = query(v.string(), async (fingerprint) => {
	const survey = db
		.select()
		.from(darkDataSurvey)
		.where(eq(darkDataSurvey.fingerprint, fingerprint))
		.get();
	return survey ?? null;
});
