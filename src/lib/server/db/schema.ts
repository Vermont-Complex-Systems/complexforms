import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql, type InferSelectModel } from 'drizzle-orm';

// Only the fields survey-story-1 actually uses (YAGNI on the rest).
export const darkDataSurvey = sqliteTable('dark_data_survey', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	fingerprint: text('fingerprint').notNull().unique(),
	consent: integer('consent'),
	socialMediaPrivacy: text('social_media_privacy'),
	platformMatters: text('platform_matters'),
	relativePreferences: integer('relative_preferences'),
	age: text('age'),
	genderOrd: integer('gender_ord'),
	orientationOrd: integer('orientation_ord'),
	raceOrd: integer('race_ord'),
	createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`)
});

export type DarkDataSurvey = InferSelectModel<typeof darkDataSurvey>;
export type SurveyField = keyof Omit<DarkDataSurvey, 'id' | 'fingerprint' | 'createdAt'>;
