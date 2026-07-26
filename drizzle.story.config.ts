import { existsSync } from 'node:fs';
import { defineConfig } from 'drizzle-kit';

// One config for every self-contained (tier-3) story DB — they all follow the
// same convention: src/lib/stories/<slug>/data/{schema.ts,survey.db}.
//
//   STORY=<slug> npm run db:push:story
//
// (drizzle.config.ts stays separate: it is the shared app DB, data/app.db.)
const story = process.env.STORY;
if (!story) {
	throw new Error('Set the story slug: STORY=<slug> npm run db:push:story');
}

const dir = `./src/lib/stories/${story}/data`;
if (!existsSync(`${dir}/schema.ts`)) {
	throw new Error(`No schema at ${dir}/schema.ts — is "${story}" a story with its own DB?`);
}

// Story DBs default to survey.db; non-survey stories (e.g. ic2s2) pass DB_NAME:
//   STORY=ic2s2 DB_NAME=ic2s2.db npm run db:push:story
const dbName = process.env.DB_NAME ?? 'survey.db';

export default defineConfig({
	dialect: 'sqlite',
	schema: `${dir}/schema.ts`,
	out: `./drizzle/${story}`,
	dbCredentials: { url: `${dir.slice(2)}/${dbName}` }
});
