import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql, type InferSelectModel } from 'drizzle-orm';

export const EmbeddingSurvey = sqliteTable('embedding_survey', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	fingerprint: text('fingerprint').notNull().unique(),
	favEmbedding: text('favEmbedding'),
	reason: text('reason'),
	createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`)
});

export type EmbeddingSurvey = InferSelectModel<typeof EmbeddingSurvey>;
export type SurveyField = keyof Omit<EmbeddingSurvey, 'id' | 'fingerprint' | 'createdAt'>;
