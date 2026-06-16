import paperIds from './top_cited_papers_comp_networks.csv';

/** Unique OpenAlex paper IDs from the curated CSV (dedupe on oa_wid). */
export function getUniquePaperIds() {
	const unique = new Set();
	for (const row of paperIds) {
		if (row.oa_wid && String(row.oa_wid).trim() !== '') unique.add(String(row.oa_wid).trim());
	}
	return Array.from(unique);
}
