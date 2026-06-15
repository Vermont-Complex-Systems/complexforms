import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

// Plain filesystem path (better-sqlite3 does not understand file: URLs).
const path = env.DATABASE_URL ?? 'src/lib/stories/survey-story-1/data/survey.db';

const sqlite = new Database(path);
export const db = drizzle(sqlite, { schema });
