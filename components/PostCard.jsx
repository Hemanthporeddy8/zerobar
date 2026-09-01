'use client';

import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthProvider';
import { queueOfflineAction } from '../lib/offlineStorage';

export default function PostCard({ post, bookmarked, following, onChange, showFollow = true }) {
  const { user } = useAuth();

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  async function toggleBookmark() {
    if (!user) return;
    if (!isOnline) {
      queueOfflineAction({
        type: 'TOGGLE_BOOKMARK',
        payload: { user_id: user.id, post_id: post.id, bookmarked: !bookmarked }
      });
      onChange && onChange();
      return;
    }

    try {
      if (bookmarked) {
        await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('post_id', post.id);
      } else {
        await supabase.from('bookmarks').insert({ user_id: user.id, post_id: post.id });
      }
    } catch {
      queueOfflineAction({
        type: 'TOGGLE_BOOKMARK',
        payload: { user_id: user.id, post_id: post.id, bookmarked: !bookmarked }
      });
    }
    onChange && onChange();
  }

  async function toggleFollow() {
    if (!user || user.id === post.user_id) return;
    if (!isOnline) {
      queueOfflineAction({
        type: 'TOGGLE_FOLLOW',
        payload: { follower_id: user.id, following_id: post.user_id, following: !following }
      });
      onChange && onChange();
      return;
    }

    try {
      if (following) {
        await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', post.user_id);
      } else {
        await supabase.from('follows').insert({ follower_id: user.id, following_id: post.user_id });
      }
    } catch {
      queueOfflineAction({
        type: 'TOGGLE_FOLLOW',
        payload: { follower_id: user.id, following_id: post.user_id, following: !following }
      });
    }
    onChange && onChange();
  }

  async function repost() {
    if (!user) return;
    const repostPayload = {
      user_id: user.id,
      category: post.category,
      kind: post.kind,
      title: post.title,
      media_emoji: post.media_emoji,
      is_repost: true,
      repost_of: post.is_repost ? post.repost_of : post.id,
      source_name: post.profiles?.username || post.source_name || null,
      authorProfile: { username: user.user_metadata?.username || user.email?.split('@')[0] || 'You', avatar_emoji: '⚡' }
    };

    if (!isOnline) {
      queueOfflineAction({
        type: 'REPOST',
        payload: repostPayload
      });
      window.alert('Saved to Offline Outbox! Will publish when signal returns.');
      onChange && onChange();
      return;
    }

    try {
      await supabase.from('posts').insert({
        user_id: user.id,
        category: post.category,
        kind: post.kind,
        title: post.title,
        media_emoji: post.media_emoji,
        is_repost: true,
        repost_of: post.is_repost ? post.repost_of : post.id,
        source_name: post.profiles?.username || post.source_name || null
      });
    } catch {
      queueOfflineAction({
        type: 'REPOST',
        payload: repostPayload
      });
      window.alert('Saved to Offline Outbox! Will publish when signal returns.');
    }
    onChange && onChange();
  }

  async function report() {
    const reason = window.prompt('What is wrong with this post? (short reason)');
    if (!reason || !user) return;

    if (!isOnline) {
      queueOfflineAction({
        type: 'REPORT',
        payload: { post_id: post.id, reporter_id: user.id, reason }
      });
      window.alert('Saved report offline. Will submit when reconnected.');
      return;
    }

    try {
      await supabase.from('reports').insert({ post_id: post.id, reporter_id: user.id, reason });
      window.alert('Thanks — this has been reported for review.');
    } catch {
      queueOfflineAction({
        type: 'REPORT',
        payload: { post_id: post.id, reporter_id: user.id, reason }
      });
      window.alert('Saved report offline. Will submit when reconnected.');
    }
  }

  const authorName = post.profiles?.username || post.source_name || 'Unknown';
  const authorEmoji = post.profiles?.avatar_emoji || '🧑';
  const isOwn = user && user.id === post.user_id;

  const isImage =
    Boolean(post.media_url) ||
    (typeof post.media_emoji === 'string' &&
      (post.media_emoji.startsWith('data:image') ||
        post.media_emoji.startsWith('http') ||
        post.media_emoji.startsWith('/')));

  const mediaSrc = post.media_url || post.media_emoji;

  return (
    <div className="card">
      <div className="card-media" style={isImage ? { height: 190, background: '#090B14' } : {}}>
        <div style={{ position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 3 }}>
          <span className="kind">{post.kind}</span>
          <span style={{ fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", background: 'rgba(9,11,20,0.8)', backdropFilter: 'blur(8px)', color: 'var(--brand-gold)', padding: '3px 8px', borderRadius: 6, border: '1px solid var(--border-subtle)', fontWeight: 600, textTransform: 'uppercase' }}>
            {post.category || 'Trending'}
          </span>
        </div>

        {isImage ? (
          <img
            src={mediaSrc}
            alt={post.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
          />
        ) : (
          <span style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}>
            {post.media_emoji || '⚡'}
          </span>
        )}
      </div>

      <div className="card-body">
        <div className="author-row">
          <span className="a-avatar">{authorEmoji}</span>
          <div className="a-name">
            <span>{authorName}</span>
            {post._isOptimistic && (
              <span style={{ color: 'var(--brand-amber)', fontSize: 10.5, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500 }}>
                [Offline Outbox]
              </span>
            )}
          </div>
          {showFollow && !isOwn && (
            <button className={`follow-btn ${following ? 'following' : ''}`} onClick={toggleFollow}>
              {following ? 'Following' : '+ Follow'}
            </button>
          )}
        </div>

        <p className="card-title">{post.title}</p>

        <div className="card-meta">
          <span className="src">
            {post.is_repost ? '🔁 Reposted' : new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>

          <div className="meta-actions">
            {!isOwn && (
              <button className="icon-btn" onClick={report} title="Report post">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" x2="4" y1="22" y2="15" />
                </svg>
              </button>
            )}

            <button className="icon-btn" onClick={repost} title="Repost to feed">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m17 2 4 4-4 4" />
                <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
                <path d="m7 22-4-4 4-4" />
                <path d="M21 13v1a4 4 0 0 1-4 4H3" />
              </svg>
            </button>

            <button className={`dl-btn ${bookmarked ? 'saved' : ''}`} onClick={toggleBookmark}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
              </svg>
              {bookmarked ? 'Saved' : 'Bookmark'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

