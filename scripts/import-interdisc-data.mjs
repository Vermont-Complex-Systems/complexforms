// One-off seed: import interdisciplinarity papers + annotations from the
// complex_stories Postgres DB into the local app.db (data/app.db).
//
// Logged-in annotations (old integer user_id) are anonymized to stable
// synthetic fingerprints `import_u<id>` with user_id = null, since those users
// don't exist in better-auth. Idempotent (ON CONFLICT DO NOTHING).
//
// Usage: node scripts/import-interdisc-data.mjs
import Database from 'better-sqlite3';
import { execSync } from 'node:child_process';

const PG_DB = 'complex_stories';
const APP_DB = 'data/app.db';

function pgJson(sql) {
	const out = execSync(
		`psql -h 127.0.0.1 -U "${process.env.USER}" -d ${PG_DB} -tAc "select coalesce(json_agg(t), '[]') from (${sql}) t"`,
		{ encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
	);
	return JSON.parse(out.trim() || '[]');
}

const papers = pgJson(
	'select id, title, year, abstract, authors, topics, doi, is_open_access from cached_papers'
);
const anns = pgJson(
	'select paper_id, user_id, fingerprint, interdisciplinarity_rating, confidence, created_at from paper_annotations'
);

const db = new Database(APP_DB);

const insPaper = db.prepare(
	`insert into papers (id, title, year, abstract, authors, topics, doi, is_open_access)
	 values (@id, @title, @year, @abstract, @authors, @topics, @doi, @is_open_access)
	 on conflict(id) do nothing`
);
const insAnn = db.prepare(
	`insert into paper_annotations (paper_id, user_id, fingerprint, rating, confidence, created_at)
	 values (@paper_id, null, @fingerprint, @rating, @confidence, @created_at)
	 on conflict do nothing`
);

const importPapers = db.transaction((rows) => {
	for (const p of rows) {
		insPaper.run({
			id: p.id,
			title: p.title ?? null,
			year: p.year ?? null,
			abstract: p.abstract ?? null,
			authors: JSON.stringify(p.authors ?? []),
			topics: JSON.stringify(p.topics ?? []),
			doi: p.doi ?? null,
			is_open_access: p.is_open_access ? 1 : 0
		});
	}
});

const importAnns = db.transaction((rows) => {
	for (const a of rows) {
		insAnn.run({
			paper_id: a.paper_id,
			fingerprint: a.fingerprint ?? `import_u${a.user_id}`,
			rating: a.interdisciplinarity_rating,
			confidence: a.confidence ?? null,
			created_at: a.created_at ?? null
		});
	}
});

importPapers(papers);
importAnns(anns);

const pc = db.prepare('select count(*) c from papers').get().c;
const ac = db.prepare('select count(*) c from paper_annotations').get().c;
const agreementEligible = db
	.prepare('select count(*) c from (select paper_id from paper_annotations group by paper_id having count(*) >= 3)')
	.get().c;
console.log(`imported: ${papers.length} source papers, ${anns.length} source annotations`);
console.log(`app.db now: ${pc} papers, ${ac} annotations, ${agreementEligible} papers with >=3 annotations`);
