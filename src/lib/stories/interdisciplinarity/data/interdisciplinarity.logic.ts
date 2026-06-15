export type AnnRow = { paper_id: string; rating: number; annotator: string };

/** Same-side-of-scale agreement: 1-2 agree, 4-5 agree, 3 only with itself. */
export function ratingsAgree(r1: number, r2: number): boolean {
	if (r1 === r2) return true;
	if (r1 <= 2 && r2 <= 2) return true;
	if (r1 >= 4 && r2 >= 4) return true;
	return false;
}

function stdev(xs: number[]): number {
	if (xs.length < 2) return 0;
	const m = xs.reduce((a, b) => a + b, 0) / xs.length;
	const v = xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1);
	return Math.sqrt(v);
}

export function computeAgreement(
	annotations: AnnRow[],
	titles: Record<string, string>,
	minAnnotations = 3
) {
	const groups = new Map<string, AnnRow[]>();
	for (const a of annotations) {
		if (!groups.has(a.paper_id)) groups.set(a.paper_id, []);
		groups.get(a.paper_id)!.push(a);
	}

	const papers = [];
	for (const [paperId, anns] of groups) {
		if (anns.length < minAnnotations) continue;
		const ratings = anns.map((a) => a.rating);
		const annotators = anns.map((a) => a.annotator);

		const pairwise_matrix = anns.map((_, i) =>
			anns.map((_, j) => ({
				rating: ratings[j],
				agrees: ratingsAgree(ratings[i], ratings[j]),
				diff: Math.abs(ratings[i] - ratings[j])
			}))
		);

		let total = 0;
		let agreeing = 0;
		for (let i = 0; i < ratings.length; i++) {
			for (let j = i + 1; j < ratings.length; j++) {
				total++;
				if (ratingsAgree(ratings[i], ratings[j])) agreeing++;
			}
		}
		const agreement = total > 0 ? agreeing / total : 0;
		const mean = ratings.reduce((a, b) => a + b, 0) / ratings.length;

		papers.push({
			paper_id: paperId,
			title: titles[paperId] ?? paperId,
			num_annotations: ratings.length,
			ratings,
			annotators,
			pairwise_matrix,
			agreement_score: Math.round(agreement * 1000) / 1000,
			std_dev: Math.round(stdev(ratings) * 1000) / 1000,
			mean_rating: Math.round(mean * 100) / 100
		});
	}

	papers.sort((a, b) => a.agreement_score - b.agreement_score);
	return {
		papers,
		total_papers_analyzed: papers.length,
		papers_with_high_disagreement: papers.filter((p) => p.agreement_score < 0.6).length
	};
}
