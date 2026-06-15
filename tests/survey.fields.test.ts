import { describe, it, expect } from 'vitest';
import { processValue, isValidField } from '../src/lib/stories/survey-story-1/data/survey.fields';

describe('processValue', () => {
	it('joins platformMatters array into a comma string', () => {
		expect(processValue('platformMatters', ['Twitter', 'TikTok'])).toBe('Twitter,TikTok');
	});
	it('keeps socialMediaPrivacy as text', () => {
		expect(processValue('socialMediaPrivacy', 'private')).toBe('private');
	});
	it('keeps age as text (does NOT parseInt)', () => {
		expect(processValue('age', '18-24')).toBe('18-24');
	});
	it('coerces relativePreferences to int', () => {
		expect(processValue('relativePreferences', '5')).toBe(5);
	});
	it('coerces genderOrd to int', () => {
		expect(processValue('genderOrd', '2')).toBe(2);
	});
	it('maps consent to 1', () => {
		expect(processValue('consent', 'accepted')).toBe(1);
	});
});

describe('isValidField', () => {
	it('accepts a known field', () => expect(isValidField('age')).toBe(true));
	it('rejects an unknown field', () => expect(isValidField('nope')).toBe(false));
});
