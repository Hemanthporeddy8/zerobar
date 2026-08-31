'use client';

import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthProvider';

export default function PostCard({ post, bookmarked, following, onChange, showFollow = true }) {
  const { user } = useAuth();

  async function toggleBookmark() {
    if (!user) return;
    if (bookmarked) {
      await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('post_id', post.id);
    } else {
      await supabase.from('bookmarks').insert({ user_id: user.id, post_id: post.id });
    }
    onChange && onChange();
  }

  async function toggleFollow() {
    if (!user || user.id === post.user_id) return;
    if (following) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', post.user_id);
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: post.user_id });
    }
    onChange && onChange();
  }

  async function repost() {
    if (!user) return;
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
    onChange && onChange();
  }

  async function report() {
    const reason = window.prompt('What is wrong with this post? (short reason)');
    if (!reason || !user) return;
    await supabase.from('reports').insert({ post_id: post.id, reporter_id: user.id, reason });
    window.alert('Thanks — this has been reported for review.');
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
          <span className="a-name">{authorName}</span>
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
