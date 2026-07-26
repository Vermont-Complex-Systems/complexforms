#!/usr/bin/env node
// Generates printable QR codes for the Burlington hunt — one PNG per object plus
// an index.html contact sheet — into the story assets dir. Organizer-only: run
// it, print the sheet (or share the PNGs). Attendees never get a web page.
//
//   node scripts/gen-qr.mjs [baseUrl]
//
// Each QR encodes <baseUrl>/ic2s2?find=<signed token> (opaque, so it doesn't look
// like an obviously-shareable ?object=foo link). These get printed and placed, so
// they default to PRODUCTION. Override only for local testing:
//   node scripts/gen-qr.mjs http://localhost:5173
//
// The token is HMAC-signed with BETTER_AUTH_SECRET, so codes only verify against
// a deployment using the SAME secret. Generate on prod (or with the prod secret
// in .env) so the printed codes work at complexforms.uvm.edu.

import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import QRCode from 'qrcode';
import { signToken } from '../src/lib/stories/ic2s2/data/hunt-token.js';

const PROD_URL = 'https://complexforms.uvm.edu';
const baseUrl = (process.argv[2] || process.env.BASE_URL || PROD_URL).replace(/\/+$/, '');

// Signing secret: env first, else read BETTER_AUTH_SECRET from .env.
function envSecret() {
	if (process.env.BETTER_AUTH_SECRET) return process.env.BETTER_AUTH_SECRET;
	try {
		const line = fs.readFileSync('.env', 'utf8').split(/\r?\n/).find((l) => l.startsWith('BETTER_AUTH_SECRET='));
		return line ? line.slice('BETTER_AUTH_SECRET='.length).trim().replace(/^["']|["']$/g, '') : '';
	} catch {
		return '';
	}
}
const secret = envSecret();
if (!secret) {
	console.error('BETTER_AUTH_SECRET is required to sign QR tokens (set it in the env or .env).');
	process.exit(1);
}

const db = new Database('src/lib/stories/ic2s2/data/ic2s2.db');
const objects = db.prepare('SELECT id, name, location FROM hunt_objects ORDER BY name').all();
db.close();

const outDir = 'src/lib/stories/ic2s2/assets/hunt-qr';
fs.rmSync(outDir, { recursive: true, force: true }); // start clean so removed objects don't leave stale codes
fs.mkdirSync(outDir, { recursive: true });

const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

for (const o of objects) {
	const url = `${baseUrl}/ic2s2?find=${signToken(o.id, secret)}`;
	await QRCode.toFile(path.join(outDir, `${o.id}.png`), url, { width: 600, margin: 2 });
}

const cards = objects
	.map(
		(o) => `
    <figure class="card">
      <img src="${o.id}.png" alt="QR for ${esc(o.name)}" />
      <figcaption>
        <div class="name">${esc(o.name)}</div>
        ${o.location ? `<div class="loc">${esc(o.location)}</div>` : ''}
        <div class="id">${esc(o.id)}</div>
      </figcaption>
    </figure>`
	)
	.join('');

fs.writeFileSync(
	path.join(outDir, 'index.html'),
	`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>IC2S2 Burlington Hunt — QR codes</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 1.5rem; color: #1a1a1a; }
    h1 { font-size: 1.4rem; }
    .base { color: #666; font-size: .85rem; margin-bottom: 1.5rem; }
    .sheet { display: grid; grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr)); gap: 1rem; }
    .card { margin: 0; border: 1px solid #ccc; border-radius: 8px; padding: 1rem; text-align: center; break-inside: avoid; }
    .card img { width: 100%; max-width: 15rem; height: auto; }
    .name { font-weight: 600; margin-top: .5rem; }
    .loc { color: #666; font-size: .85rem; }
    .id { font-family: monospace; color: #999; font-size: .8rem; }
    @media print { .base { display: none; } .card { border-color: #ddd; } }
  </style>
</head>
<body>
  <h1>Burlington Hunt — QR codes (${objects.length})</h1>
  <p class="base">Codes point at <code>${esc(baseUrl)}</code> — regenerate with the deployed URL before printing for real.</p>
  <div class="sheet">${cards}</div>
</body>
</html>
`
);

console.log(`Generated ${objects.length} QR codes in ${outDir}/ (base: ${baseUrl})`);
console.log(`Open ${outDir}/index.html to print, or share the individual .png files.`);
if (baseUrl !== PROD_URL) {
	console.log(`NOTE: not production. Run 'npm run gen:qr' (no args) for print-ready codes at ${PROD_URL}.`);
}
