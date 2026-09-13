import { env } from '$env/dynamic/private';

// ONE continuous best-of voting window for the whole conference, US/Eastern
// (Burlington): opens Wed Jul 29 4:00 PM ET, closes Fri Jul 31 4:45 PM ET
// (open overnight in between). Attendees star as many favorites as they like
// (one vote per item) across any day's program and can change them until the
// window closes.
const OPENS = { date: '2026-07-29', minutes: 16 * 60 }; // Wed 4:00 PM
const CLOSES = { date: '2026-07-31', minutes: 16 * 60 + 45 }; // Fri 4:45 PM

// The window is ENFORCED by default (prod). Set IC2S2_VOTING_ALWAYS_OPEN=1 to
// bypass the schedule while testing locally.
const alwaysOpen = () => env.IC2S2_VOTING_ALWAYS_OPEN === '1';

// Current wall-clock in US/Eastern as { date: 'YYYY-MM-DD', minutes: since midnight }.
function nowEastern(): { date: string; minutes: number } {
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone: 'America/New_York',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		hour12: false
	}).formatToParts(new Date());
	const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
	const hour = get('hour') === '24' ? '00' : get('hour'); // some runtimes emit '24' at midnight
	return {
		date: `${get('year')}-${get('month')}-${get('day')}`,
		minutes: Number(hour) * 60 + Number(get('minute'))
	};
}

// ISO dates compare lexicographically, so { date, minutes } tuples compare directly.
const before = (a: { date: string; minutes: number }, b: { date: string; minutes: number }) =>
	a.date < b.date || (a.date === b.date && a.minutes < b.minutes);

export function isVotingOpen(): boolean {
	if (alwaysOpen()) return true;
	const now = nowEastern();
	return !before(now, OPENS) && before(now, CLOSES);
}

export function votingStatus(): { open: boolean; label: string } {
	if (alwaysOpen()) return { open: true, label: 'Voting open' };
	const now = nowEastern();
	if (before(now, OPENS)) return { open: false, label: 'Voting opens Wed 4:00 PM ET' };
	if (before(now, CLOSES)) return { open: true, label: 'Voting open until Fri 4:45 PM ET' };
	return { open: false, label: 'Voting is closed' };
}
