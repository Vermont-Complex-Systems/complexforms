import type { SurveyField } from '$lib/server/db/schema';

// type-only import above is erased at runtime, so vitest needs no $lib alias.

export const validFields: SurveyField[] = [
	'consent',
	'socialMediaPrivacy',
	'platformMatters',
	'relativePreferences',
	'age',
	'genderOrd',
	'orientationOrd',
	'raceOrd'
];

// Fields stored as integers in the DB.
const numericFields: SurveyField[] = [
	'relativePreferences',
	'genderOrd',
	'orientationOrd',
	'raceOrd'
];

export function isValidField(field: string): field is SurveyField {
	return (validFields as string[]).includes(field);
}

export function processValue(
	field: SurveyField,
	value: string | number | string[]
): string | number {
	if (field === 'platformMatters' && Array.isArray(value)) {
		return value.join(',');
	}
	if (field === 'consent') {
		return 1;
	}
	if (numericFields.includes(field) && typeof value === 'string') {
		return parseInt(value, 10);
	}
	return value as string | number;
}
