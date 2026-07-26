import { env } from '$env/dynamic/private';

// Per-day best-of voting windows, US/Eastern (Burlington). Minutes since midnight.
//   Wed Jul 29 & Thu Jul 30 : 4:00–6:00 PM ET
//   Fri Jul 31              : 3:45–4:45 PM ET
const WINDOWS: Record<string, { open: number; close: number }> = {
	'2026-07-29': { open: 16 * 60, close: 18 * 60 },
	'2026-07-30': { open: 16 * 60, close: 18 * 60 },
	'2026-07-31': { open: 15 * 60 + 45, close: 16 * 60 + 45 }
};

// The program days (also the valid vote days), in order.
export const CONF_DAYS = Object.keys(WINDOWS);

// The windows are ENFORCED by default (prod). Set IC2S2_VOTING_ALWAYS_OPEN=1 to
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

// 960 -> "4:00 PM", 945 -> "3:45 PM".
function clockLabel(min: number): string {
	const ampm = min >= 720 ? 'PM' : 'AM';
	const h12 = ((Math.floor(min / 60) + 11) % 12) + 1;
	return `${h12}:${String(min % 60).padStart(2, '0')} ${ampm}`;
}

export function isVotingOpen(day: string | null): boolean {
	if (alwaysOpen()) return true;
	const w = day ? WINDOWS[day] : undefined;
	if (!day || !w) return false;
	const { date, minutes } = nowEastern();
	return date === day && minutes >= w.open && minutes < w.close;
}

export function votingStatus(day: string | null): { open: boolean; label: string } {
	if (alwaysOpen()) return { open: true, label: 'Voting open' };
	const w = day ? WINDOWS[day] : undefined;
	if (!day || !w) return { open: false, label: 'Not scheduled' };
	const range = `${clockLabel(w.open)}–${clockLabel(w.close)} ET`;
	const { date, minutes } = nowEastern();
	if (date !== day) return { open: false, label: `Voting is ${range} on this day` };
	if (minutes < w.open) return { open: false, label: `Voting opens at ${clockLabel(w.open)} ET` };
	if (minutes >= w.close) return { open: false, label: 'Voting closed for today' };
	return { open: true, label: `Voting open until ${clockLabel(w.close)} ET` };
}
