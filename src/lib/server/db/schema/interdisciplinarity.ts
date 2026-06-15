import { integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { user } from './auth';

// Lazy OpenAlex paper cache.
export const papers = sqliteTable('papers', {
	id: text('id').primaryKey(), // OpenAlex work id, e.g. W2118557509
	title: text('title'),
	year: integer('year'),
	abstract: text('abstract'),
	authors: text('authors', { mode: 'json' }).$type<string[]>(),
	topics: text('topics', { mode: 'json' }).$type<{ id: string; display_name: string; score: number }[]>(),
	doi: text('doi'),
	isOpenAccess: integer('is_open_access', { mode: 'boolean' }),
	cachedAt: text('cached_at').default(sql`(CURRENT_TIMESTAMP)`)
});

// Interdisciplinarity annotations; dual auth (better-auth user OR fingerprint).
export const paperAnnotations = sqliteTable(
	'paper_annotations',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		paperId: text('paper_id').notNull(),
		userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
		fingerprint: text('fingerprint'),
		rating: integer('rating').notNull(), // 1-5
		confidence: integer('confidence'), // 1-5, nullable
		createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: text('updated_at')
	},
	(t) => [unique('uniq_paper_annotator').on(t.paperId, t.userId, t.fingerprint)]
);
