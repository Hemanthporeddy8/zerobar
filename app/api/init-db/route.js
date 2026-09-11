import { NextResponse } from 'next/server';
import { turso, isTursoConfigured, executeQuery } from '../../../lib/turso';
import { TURSO_SCHEMA_STATEMENTS } from '../../../lib/tursoSchema';

export async function GET(request) {
  if (!isTursoConfigured || !turso) {
    return NextResponse.json({
      success: false,
      error: 'Turso environment variables not set',
      help: 'Please add TURSO_DATABASE_URL and TURSO_AUTH_TOKEN to your environment variables.'
    }, { status: 400 });
  }

  const results = [];

  for (const statement of TURSO_SCHEMA_STATEMENTS) {
    const { error } = await executeQuery(statement);
    if (error) {
      return NextResponse.json({
        success: false,
        error: `Failed to execute: ${statement.slice(0, 50)}...`,
        detail: error.message
      }, { status: 500 });
    }
    results.push(statement.slice(0, 40).replace(/\s+/g, ' ').trim());
  }

  // Check if we need to insert initial demo seed user
  await executeQuery(
    `INSERT OR IGNORE INTO users (id, username, email, avatar_emoji, bio)
     VALUES (?, ?, ?, ?, ?)`,
    ['user-pagegg-demo', 'hemanth', 'demo@pagegg.com', '⚡', 'Building low-bandwidth webapps']
  );

  return NextResponse.json({
    success: true,
    message: 'PageGG database initialized successfully on Turso (9 GB Free)!',
    executed: results
  });
}
