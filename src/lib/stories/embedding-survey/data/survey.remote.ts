import { defineSurvey } from '$lib/server/survey';
import { EmbeddingSurvey } from './schema';

const survey = defineSurvey({
	table: EmbeddingSurvey,
	dbPath: 'src/lib/stories/embedding-survey/data/survey.db',
	envKey: 'EMBEDDING_SURVEY_DB_URL'
});

// Remote functions must be exported from a .remote.ts file — this re-export
// is the whole reason this file exists.
export const saveAnswer = survey.saveAnswer;
export const getSurveyResponse = survey.getSurveyResponse;
