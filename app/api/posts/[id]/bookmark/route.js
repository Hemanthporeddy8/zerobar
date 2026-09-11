import { NextResponse } from 'next/server';
import { isTursoConfigured, executeQuery } from '../../../../../lib/turso';

export async function POST(request, { params }) {
  if (!isTursoConfigured) {
    return NextResponse.json({ configured: false });
  }

  const postId = params.id;
  try {
    const { user_id = 'user-pagegg-demo' } = await request.json();

    const checkSql = `SELECT post_id FROM bookmarks WHERE user_id = ? AND post_id = ?`;
    const { rows } = await executeQuery(checkSql, [user_id, postId]);

    if (rows && rows.length > 0) {
      await executeQuery(`DELETE FROM bookmarks WHERE user_id = ? AND post_id = ?`, [user_id, postId]);
      return NextResponse.json({ bookmarked: false });
    } else {
      await executeQuery(
        `INSERT INTO bookmarks (user_id, post_id, created_at) VALUES (?, ?, ?)`,
        [user_id, postId, new Date().toISOString()]
      );
      return NextResponse.json({ bookmarked: true });
    }
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
