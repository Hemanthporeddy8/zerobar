import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL || '';
const authToken = process.env.TURSO_AUTH_TOKEN || '';

export const isTursoConfigured = Boolean(url && authToken);

let tursoClient = null;

if (isTursoConfigured) {
  try {
    tursoClient = createClient({
      url,
      authToken
    });
  } catch (err) {
    console.warn('Failed to initialize Turso client:', err);
  }
}

export const turso = tursoClient;

/**
 * Execute a SQL query on Turso with parameters.
 * Returns { rows: [...], columns: [...], error: null }
 */
export async function executeQuery(sql, args = []) {
  if (!turso) {
    return { rows: [], columns: [], error: new Error('Turso is not configured') };
  }

  try {
    const result = await turso.execute({ sql, args });
    return { rows: result.rows, columns: result.columns, error: null };
  } catch (err) {
    console.error('Turso Query Error:', err);
    return { rows: [], columns: [], error: err };
  }
}
