#!/usr/bin/env node
// Leaderboards for the ic2s2 story. Targets $IC2S2_DB_URL, else the local dev DB.
// Run on prod (or a copied-down prod file) for the real standings — local only
// reflects your own test data.
//
//   node scripts/leaderboard.mjs           # hunt standings + vote winners (text)
//   node scripts/leaderboard.mjs --json    # machine-readable JSON (for a slide/site)
//
// npm alias: npm run leaderboard

import Database from 'better-sqlite3';

const DB = process.env.IC2S2_DB_URL || 'src/lib/stories/ic2s2/data/ic2s2.db';
const asJson = process.argv.includes('--json');
const trunc = (s, n = 68) => (s && s.length > n ? s.slice(0, n - 1) + '…' : s);

const db = new Database(DB);

// Hunt: attendees ranked by number of finds (points as tie-break).
const hunt = db
	.prepare(
		`SELECT u.name, u.email, COUNT(*) AS finds, COALESCE(SUM(o.points), 0) AS points
		 FROM hunt_finds f
		 JOIN user u ON u.id = f.user_id
		 JOIN hunt_objects o ON o.id = f.object_id
		 GROUP BY f.user_id
		 ORDER BY finds DESC, points DESC, u.name`
	)
	.all();
const huntTotal = db.prepare('SELECT COUNT(*) n FROM hunt_objects').get().n;

// Votes: each talk's tally, grouped into day -> category -> ranked list.
const CAT = { talk: 'Parallel talk', lightning: 'Lightning talk', poster: 'Poster' };
const voteRows = db
	.prepare(
		`SELECT v.day, v.category, t.title, t.authors, COUNT(*) AS votes
		 FROM conf_votes v JOIN conf_talks t ON t.id = v.talk_id
		 GROUP BY v.talk_id
		 ORDER BY v.day, v.category, votes DESC`
	)
	.all();
const votes = {};
for (const r of voteRows) {
	(votes[r.day] ??= {});
	(votes[r.day][r.category] ??= []).push(r);
}

if (asJson) {
	console.log(JSON.stringify({ db: DB, huntTotal, hunt, votes }, null, 2));
} else {
	console.log(`DB: ${DB}\n`);

	console.log(`=== 🗺️  Hunt standings (of ${huntTotal} objects) ===`);
	if (!hunt.length) console.log('  (no finds yet)');
	hunt.forEach((h, i) =>
		console.log(`  ${String(i + 1).padStart(2)}. ${h.finds} finds · ${h.points} pts  —  ${h.name} <${h.email}>`)
	);

	console.log('\n=== 🗳️  Vote winners (top 3 per category per day) ===');
	const days = Object.keys(votes).sort();
	if (!days.length) console.log('  (no votes yet)');
	for (const day of days) {
		console.log(`\n  ${day}`);
		for (const cat of ['talk', 'lightning', 'poster']) {
			const list = votes[day]?.[cat];
			if (!list?.length) continue;
			console.log(`    ${CAT[cat] ?? cat}`);
			list.slice(0, 3).forEach((r, i) => {
				const medal = ['🥇', '🥈', '🥉'][i] ?? '   ';
				console.log(`      ${medal} ${String(r.votes).padStart(3)}  ${trunc(r.title)}${r.authors ? '  · ' + trunc(r.authors, 40) : ''}`);
			});
		}
	}
}
db.close();
