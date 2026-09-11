import { mockSupabase } from './mockClient';
import { getOfflineStash, saveOfflineStash, queueOfflineAction } from './offlineStorage';

export async function apiGetPosts({ category = 'All', tag = null, limit = 60 } = {}) {
  try {
    const params = new URLSearchParams();
    if (category && category !== 'All') params.set('category', category);
    if (tag) params.set('tag', tag);
    params.set('limit', String(limit));

    const res = await fetch(`/api/posts?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data.configured && Array.isArray(data.posts) && data.posts.length > 0) {
        return { posts: data.posts, source: 'turso' };
      }
    }
  } catch (err) {
    console.warn('apiGetPosts network error, checking offline/mock:', err);
  }

  // Fallback to mockSupabase / offline stash
  const { data } = await mockSupabase
    .from('posts')
    .select('*, profiles:user_id ( username, avatar_emoji )')
    .order('created_at', { ascending: false })
    .limit(limit);

  return { posts: data || [], source: 'mock' };
}

export async function apiCreatePost(postPayload) {
  try {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postPayload)
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.post) {
        return { post: data.post, error: null };
      }
    }
  } catch (err) {
    console.warn('apiCreatePost network error:', err);
  }

  // If offline or not configured, queue offline and insert to mock
  try {
    queueOfflineAction({
      type: 'CREATE_POST',
      payload: postPayload
    });

    const { data, error } = await mockSupabase.from('posts').insert(postPayload);
    return { post: data, error };
  } catch (err) {
    return { post: null, error: err };
  }
}

export async function apiToggleReaction(postId, userId, reactionType = 'like') {
  try {
    const res = await fetch(`/api/posts/${postId}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, reaction_type: reactionType })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Reaction error:', err);
  }
  return { reacted: true };
}

export async function apiToggleBookmark(postId, userId) {
  try {
    const res = await fetch(`/api/posts/${postId}/bookmark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Bookmark error:', err);
  }
  return { bookmarked: true };
}

export async function apiGetAuthUser() {
  try {
    const res = await fetch('/api/auth');
    if (res.ok) {
      const data = await res.json();
      return data.user;
    }
  } catch {
    // fallback
  }
  return {
    id: 'user-pagegg-demo',
    email: 'demo@pagegg.com',
    user_metadata: { username: 'hemanth' }
  };
}

export async function apiAuthLogin(email, password) {
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'login', email, password })
  });
  return res.json();
}

export async function apiAuthSignup(email, password, username) {
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'signup', email, password, username })
  });
  return res.json();
}

export async function apiAuthLogout() {
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'logout' })
  });
  return res.json();
}
