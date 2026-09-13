#!/usr/bin/env node
// Embedding-survey responses for the ic2s2 story. Targets $IC2S2_DB_URL, else
// the local dev DB. Run on prod (or a copied-down prod file) for real answers.
//
//   node scripts/survey.mjs           # tallies + individual answers (text)
//   node scripts/survey.mjs --json    # full rows as JSON
//   node scripts/survey.mjs --csv     # full rows as CSV (spreadsheet-ready)
//
// npm alias: npm run survey

import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';

const DB = process.env.IC2S2_DB_URL || 'src/lib/stories/ic2s2/data/ic2s2.db';
const asJson = process.argv.includes('--json');
const asCsv = process.argv.includes('--csv');

// Map stored option values to their human labels (e.g. qwen3_evoc -> "Qwen3-…").
const copy = JSON.parse(readFileSync('src/lib/stories/ic2s2/data/copy.json', 'utf8'));
const labels = {};
for (const q of copy.survey ?? []) {
	for (const o of q.value.options ?? []) labels[o.value] = o.label;
}
const label = (v) => labels[v] ?? v;

const db = new Database(DB);
const rows = db
	.prepare(
		`SELECT u.name, u.email, s.fav_embedding AS favEmbedding,
		        s.do_embedding AS doEmbedding, s.reason, s.created_at AS createdAt
		 FROM survey_responses s JOIN user u ON u.id = s.user_id
		 ORDER BY s.created_at`
	)
	.all();
db.close();

if (asJson) {
	console.log(JSON.stringify({ db: DB, count: rows.length, rows }, null, 2));
} else if (asCsv) {
	const cols = ['name', 'email', 'favEmbedding', 'doEmbedding', 'reason', 'createdAt'];
	const esc = (v) => (/[",\n]/.test(v ?? '') ? `"${v.replaceAll('"', '""')}"` : (v ?? ''));
	console.log(cols.join(','));
	for (const r of rows) console.log(cols.map((c) => esc(r[c])).join(','));
} else {
	console.log(`DB: ${DB}\n`);
	console.log(`=== 📊 Embedding survey (${rows.length} responses) ===`);
	if (!rows.length) console.log('  (no responses yet)');

	const tally = (field) => {
		const counts = {};
		for (const r of rows) if (r[field]) counts[r[field]] = (counts[r[field]] ?? 0) + 1;
		return Object.entries(counts).sort((a, b) => b[1] - a[1]);
	};

	console.log('\n  Favorite embedding space');
	for (const [v, n] of tally('favEmbedding')) console.log(`    ${String(n).padStart(3)}  ${label(v)}`);

	console.log('\n  Uses embeddings in their work?');
	for (const [v, n] of tally('doEmbedding')) console.log(`    ${String(n).padStart(3)}  ${label(v)}`);

	console.log('\n  Reasons');
	for (const r of rows) {
		if (!r.reason) continue;
		console.log(`    ${r.name} <${r.email}> · ${label(r.favEmbedding) ?? '(no pick)'}`);
		console.log(`      "${r.reason}"`);
	}
}
