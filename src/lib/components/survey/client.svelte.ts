import { browser } from '$app/environment';
import { isQuestionItem } from './types';

// The two remote functions every survey story exposes (see
// $lib/server/survey.ts). Typed loosely: remote queries are PromiseLike.
// (`fingerprint` is the wire/DB name for the visitor ID, whatever mode mints it.)
export type SurveyRemote = {
	saveAnswer: (data: {
		fingerprint: string;
		field: string;
		value: string | number | string[];
	}) => PromiseLike<unknown>;
	getSurveyResponse: (fingerprint: string) => PromiseLike<Record<string, unknown> | null>;
};

/**
 * How a visitor is recognized across answers:
 *
 * - 'local' (default) — a random ID minted on the visitor's FIRST answer and
 *   kept in localStorage. Nothing is probed or stored before they participate,
 *   the ID identifies nothing beyond this survey, and clearing site data
 *   forgets them. Dedup is browser-deep only.
 * - 'fingerprint' — a device fingerprint computed on load (strong dedup,
 *   recognizes returning visitors across storage clears). This reads device
 *   characteristics, so in consent-gated stories pair it with the gate — and
 *   for EU-facing studies it requires prior consent (ePrivacy Art. 5(3)).
 * - 'session' — an in-memory ID; correlates the answers of one visit, nothing
 *   is ever stored on the device, every reload is a fresh respondent.
 */
export type SurveyIdentity = 'local' | 'fingerprint' | 'session';

export type SurveyClientOptions = {
	/** The copy.json survey items. Question items seed `answers` (so bindings
	 *  never see `undefined`) and mark checkbox fields, whose stored
	 *  comma-joined strings hydrate back as string[]. Prose items are ignored,
	 *  so passing the whole survey section is fine. */
	questions?: Array<{ type: string }>;
	identity?: SurveyIdentity;
	/** localStorage key for 'local' mode; defaults to one scoped to the page path. */
	storageKey?: string;
};

// Owns the per-visitor plumbing of a survey story: visitor identity, loading a
// previous response, hydrating bindable answers, and saving. It starts itself
// in the browser — there is nothing to call from the story; saveAnswer waits
// for that startup, so an early answer is never dropped.
export function createSurveyClient(remote: SurveyRemote, options: SurveyClientOptions = {}) {
	const identity: SurveyIdentity = options.identity ?? 'local';

	let visitorId = $state('');
	let loading = $state(true);
	let response = $state<Record<string, unknown> | null>(null);
	let answers: Record<string, string | string[] | undefined> = $state({});

	const questions = (options.questions ?? []).filter(isQuestionItem);
	const arrayFields = new Set(
		questions.filter((q) => q.type === 'checkbox').map((q) => q.value.name)
	);
	for (const q of questions) {
		answers[q.value.name] = q.type === 'checkbox' ? [] : '';
	}

	function storageKey() {
		return options.storageKey ?? `survey-id:${location.pathname}`;
	}

	// localStorage can be unavailable (privacy modes); degrade to 'session'.
	function readStoredId(): string {
		try {
			return localStorage.getItem(storageKey()) ?? '';
		} catch {
			return '';
		}
	}

	function mintId(): string {
		const id = crypto.randomUUID();
		if (identity === 'local') {
			try {
				localStorage.setItem(storageKey(), id);
			} catch {
				// fall through: behaves like 'session' for this visit
			}
		}
		return id;
	}

	async function init() {
		try {
			if (identity === 'fingerprint') {
				// Dynamic import: FingerprintJS is only fetched in this mode.
				const { generateFingerprint } = await import('$lib/utils/browserFingerprint.js');
				visitorId = await generateFingerprint();
			} else if (identity === 'local') {
				// Only an ID a previous answer already minted — never create here.
				visitorId = readStoredId();
			}
			if (visitorId) {
				response = await remote.getSurveyResponse(visitorId);
			}
			if (response) {
				// Hydrate every stored answer (also fields outside `questions`,
				// e.g. demographics), so a returning visitor sees what they saved.
				// Only into still-empty fields: an answer given while this loads
				// must not be visually clobbered by its stored predecessor.
				for (const [field, stored] of Object.entries(response)) {
					if (field === 'id' || field === 'fingerprint' || field === 'createdAt') continue;
					if (stored == null || stored === '') continue;
					const current = answers[field];
					const untouched =
						current === undefined || current === '' || (Array.isArray(current) && !current.length);
					if (!untouched) continue;
					answers[field] = arrayFields.has(field) ? String(stored).split(',') : String(stored);
				}
			}
		} catch (err) {
			console.error('Failed to load survey response:', err);
		} finally {
			loading = false;
		}
	}

	// Identity work needs the browser; during SSR the client stays inert.
	const ready = browser ? init() : null;

	async function saveAnswer(field: string, value: string | number | string[]): Promise<unknown> {
		await ready;
		// 'local' and 'session' mint the ID at the moment of the first answer —
		// participating is what creates an identity, not visiting.
		if (!visitorId && identity !== 'fingerprint') {
			visitorId = mintId();
		}
		if (!visitorId) {
			console.warn(`[survey] "${field}" not saved: no visitor ID (fingerprinting failed?)`);
			return;
		}
		return remote.saveAnswer({ fingerprint: visitorId, field, value });
	}

	return {
		get visitorId() {
			return visitorId;
		},
		get loading() {
			return loading;
		},
		/** The previously saved row, if any — e.g. `!!client.response?.consent`. */
		get response() {
			return response;
		},
		// Accessor pair so `bind:answers={survey.answers}` binds to reactive state.
		get answers() {
			return answers;
		},
		set answers(v) {
			answers = v;
		},
		saveAnswer
	};
}
