import { NextResponse } from 'next/server';
import { isTursoConfigured, executeQuery } from '../../../../../lib/turso';

export async function POST(request, { params }) {
  if (!isTursoConfigured) {
    return NextResponse.json({ configured: false });
  }

  const postId = params.id;
  try {
    const { user_id = 'user-pagegg-demo', reaction_type = 'like' } = await request.json();
    const id = `react-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    // Check if already reacted
    const checkSql = `SELECT id FROM post_reactions WHERE post_id = ? AND user_id = ? AND reaction_type = ?`;
    const { rows } = await executeQuery(checkSql, [postId, user_id, reaction_type]);

    if (rows && rows.length > 0) {
      // Toggle off (delete)
      await executeQuery(`DELETE FROM post_reactions WHERE id = ?`, [rows[0].id]);
      return NextResponse.json({ reacted: false });
    } else {
      // Insert reaction
      await executeQuery(
        `INSERT INTO post_reactions (id, post_id, user_id, reaction_type) VALUES (?, ?, ?, ?)`,
        [id, postId, user_id, reaction_type]
      );
      return NextResponse.json({ reacted: true });
    }
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
