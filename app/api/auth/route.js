import { NextResponse } from 'next/server';
import { isTursoConfigured, executeQuery } from '../../../lib/turso';

export async function GET(request) {
  // Read session cookie if present
  const sessionCookie = request.cookies.get('pagegg_session')?.value;

  if (sessionCookie) {
    try {
      const user = JSON.parse(Buffer.from(sessionCookie, 'base64').toString('utf8'));
      return NextResponse.json({ user });
    } catch {
      // Invalid cookie
    }
  }

  // Default demo user for instant frictionless offline/online use
  return NextResponse.json({
    user: {
      id: 'user-pagegg-demo',
      email: 'demo@pagegg.com',
      user_metadata: {
        username: 'hemanth'
      }
    }
  });
}

export async function POST(request) {
  try {
    const { action, email, password, username } = await request.json();

    if (action === 'logout') {
      const response = NextResponse.json({ success: true, user: null });
      response.cookies.delete('pagegg_session');
      return response;
    }

    if (action === 'signup') {
      const cleanUsername = (username || email.split('@')[0]).toLowerCase().trim();
      const userId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const userObj = {
        id: userId,
        email,
        user_metadata: {
          username: cleanUsername
        }
      };

      if (isTursoConfigured) {
        await executeQuery(
          `INSERT OR REPLACE INTO users (id, username, email, avatar_emoji, bio)
           VALUES (?, ?, ?, ?, ?)`,
          [userId, cleanUsername, email, '⚡', 'New PageGG citizen']
        );
      }

      const response = NextResponse.json({ success: true, user: userObj });
      response.cookies.set('pagegg_session', Buffer.from(JSON.stringify(userObj)).toString('base64'), {
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        httpOnly: false,
        sameSite: 'lax'
      });
      return response;
    }

    if (action === 'login') {
      let userObj = {
        id: 'user-pagegg-demo',
        email,
        user_metadata: {
          username: email.split('@')[0]
        }
      };

      if (isTursoConfigured) {
        const { rows } = await executeQuery(
          `SELECT id, username, email, avatar_emoji, bio FROM users WHERE email = ? LIMIT 1`,
          [email]
        );
        if (rows && rows.length > 0) {
          const r = rows[0];
          userObj = {
            id: r.id,
            email: r.email,
            user_metadata: {
              username: r.username,
              avatar_emoji: r.avatar_emoji
            }
          };
        }
      }

      const response = NextResponse.json({ success: true, user: userObj });
      response.cookies.set('pagegg_session', Buffer.from(JSON.stringify(userObj)).toString('base64'), {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        httpOnly: false,
        sameSite: 'lax'
      });
      return response;
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
