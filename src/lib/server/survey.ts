import * as v from 'valibot';
import { command, query } from '$app/server';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import type { SQLiteTable } from 'drizzle-orm/sqlite-core';
import Database from 'better-sqlite3';
import { env } from '$env/dynamic/private';
import { makeCoercer, surveyColumns, surveyFields, type Coerce } from './survey.core';

const saveAnswerSchema = v.object({
	fingerprint: v.string(),
	field: v.string(),
	value: v.union([v.number(), v.string(), v.array(v.string())])
});

export type SurveyConfig = {
	/** Drizzle table with `id`, a unique `fingerprint` text column, `createdAt`,
	 *  and one column per answer field. */
	table: SQLiteTable;
	/** Path to the story's SQLite file (surveys are self-contained tier-3
	 *  stories: the DB lives with the story). */
	dbPath: string;
	/** Optional env var naming an override path for deploys where the DB lives
	 *  elsewhere — per-story, because one global var can't point at several
	 *  story DBs at once. */
	envKey?: string;
	/** Per-field overrides for how a submitted value becomes the stored value.
	 *  Only needed for semantic rules (e.g. `consent: () => 1`); plain type
	 *  coercion is derived from the column types. */
	coerce?: Coerce;
};

// The whole server side of a survey story in one call: opens the DB and
// returns the two remote functions to re-export from the story's
// survey.remote.ts (they must be *exported* from a .remote.ts file, but
// creating them here is fine). Answer fields and number coercion are derived
// from the table, so the schema stays the single source of truth.
export function defineSurvey({ table, dbPath, envKey, coerce }: SurveyConfig) {
	const override = envKey ? env[envKey] : undefined;
	const db = drizzle(new Database(override || dbPath));

	const columns = surveyColumns(table);
	if (!columns.fingerprint) {
		throw new Error('defineSurvey: table needs a `fingerprint` column');
	}
	const fields = surveyFields(table);
	const coerceValue = makeCoercer(table, coerce);

	// Single entry point for saving an answer (upsert by fingerprint).
	// better-sqlite3 is synchronous, so .get()/.run() are called without await.
	const saveAnswer = command(saveAnswerSchema, async (data) => {
		const { fingerprint, field } = data;
		if (!fields.includes(field)) throw new Error(`Invalid field: ${field}`);

		const value = coerceValue(field, data.value);

		const existing = db.select().from(table).where(eq(columns.fingerprint, fingerprint)).get();

		if (!existing) {
			db.insert(table)
				.values({ fingerprint, [field]: value })
				.run();
		} else {
			db.update(table)
				.set({ [field]: value })
				.where(eq(columns.fingerprint, fingerprint))
				.run();
		}

		return { message: `${field} saved` };
	});

	const getSurveyResponse = query(v.string(), async (fingerprint) => {
		const survey = db.select().from(table).where(eq(columns.fingerprint, fingerprint)).get();
		return survey ?? null;
	});

	return { db, table, fields, saveAnswer, getSurveyResponse };
}
