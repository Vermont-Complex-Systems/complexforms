import FingerprintJS, { type Agent } from '@fingerprintjs/fingerprintjs';
import { browser } from '$app/environment';

let fpPromise: Promise<Agent> | null = null;

/** Generate a stable browser fingerprint. Returns '' during SSR. */
export async function generateFingerprint() {
	if (!browser) return '';

	if (!fpPromise) {
		fpPromise = FingerprintJS.load();
	}

	try {
		const fp = await fpPromise;
		const result = await fp.get();
		return result.visitorId;
	} catch (error) {
		console.error('Error generating fingerprint:', error);
		return getFallbackFingerprint();
	}
}

/** Fallback fingerprint using basic browser characteristics. */
function getFallbackFingerprint() {
	const data = {
		userAgent: navigator.userAgent,
		language: navigator.language,
		screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
	};

	const str = JSON.stringify(data);
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	return `fallback-${Math.abs(hash).toString(36)}`;
}
