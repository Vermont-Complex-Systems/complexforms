// Opaque, forgery-resistant QR tokens for the hunt. A token is
// base64url(`${objectId}.${hmac(objectId)}`), so the printed QR looks like a
// hash rather than an obviously-shareable `?object=foo` link, and nobody can
// mint a token for an object without the secret. It is NOT unshareable (the
// scanned URL still works if texted) — just not obviously so.
//
// Shared by the server (recordFind, via $lib) and scripts/gen-qr.mjs, so it's
// plain ESM .js. Both must pass the SAME secret — we use BETTER_AUTH_SECRET, so
// codes generated with a given secret only verify against a deployment using it.

import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * @param {string} objectId
 * @param {string} secret
 * @returns {string}
 */
function sig(objectId, secret) {
	return createHmac('sha256', secret).update(objectId).digest('base64url').slice(0, 18);
}

/**
 * Sign an object id into an opaque QR token.
 * @param {string} objectId
 * @param {string} secret
 * @returns {string}
 */
export function signToken(objectId, secret) {
	return Buffer.from(`${objectId}.${sig(objectId, secret)}`).toString('base64url');
}

/**
 * Verify a QR token and return its object id, or null if invalid/tampered.
 * @param {string} token
 * @param {string} secret
 * @returns {string | null}
 */
export function verifyToken(token, secret) {
	try {
		const payload = Buffer.from(token, 'base64url').toString('utf8');
		const i = payload.lastIndexOf('.');
		if (i < 0) return null;
		const objectId = payload.slice(0, i);
		const want = Buffer.from(sig(objectId, secret));
		const got = Buffer.from(payload.slice(i + 1));
		if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
		return objectId;
	} catch {
		return null;
	}
}
