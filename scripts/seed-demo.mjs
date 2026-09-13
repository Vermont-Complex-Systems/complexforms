#!/usr/bin/env node
// Seeds the IC2S2 story's local DB from the authoritative conference JSON:
//   - attendees <- registration_ic2s2.csv
//   - program   <- parallel-sessions.json (talks) + poster.json (posters)
//                  + program.json (plenary lightning talks)
//   - hunt      <- a few demo objects
// Idempotent for attendees/hunt; the program is rebuilt each run.
//   node scripts/seed-demo.mjs

import fs from 'node:fs';
import Database from 'better-sqlite3';

const D = 'src/lib/stories/ic2s2/data/';
const readJson = (f) => JSON.parse(fs.readFileSync(D + f, 'utf8'));
const clean = (s) => (s == null ? null : String(s).replace(/\s+/g, ' ').trim() || null);
const db = new Database(D + 'ic2s2.db');

// Program day numbers -> ISO dates (all three files use their own numbering).
const PARALLEL_DATE = { 2: '2026-07-29', 3: '2026-07-30', 4: '2026-07-31' };
const LIGHTNING_DATE = { 2: '2026-07-29', 3: '2026-07-30', 4: '2026-07-31' };
const POSTER_DATE = { 1: '2026-07-29', 2: '2026-07-30', 3: '2026-07-31' };

// --- Attendee allow-list from the registration CSV ------------------------
const emails = new Set();
for (const line of fs.readFileSync(D + 'registration_ic2s2.csv', 'utf8').split(/\r?\n/)) {
	const cell = line.split(',')[0].trim().toLowerCase();
	if (cell.includes('@') && !cell.startsWith('email address')) emails.add(cell);
}
for (const e of ['jstonge1@uvm.edu', 'jonathanstonge7@gmail.com']) emails.add(e);
const insAttendee = db.prepare('INSERT OR IGNORE INTO attendees (email) VALUES (?)');
db.transaction((list) => list.forEach((e) => insAttendee.run(e)))([...emails]);

// --- Program: rebuild from scratch (ids changed, so clear votes too) -------
const items = [];

// Parallel talks
for (const s of readJson('parallel-sessions.json')) {
	for (const p of s.papers ?? []) {
		items.push({
			id: `t${p.submission}`,
			kind: 'talk',
			title: clean(p.title) ?? '(untitled)',
			authors: clean(p.authors),
			theme: clean(s.title),
			day: PARALLEL_DATE[s.day] ?? null,
			session: clean(s.track),
			sessionTitle: clean(s.title),
			time: clean(s.time),
			abstract: clean(p.abstract)
		});
	}
}

// Posters
for (const s of readJson('poster.json')) {
	for (const p of s.posters ?? []) {
		items.push({
			id: `p${p.id}`,
			kind: 'poster',
			title: clean(p.title) ?? '(untitled)',
			authors: clean(p.authors),
			theme: clean(p.theme),
			day: POSTER_DATE[s.day] ?? null,
			session: null,
			sessionTitle: null,
			time: null,
			abstract: clean(p.abstract)
		});
	}
}

// Plenary lightning talks (nested in the program schedule)
for (const day of readJson('program.json')) {
	const dayNum = Number(String(day.day).replace(/\D/g, ''));
	for (const e of day.events ?? []) {
		if (e.type !== 'lightning') continue;
		(e.items ?? []).forEach((it, i) => {
			items.push({
				id: `l${dayNum}-${i}`,
				kind: 'lightning',
				title: clean(it.title) ?? '(untitled)',
				authors: clean(it.presenters),
				theme: clean(e.title),
				day: LIGHTNING_DATE[dayNum] ?? null,
				session: null,
				sessionTitle: clean(e.title),
				time: clean(it.time),
				abstract: null
			});
		});
	}
}

const insItem = db.prepare(
	`INSERT INTO conf_talks
	 (id, kind, title, authors, theme, day, session, session_title, time, abstract)
	 VALUES (@id, @kind, @title, @authors, @theme, @day, @session, @sessionTitle, @time, @abstract)`
);
db.transaction(() => {
	db.prepare('DELETE FROM conf_votes').run();
	db.prepare('DELETE FROM conf_talks').run();
	for (const it of items) insItem.run(it);
})();

// --- Burlington hunt objects (id = slug; the QR encodes a SIGNED token of it,
// see hunt-token.js / gen-qr.mjs). Remove the old demo set, then upsert. -----
const objects = [
	['flora-and-fauna', 'Flora and Fauna'],
	['frog-hollow', 'Frog Hollow'],
	['vermont-flannel', 'Vermont Flannel Company'],
	['hunny-mustard', 'Hunny Mustard'],
	['phoenix-books', 'Phoenix Books'],
	['crow-bookshop', 'Crow Bookshop'],
	['farm-and-foragers', 'Farm and Foragers'],
	['foam', 'Foam'],
	['spot-on-the-dock', 'Spot on the Dock'],
	['queen-city-brewery', 'Queen City Brewery'],
	['folinos', 'Folinos Pizza'],
	['wise-fool', 'The Wise Fool'],
	['zero-gravity', 'Zero Gravity'],
	['vivid-coffee', 'Vivid Coffee'],
	['august-first', 'August First'],
	['shy-guy-gelato', 'Shy Guy Gelato'],
	['ben-and-jerrys', "Ben and Jerry's"],
	['rogue-rabbit', 'Rogue Rabbit'],
	['deep-city', 'Deep City'],
	['onyx-tonics', 'Onyx Tonics'],
	['mr-creemee', 'Mr. Creemee'],
	['burlington-bay', 'Burlington Bay'],
	['golden-hour', 'Golden Hour Gift Co'],
	['lake-champlain-chocolates', 'Lake Champlain Chocolates'],
	['devil-takes-a-holiday', 'Devil Takes a Holiday'],
	['pingala', 'Pingala'],
	['wilder-wine', 'Wilder Wine']
];
db.prepare("DELETE FROM hunt_objects WHERE id LIKE 'bhx-%'").run();
const insObject = db.prepare('INSERT OR IGNORE INTO hunt_objects (id, name) VALUES (?, ?)');
for (const [id, name] of objects) insObject.run(id, name);

const byKind = db.prepare('SELECT kind, COUNT(*) n FROM conf_talks GROUP BY kind').all();
console.log('Seeded IC2S2 program:', {
	attendees: db.prepare('SELECT COUNT(*) n FROM attendees').get().n,
	...Object.fromEntries(byKind.map((r) => [r.kind, r.n])),
	hunt_objects: db.prepare('SELECT COUNT(*) n FROM hunt_objects').get().n
});
db.close();
