import { NextResponse } from 'next/server';
import { isTursoConfigured, executeQuery } from '../../../lib/turso';

export async function GET(request) {
  if (!isTursoConfigured) {
    return NextResponse.json({
      configured: false,
      posts: []
    });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const tag = searchParams.get('tag');
  const limit = Math.min(parseInt(searchParams.get('limit') || '60', 10), 100);

  let sql = `
    SELECT 
      p.*,
      u.username,
      u.avatar_emoji,
      (SELECT COUNT(*) FROM post_reactions pr WHERE pr.post_id = p.id AND pr.reaction_type = 'like') as reaction_count
    FROM posts p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE 1=1
  `;
  const args = [];

  if (category && category !== 'All') {
    sql += ` AND p.category = ?`;
    args.push(category);
  }

  if (tag) {
    sql += ` AND (p.title LIKE ? OR p.title LIKE ?)`;
    args.push(`%#${tag}%`, `%${tag}%`);
  }

  sql += ` ORDER BY p.created_at DESC LIMIT ?`;
  args.push(limit);

  const { rows, error } = await executeQuery(sql, args);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Format into PostCard shape
  const formattedPosts = (rows || []).map((r) => ({
    id: r.id,
    user_id: r.user_id,
    category: r.category || 'Trending',
    kind: r.kind || 'Post',
    title: r.title,
    media_emoji: r.media_emoji || '✍️',
    location: r.location || null,
    is_repost: Boolean(r.is_repost),
    repost_of: r.repost_of || null,
    source_name: r.source_name || null,
    source_url: r.source_url || null,
    created_at: r.created_at,
    profiles: {
      username: r.username || 'anonymous',
      avatar_emoji: r.avatar_emoji || '⚡'
    },
    reaction_count: Number(r.reaction_count || 0)
  }));

  return NextResponse.json({
    configured: true,
    posts: formattedPosts
  });
}

export async function POST(request) {
  if (!isTursoConfigured) {
    return NextResponse.json({
      configured: false,
      error: 'Turso database is not configured yet.'
    }, { status: 503 });
  }

  try {
    const body = await request.json();
    const {
      user_id = 'user-pagegg-demo',
      title,
      category = 'Trending',
      kind = 'Post',
      media_emoji = '✍️',
      location = null,
      source_name = null,
      source_url = null
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title / content is required' }, { status: 400 });
    }

    const postId = `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();

    const insertSql = `
      INSERT INTO posts (
        id, user_id, category, kind, title, media_emoji, location, source_name, source_url, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const { error } = await executeQuery(insertSql, [
      postId,
      user_id,
      category,
      kind,
      title.trim(),
      media_emoji,
      location,
      source_name,
      source_url,
      now
    ]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      post: {
        id: postId,
        user_id,
        category,
        kind,
        title: title.trim(),
        media_emoji,
        location,
        source_name,
        source_url,
        created_at: now
      }
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
