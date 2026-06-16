import { describe, it, expect } from 'vitest';
import { ratingsAgree, computeAgreement } from '../src/lib/stories/interdisciplinarity/data/interdisciplinarity.logic';

describe('ratingsAgree', () => {
	it('equal ratings agree', () => expect(ratingsAgree(2, 2)).toBe(true));
	it('1 and 2 agree (interdisciplinary side)', () => expect(ratingsAgree(1, 2)).toBe(true));
	it('4 and 5 agree (not-interdisciplinary side)', () => expect(ratingsAgree(4, 5)).toBe(true));
	it('3 only agrees with itself', () => {
		expect(ratingsAgree(3, 3)).toBe(true);
		expect(ratingsAgree(3, 2)).toBe(false);
	});
	it('2 and 4 disagree', () => expect(ratingsAgree(2, 4)).toBe(false));
});

describe('computeAgreement', () => {
	const anns = [
		{ paper_id: 'W1', rating: 1, annotator: 'anon_a' },
		{ paper_id: 'W1', rating: 2, annotator: 'anon_b' },
		{ paper_id: 'W1', rating: 5, annotator: 'anon_c' },
		{ paper_id: 'W2', rating: 4, annotator: 'anon_a' } // below minAnnotations
	];
	const titles = { W1: 'Paper One', W2: 'Paper Two' };

	it('only includes papers with >= minAnnotations', () => {
		const out = computeAgreement(anns, titles, 3);
		expect(out.papers.map((p) => p.paper_id)).toEqual(['W1']);
		expect(out.total_papers_analyzed).toBe(1);
	});

	it('computes agreement_score, mean, and a square pairwise matrix', () => {
		const p = computeAgreement(anns, titles, 3).papers[0];
		// pairs: (1,2) agree, (1,5) disagree, (2,5) disagree => 1/3
		expect(p.agreement_score).toBeCloseTo(0.333, 2);
		expect(p.mean_rating).toBeCloseTo(2.67, 1);
		expect(p.num_annotations).toBe(3);
		expect(p.pairwise_matrix.length).toBe(3);
		expect(p.pairwise_matrix[0].length).toBe(3);
		expect(p.title).toBe('Paper One');
	});
});
