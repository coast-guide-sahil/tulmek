import { drizzle } from "drizzle-orm/libsql";
import type { LibSQLDatabase } from "drizzle-orm/libsql";

/**
 * Lazy DB singleton — connects on first query, not on import.
 * This allows the build to succeed without DB credentials (e.g., preview deploys
 * with NEXT_PUBLIC_SKIP_AUTH=true).
 *
 * Uses globalThis to survive Next.js hot-reload in development.
 */
const globalForDb = globalThis as unknown as { _db?: LibSQLDatabase };

function getDb(): LibSQLDatabase {
  if (!globalForDb._db) {
    globalForDb._db = drizzle({
      connection: {
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!,
      },
    });
  }
  return globalForDb._db;
}

/** Lazy DB proxy — no connection until first property access */
export const db: LibSQLDatabase = new Proxy({} as LibSQLDatabase, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});
