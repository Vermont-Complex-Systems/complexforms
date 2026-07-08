import { describe, it, expect } from 'vitest';
import { makeCoercer, surveyFields } from '../src/lib/server/survey.core';
import { darkDataSurvey } from '../src/lib/stories/survey-story-1/data/schema';

// Exercise the derivation against the real story schema, mirroring the
// defineSurvey call in survey-story-1's survey.remote.ts.
const coerce = makeCoercer(darkDataSurvey, { consent: () => 1 });

describe('coercion derived from the survey schema', () => {
	it('joins checkbox arrays into a comma string', () => {
		expect(coerce('platformMatters', ['Twitter', 'TikTok'])).toBe('Twitter,TikTok');
	});
	it('keeps socialMediaPrivacy as text', () => {
		expect(coerce('socialMediaPrivacy', 'private')).toBe('private');
	});
	it('keeps age as text (does NOT parseInt)', () => {
		expect(coerce('age', '18-24')).toBe('18-24');
	});
	it('coerces relativePreferences to int', () => {
		expect(coerce('relativePreferences', '5')).toBe(5);
	});
	it('coerces genderOrd to int', () => {
		expect(coerce('genderOrd', '2')).toBe(2);
	});
	it('applies the per-field override: consent maps to 1', () => {
		expect(coerce('consent', 'accepted')).toBe(1);
	});
});

describe('fields derived from the survey schema', () => {
	const fields = surveyFields(darkDataSurvey);

	it('includes every answer column', () => {
		expect(fields).toEqual(
			expect.arrayContaining([
				'consent',
				'socialMediaPrivacy',
				'platformMatters',
				'relativePreferences',
				'age',
				'genderOrd',
				'orientationOrd',
				'raceOrd'
			])
		);
	});
	it('excludes the reserved columns', () => {
		expect(fields).not.toContain('id');
		expect(fields).not.toContain('fingerprint');
		expect(fields).not.toContain('createdAt');
	});
});
