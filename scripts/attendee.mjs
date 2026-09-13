#!/usr/bin/env node
// Admin CLI for the ic2s2 attendee login. Targets $IC2S2_DB_URL, else the local
// dev DB. Run it ON THE PROD SERVER (or against a copied-down prod file) to manage
// real attendees — running it locally only touches your own test data, since the
// two ic2s2.db files never sync.
//
//   node scripts/attendee.mjs add    <email>   # put an email on the allow-list (on-site registration)
//   node scripts/attendee.mjs grant  <email>   # make them an organizer (can see /ic2s2/stats)
//   node scripts/attendee.mjs revoke <email>   # take organizer away again
//   node scripts/attendee.mjs status <email>   # claim status for one attendee
//   node scripts/attendee.mjs reset  <email>   # delete their login so they can re-claim
//   node scripts/attendee.mjs claims           # list everyone who has claimed
//   node scripts/attendee.mjs wipe [--yes]     # delete ALL logins + clear ALL claims
//                                              # (dry run unless --yes). Use once when
//                                              # migrating to passwordless. Keeps the
//                                              # attendees allow-list.
//
// npm aliases: npm run attendee -- status <email>   |   npm run reset-accounts [-- --yes]

import Database from 'better-sqlite3';

const DB = process.env.IC2S2_DB_URL || 'src/lib/stories/ic2s2/data/ic2s2.db';
const [cmd, rawEmail] = process.argv.slice(2);

const db = new Database(DB);
db.pragma('foreign_keys = ON'); // so reset's ON DELETE CASCADE fires (account/session/votes/finds)

// Timestamps are stored in UTC (ISO strings / epoch ms). Show them in Eastern —
// the conference is in Burlington, so raw UTC reads ~4h ahead of the wall clock.
const etTime = (v) =>
	v == null
		? 'no'
		: new Date(v).toLocaleString('en-US', {
				timeZone: 'America/New_York',
				month: 'short',
				day: 'numeric',
				hour: 'numeric',
				minute: '2-digit',
				hour12: true
			}) + ' ET';

function needEmail() {
	if (!rawEmail) {
		console.error(`Usage: node scripts/attendee.mjs ${cmd} <email>`);
		process.exit(1);
	}
	return rawEmail.trim().toLowerCase();
}

function status(email) {
	const att = db.prepare('SELECT claimed_at, role FROM attendees WHERE email = ?').get(email);
	const usr = db.prepare('SELECT id, name, created_at FROM user WHERE email = ?').get(email);
	const hasPw =
		usr &&
		db
			.prepare("SELECT 1 FROM account WHERE user_id = ? AND provider_id = 'credential' AND password IS NOT NULL")
			.get(usr.id);
	console.log(`DB           : ${DB}`);
	console.log(`email        : ${email}`);
	console.log(`on allow-list: ${att ? 'yes' : 'NO — not a registered attendee, cannot claim'}`);
	console.log(`role         : ${att?.role ?? 'attendee'}`);
	console.log(`claimed      : ${etTime(att?.claimed_at)}`);
	console.log(`login account: ${usr ? `${usr.name} (created ${etTime(usr.created_at)})` : 'none'}`);
	console.log(`password set : ${hasPw ? 'yes' : 'no'}`);
}

// On-site registration: allow-list one more email. Idempotent; the change is
// live immediately (the list is checked at claim time, no restart needed).
function add(email) {
	if (!email.includes('@')) {
		console.error(`"${email}" doesn't look like an email.`);
		process.exit(1);
	}
	const r = db.prepare('INSERT OR IGNORE INTO attendees (email) VALUES (?)').run(email);
	console.log(r.changes ? `Added ${email} to the allow-list.\n` : `${email} was already on the allow-list.\n`);
	status(email);
}

// Organizer role = access to the hidden /ic2s2/stats dashboard. Checked live
// on every request (admin.remote.ts), so grant/revoke need no restart. Grant
// also allow-lists the email if it isn't registered yet.
function grant(email) {
	db.prepare('INSERT OR IGNORE INTO attendees (email) VALUES (?)').run(email);
	db.prepare("UPDATE attendees SET role = 'organizer' WHERE email = ?").run(email);
	console.log(`${email} is now an organizer — they can open /ic2s2/stats once logged in.\n`);
	status(email);
}

function revoke(email) {
	const r = db.prepare('UPDATE attendees SET role = NULL WHERE email = ?').run(email);
	console.log(r.changes ? `Revoked organizer from ${email}.\n` : `${email} is not on the allow-list.\n`);
	status(email);
}

function reset(email) {
	const usr = db.prepare('SELECT id FROM user WHERE email = ?').get(email);
	const att = db.prepare('SELECT claimed_at FROM attendees WHERE email = ?').get(email);
	if (!usr && !att?.claimed_at) {
		console.log(`Nothing to reset — ${email} has no claimed account.`);
		return;
	}
	db.transaction(() => {
		db.prepare('DELETE FROM user WHERE email = ?').run(email); // cascades account/session/votes/finds
		db.prepare('UPDATE attendees SET claimed_at = NULL WHERE email = ?').run(email);
	})();
	console.log(`Reset ${email} — login deleted, claim cleared. They can claim again.\n`);
	status(email);
}

function claims() {
	const rows = db
		.prepare(
			`SELECT a.email, u.name, a.claimed_at
			 FROM attendees a JOIN user u ON u.email = a.email
			 WHERE a.claimed_at IS NOT NULL
			 ORDER BY a.claimed_at DESC`
		)
		.all();
	console.log(`DB: ${DB}`);
	console.log(`${rows.length} claimed account${rows.length === 1 ? '' : 's'}:`);
	for (const r of rows) console.log(`  ${etTime(r.claimed_at).padEnd(20)}  ${r.email}  (${r.name})`);
}

function wipe() {
	const yes = process.argv.includes('--yes') || process.argv.includes('-y');
	const n = (sql) => db.prepare(sql).get().n;
	const users = n('SELECT COUNT(*) n FROM user');
	const claimed = n('SELECT COUNT(*) n FROM attendees WHERE claimed_at IS NOT NULL');
	const votes = n('SELECT COUNT(*) n FROM conf_votes');
	const finds = n('SELECT COUNT(*) n FROM hunt_finds');
	console.log(`DB: ${DB}`);
	console.log(
		`Will delete ${users} login${users === 1 ? '' : 's'} (+ ${votes} votes, ${finds} finds via cascade) and clear ${claimed} claim${claimed === 1 ? '' : 's'}. The attendees allow-list is kept.`
	);
	if (!yes) {
		console.log('\nDry run. Re-run with --yes to execute:  node scripts/attendee.mjs wipe --yes');
		return;
	}
	db.transaction(() => {
		db.prepare('DELETE FROM user').run(); // cascades account/session/votes/finds
		db.prepare('UPDATE attendees SET claimed_at = NULL').run();
	})();
	console.log('\nDone — all logins deleted, all claims cleared. Everyone can sign in fresh.');
}

switch (cmd) {
	case 'add':
		add(needEmail());
		break;
	case 'grant':
		grant(needEmail());
		break;
	case 'revoke':
		revoke(needEmail());
		break;
	case 'status':
		status(needEmail());
		break;
	case 'reset':
		reset(needEmail());
		break;
	case 'claims':
		claims();
		break;
	case 'wipe':
		wipe();
		break;
	default:
		console.error('Usage: node scripts/attendee.mjs <add|grant|revoke|status|reset|claims|wipe> [email|--yes]');
		process.exit(1);
}
db.close();
