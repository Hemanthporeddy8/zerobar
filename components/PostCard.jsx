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

  return (
    <div className="card">
      <div className="card-media">
        <span className="kind">{post.kind}</span>
        {post.media_emoji || '📰'}
      </div>
      <div className="card-body">
        <div className="author-row">
          <span className="a-avatar">{authorEmoji}</span>
          <span className="a-name">
            {authorName} {post._isOptimistic && <span style={{ color: 'var(--amber)', fontSize: 10 }}>[Queued offline]</span>}
          </span>
          {showFollow && !isOwn && (
            <button className={`follow-btn ${following ? 'following' : ''}`} onClick={toggleFollow}>
              {following ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
        <p className="card-title">{post.title}</p>
        <div className="card-meta">
          <span className="src">
            {post.is_repost ? '🔁 Reposted' : new Date(post.created_at).toLocaleDateString()}
          </span>
          <div className="meta-actions">
            {!isOwn && (
              <button className="icon-btn" onClick={report} title="Report">
                🚩
              </button>
            )}
            <button className="icon-btn" onClick={repost} title="Repost">
              ♻
            </button>
            <button className={`dl-btn ${bookmarked ? 'saved' : ''}`} onClick={toggleBookmark}>
              {bookmarked ? '✓ Added' : '🔖 Add'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
