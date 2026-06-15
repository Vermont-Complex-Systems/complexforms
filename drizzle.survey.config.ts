import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	dialect: 'sqlite',
	schema: './src/lib/stories/survey-story-1/data/schema.ts',
	out: './drizzle/survey',
	dbCredentials: { url: 'src/lib/stories/survey-story-1/data/survey.db' }
});
