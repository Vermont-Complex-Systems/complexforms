// Pre-warm the papers cache for any annotated paper that lacks metadata,
// fetching from OpenAlex (mirrors the runtime getPaperById mapping). General:
// covers every annotator, not just one. Idempotent.
//
// Usage: node scripts/prewarm-annotated-papers.mjs
import { readFileSync } from 'node:fs';
import Database from 'better-sqlite3';

const APP_DB = 'data/app.db';
const MAILTO = 'complex-stories@uvm.edu';
const KEY = readFileSync('.env', 'utf8')
	.split('\n')
	.find((l) => l.startsWith('OPENALEX_API_KEY='))
	?.slice('OPENALEX_API_KEY='.length)
	.trim();

function reconstructAbstract(inv) {
	if (!inv) return '';
	const words = {};
	for (const [w, ps] of Object.entries(inv)) for (const p of ps) words[p] = w;
	return Object.keys(words).map(Number).sort((a, b) => a - b).map((i) => words[i]).join(' ');
}

const db = new Database(APP_DB);
const missing = db
	.prepare('select distinct paper_id from paper_annotations where paper_id not in (select id from papers)')
	.all()
	.map((r) => r.paper_id)
	.filter((id) => /^W\d+$/.test(id));

console.log(`${missing.length} annotated papers missing metadata; fetching from OpenAlex…`);

const ins = db.prepare(
	`insert into papers (id, title, year, abstract, authors, topics, doi, is_open_access)
	 values (@id, @title, @year, @abstract, @authors, @topics, @doi, @is_open_access)
	 on conflict(id) do nothing`
);

let ok = 0;
let notFound = 0;
for (const id of missing) {
	const params = new URLSearchParams({
		filter: `openalex:https://openalex.org/${id}`,
		select: 'id,title,publication_year,abstract_inverted_index,authorships,topics,doi,open_access'
	});
	if (KEY) params.set('api_key', KEY);
	const res = await fetch(`https://api.openalex.org/works?${params}`, {
		headers: { 'User-Agent': `mailto:${MAILTO}` }
	});
	if (!res.ok) {
		console.warn(`  ${id}: HTTP ${res.status}`);
		continue;
	}
	const w = (await res.json()).results?.[0];
	if (!w) {
		notFound++;
		continue;
	}
	ins.run({
		id,
		title: w.title ?? 'Untitled',
		year: w.publication_year ?? null,
		abstract: reconstructAbstract(w.abstract_inverted_index),
		authors: JSON.stringify((w.authorships ?? []).slice(0, 5).map((a) => a.author?.display_name ?? 'Unknown')),
		topics: JSON.stringify(
			(w.topics ?? []).slice(0, 3).map((t) => ({ id: t.id ?? '', display_name: t.display_name ?? '', score: t.score ?? 0 }))
		),
		doi: w.doi ?? null,
		is_open_access: w.open_access?.is_oa ? 1 : 0
	});
	ok++;
}

console.log(`cached ${ok} papers; ${notFound} not found in OpenAlex; total papers now ${db.prepare('select count(*) c from papers').get().c}`);
