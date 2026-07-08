import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	dialect: 'sqlite',
	schema: './src/lib/stories/embedding-survey/data/schema.ts',
	out: './drizzle/embedding-survey',
	dbCredentials: { url: 'src/lib/stories/embedding-survey/data/survey.db' }
});
