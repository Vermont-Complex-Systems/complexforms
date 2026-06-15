import { query, command, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import { eq, and } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { papers, paperAnnotations } from '$lib/server/db/schema';
import { fetchPaperFromOpenAlex } from './openalex';
import { computeAgreement, type AnnRow } from './interdisciplinarity.logic';

// Resolve current annotator: logged-in better-auth user id, else provided fingerprint.
function annotator(fingerprint?: string): { userId: string | null; fingerprint: string | null } {
	const { locals } = getRequestEvent();
	if (locals.user) return { userId: locals.user.id, fingerprint: null };
	return { userId: null, fingerprint: fingerprint ?? null };
}

// Display-only: is someone logged in?
export const getCurrentUser = query(async () => {
	const { locals } = getRequestEvent();
	return locals.user ? { name: locals.user.name } : null;
});

// Lazy paper cache: local first, else OpenAlex + write-through.
export const getPaperById = query(v.string(), async (paperId) => {
	const cached = db.select().from(papers).where(eq(papers.id, paperId)).get();
	if (cached) {
		return {
			id: cached.id,
			title: cached.title,
			year: cached.year,
			abstract: cached.abstract ?? '',
			authors: cached.authors ?? [],
			topics: cached.topics ?? [],
			doi: cached.doi,
			is_open_access: cached.isOpenAccess ?? false
		};
	}
	const paper = await fetchPaperFromOpenAlex(paperId);
	db.insert(papers)
		.values({
			id: paper.id,
			title: paper.title,
			year: paper.year,
			abstract: paper.abstract,
			authors: paper.authors,
			topics: paper.topics,
			doi: paper.doi,
			isOpenAccess: paper.is_open_access
		})
		.onConflictDoNothing()
		.run();
	return paper;
});

// Upsert an annotation (user changes their mind => update).
export const annotatePaper = command(
	v.object({
		paper_id: v.string(),
		interdisciplinarity_rating: v.pipe(v.number(), v.minValue(1), v.maxValue(5)),
		confidence: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(5))),
		fingerprint: v.optional(v.string())
	}),
	async (input) => {
		const { userId, fingerprint } = annotator(input.fingerprint);
		if (!userId && !fingerprint) throw new Error('Login or fingerprint required');

		const where = userId
			? and(eq(paperAnnotations.paperId, input.paper_id), eq(paperAnnotations.userId, userId))
			: and(eq(paperAnnotations.paperId, input.paper_id), eq(paperAnnotations.fingerprint, fingerprint!));
		const existing = db.select().from(paperAnnotations).where(where).get();

		if (existing) {
			db.update(paperAnnotations)
				.set({
					rating: input.interdisciplinarity_rating,
					confidence: input.confidence ?? null,
					updatedAt: new Date().toISOString()
				})
				.where(eq(paperAnnotations.id, existing.id))
				.run();
		} else {
			db.insert(paperAnnotations)
				.values({
					paperId: input.paper_id,
					userId,
					fingerprint,
					rating: input.interdisciplinarity_rating,
					confidence: input.confidence ?? null
				})
				.run();
		}
		return { message: 'saved' };
	}
);

// A user's / fingerprint's annotations, in the API's shape.
export const getMyAnnotations = query(
	v.optional(v.object({ fingerprint: v.optional(v.string()) })),
	async (params = {}) => {
		const { userId, fingerprint } = annotator(params.fingerprint);
		if (!userId && !fingerprint) return { annotations: [], total: 0 };
		const where = userId
			? eq(paperAnnotations.userId, userId)
			: eq(paperAnnotations.fingerprint, fingerprint!);
		const rows = db.select().from(paperAnnotations).where(where).all();
		const annotations = rows.map((r) => ({
			paper_id: r.paperId,
			interdisciplinarity_rating: r.rating,
			confidence: r.confidence
		}));
		return { annotations, total: annotations.length };
	}
);

// Aggregate stats, in the API's shape.
export const getAnnotationStats = query(async () => {
	const rows = db.select().from(paperAnnotations).all();
	const total = rows.length;
	const logged_in = rows.filter((r) => r.userId).length;
	const rating_distribution: Record<number, number> = {};
	const per_paper_counts: Record<string, number> = {};
	let sum = 0;
	for (const r of rows) {
		sum += r.rating;
		rating_distribution[r.rating] = (rating_distribution[r.rating] ?? 0) + 1;
		per_paper_counts[r.paperId] = (per_paper_counts[r.paperId] ?? 0) + 1;
	}
	return {
		total_annotations: total,
		logged_in_annotations: logged_in,
		anonymous_annotations: total - logged_in,
		average_rating: total ? sum / total : 0,
		rating_distribution,
		per_paper_counts
	};
});

// Inter-annotator agreement, in the API's shape.
export const getAgreementData = query(async () => {
	const rows = db.select().from(paperAnnotations).all();
	const annRows: AnnRow[] = rows.map((r) => ({
		paper_id: r.paperId,
		rating: r.rating,
		annotator: r.userId ? `user_${r.userId}` : `anon_${(r.fingerprint ?? '').slice(0, 8)}`
	}));
	const paperIds = [...new Set(annRows.map((a) => a.paper_id))];
	const titles: Record<string, string> = {};
	for (const id of paperIds) {
		const p = db.select({ title: papers.title }).from(papers).where(eq(papers.id, id)).get();
		titles[id] = p?.title ?? id;
	}
	return computeAgreement(annRows, titles, 3);
});
