import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

// App-level DB (tier 2): auth + cross-cutting shared data.
// Hardcoded path on purpose — NOT DATABASE_URL, which the survey (tier 3) keeps.
const sqlite = new Database('data/app.db');
export const db = drizzle(sqlite, { schema });
