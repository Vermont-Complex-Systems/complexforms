import { getTableColumns } from 'drizzle-orm';
import type { SQLiteColumn, SQLiteTable } from 'drizzle-orm/sqlite-core';

// Pure derivation logic for defineSurvey, kept free of SvelteKit imports
// ($app/server, $env) so vitest can unit-test it directly.

// Columns every survey table has; everything else is a saveable answer field.
export const RESERVED = new Set(['id', 'fingerprint', 'createdAt']);

export type Coerce = Record<string, (value: string | number | string[]) => string | number>;

export function surveyColumns(table: SQLiteTable): Record<string, SQLiteColumn> {
	return getTableColumns(table) as Record<string, SQLiteColumn>;
}

export function surveyFields(table: SQLiteTable): string[] {
	return Object.keys(surveyColumns(table)).filter((name) => !RESERVED.has(name));
}

// How a submitted value becomes the stored value: the per-field override if
// given, else derived from the column — checkbox arrays are comma-joined, and
// integer columns parse the strings that radio/select inputs produce.
export function makeCoercer(table: SQLiteTable, coerce: Coerce = {}) {
	const columns = surveyColumns(table);
	return function coerceValue(field: string, value: string | number | string[]): string | number {
		const custom = coerce[field];
		if (custom) return custom(value);
		if (Array.isArray(value)) return value.join(',');
		if (columns[field].dataType === 'number' && typeof value === 'string') {
			return parseInt(value, 10);
		}
		return value;
	};
}
