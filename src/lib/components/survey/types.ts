export type SurveyOption = { value: string; label: string; description?: string };

export const QUESTION_TYPES = ['radio', 'checkbox', 'select', 'text'] as const;
export type SurveyQuestionType = (typeof QUESTION_TYPES)[number];

// One copy.json item per question. `value` for a checkbox question is a
// string[]; every other type binds a single string.
export type SurveyQuestionItem = {
	type: SurveyQuestionType;
	value: {
		question: string;
		name: string;
		options?: SurveyOption[];
		placeholder?: string;
	};
};

export function isQuestionItem(item: { type: string }): item is SurveyQuestionItem {
	return (QUESTION_TYPES as readonly string[]).includes(item.type);
}

// Field names are plain strings here; each story validates them server-side
// against its own table (defineSurvey), so shared components stay generic.
export type SaveAnswer = (field: string, value: string | number | string[]) => Promise<unknown>;

export type SurveyAnswers = Record<string, string | string[] | undefined>;
