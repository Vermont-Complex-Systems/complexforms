import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { env } from '$env/dynamic/private';
import * as schema from './schema';

// The IC2S2 story's own local SQLite DB. Server-only (better-sqlite3). The path
// can be overridden in prod (PM2/.env) via IC2S2_DB_URL, mirroring how the
// survey stories override DATABASE_URL.
const path = env.IC2S2_DB_URL || 'src/lib/stories/ic2s2/data/ic2s2.db';

export const db = drizzle(new Database(path), { schema });
