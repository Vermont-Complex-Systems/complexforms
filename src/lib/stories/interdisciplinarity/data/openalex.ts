import { env } from '$env/dynamic/private';

const MAILTO = 'complex-stories@uvm.edu';

export type Paper = {
	id: string;
	title: string;
	year: number | null;
	abstract: string;
	authors: string[];
	topics: { id: string; display_name: string; score: number }[];
	doi: string | null;
	is_open_access: boolean;
};

function reconstructAbstract(inverted: Record<string, number[]> | null | undefined): string {
	if (!inverted) return '';
	const words: Record<number, string> = {};
	for (const [word, positions] of Object.entries(inverted)) {
		for (const pos of positions) words[pos] = word;
	}
	return Object.keys(words)
		.map(Number)
		.sort((a, b) => a - b)
		.map((i) => words[i])
		.join(' ');
}

/** Fetch a single work from OpenAlex and map to our Paper shape. Throws on not-found. */
export async function fetchPaperFromOpenAlex(paperId: string): Promise<Paper> {
	if (!/^W\d+$/.test(paperId)) throw new Error(`Invalid OpenAlex paper ID: ${paperId}`);

	const params = new URLSearchParams({
		filter: `openalex:https://openalex.org/${paperId}`,
		select: 'id,title,publication_year,abstract_inverted_index,authorships,topics,doi,open_access'
	});
	// OpenAlex premium key (gitignored .env) — higher rate limits if present.
	if (env.OPENALEX_API_KEY) params.set('api_key', env.OPENALEX_API_KEY);

	const res = await fetch(`https://api.openalex.org/works?${params}`, {
		headers: { 'User-Agent': `mailto:${MAILTO}` }
	});
	if (!res.ok) throw new Error(`OpenAlex error ${res.status}`);
	const data = await res.json();
	const work = data.results?.[0];
	if (!work) throw new Error(`Paper ${paperId} not found in OpenAlex`);

	return {
		id: paperId,
		title: work.title ?? 'Untitled',
		year: work.publication_year ?? null,
		abstract: reconstructAbstract(work.abstract_inverted_index),
		authors: (work.authorships ?? []).slice(0, 5).map((a: any) => a.author?.display_name ?? 'Unknown'),
		topics: (work.topics ?? []).slice(0, 3).map((t: any) => ({
			id: t.id ?? '',
			display_name: t.display_name ?? '',
			score: t.score ?? 0
		})),
		doi: work.doi ?? null,
		is_open_access: work.open_access?.is_oa ?? false
	};
}
