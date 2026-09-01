'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthProvider';
import { queueOfflineAction } from '../lib/offlineStorage';

export default function PostCard({ post, bookmarked, following, onChange, showFollow = true }) {
  const { user } = useAuth();
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  // Interactions State
  const [reaction, setReaction] = useState(null); // 'like' | 'dislike' | null
  const [likesCount, setLikesCount] = useState(Math.floor((post.id.charCodeAt(0) || 5) % 12) + 2);
  const [dislikesCount, setDislikesCount] = useState(0);
  const [showHeartPop, setShowHeartPop] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  const lastTapRef = useRef(0);

  // Load existing reactions
  useEffect(() => {
    async function loadInteractions() {
      try {
        // Load reactions
        const { data: reactData } = await supabase
          .from('post_reactions')
          .select('*')
          .eq('post_id', post.id);

        if (reactData) {
          const likes = reactData.filter((r) => r.reaction_type === 'like').length;
          const dislikes = reactData.filter((r) => r.reaction_type === 'dislike').length;
          if (likes > 0) setLikesCount(likes);
          setDislikesCount(dislikes);

          if (user) {
            const myReact = reactData.find((r) => r.user_id === user.id);
            if (myReact) setReaction(myReact.reaction_type);
          }
        }
      } catch (err) {
        // Ignore offline errors
      }
    }

    loadInteractions();
  }, [post.id, user]);

  // Handle Like / Dislike Toggle
  async function toggleReaction(type) {
    if (!user) return;

    let newReaction = null;
    if (reaction === type) {
      // Toggle off
      newReaction = null;
      if (type === 'like') setLikesCount((c) => Math.max(0, c - 1));
      if (type === 'dislike') setDislikesCount((c) => Math.max(0, c - 1));
    } else {
      // Switch or set
      if (reaction === 'like') setLikesCount((c) => Math.max(0, c - 1));
      if (reaction === 'dislike') setDislikesCount((c) => Math.max(0, c - 1));

      newReaction = type;
      if (type === 'like') setLikesCount((c) => c + 1);
      if (type === 'dislike') setDislikesCount((c) => c + 1);
    }

    setReaction(newReaction);

    const payload = { post_id: post.id, user_id: user.id, reaction_type: newReaction };

    if (!isOnline) {
      queueOfflineAction({ type: 'TOGGLE_REACTION', payload });
      return;
    }

    try {
      if (!newReaction) {
        await supabase.from('post_reactions').delete().eq('user_id', user.id).eq('post_id', post.id);
      } else {
        await supabase.from('post_reactions').delete().eq('user_id', user.id).eq('post_id', post.id);
        await supabase.from('post_reactions').insert({ user_id: user.id, post_id: post.id, reaction_type: newReaction });
      }
    } catch {
      queueOfflineAction({ type: 'TOGGLE_REACTION', payload });
    }
  }

  // Double-tap image to Like
  function handleMediaClick() {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 320;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Trigger Double Tap Heart
      setShowHeartPop(true);
      setTimeout(() => setShowHeartPop(false), 750);
      if (reaction !== 'like') {
        toggleReaction('like');
      }
    }
    lastTapRef.current = now;
  }


  // Offline Web Speech TTS (Listen button)
  function toggleSpeech() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech audio is not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const textToRead = `${post.category} story. ${post.title}`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  }

  // 1-Tap Share
  async function handleShare() {
    const shareData = {
      title: 'Zerobar — ' + post.title,
      text: post.title + ' (Read on Zerobar)',
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User dismissed share dialog
      }
    } else {
      // Fallback to clipboard copy
      try {
        await navigator.clipboard.writeText(`${post.title}\n${window.location.href}`);
        setCopiedToast(true);
        setTimeout(() => setCopiedToast(false), 2500);
      } catch {
        // Ignore clipboard failure
      }
    }
  }

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
      queueOfflineAction({ type: 'REPOST', payload: repostPayload });
      alert('Saved to Offline Outbox! Will publish when signal returns.');
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
      queueOfflineAction({ type: 'REPOST', payload: repostPayload });
      alert('Saved to Offline Outbox! Will publish when signal returns.');
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
      alert('Saved report offline. Will submit when reconnected.');
      return;
    }

    try {
      await supabase.from('reports').insert({ post_id: post.id, reporter_id: user.id, reason });
      alert('Thanks — this has been reported for review.');
    } catch {
      queueOfflineAction({
        type: 'REPORT',
        payload: { post_id: post.id, reporter_id: user.id, reason }
      });
      alert('Saved report offline. Will submit when reconnected.');
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
      {/* Media Banner with Double Tap to Like */}
      <div
        className="card-media"
        onClick={handleMediaClick}
        style={isImage ? { height: 190, background: '#090B14', cursor: 'pointer' } : { cursor: 'pointer' }}
      >
        {showHeartPop && <div className="heart-pop">❤️</div>}

        <div style={{ position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 3 }}>
          <span className="kind">{post.kind}</span>
          <span style={{ fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", background: 'rgba(9,11,20,0.85)', backdropFilter: 'blur(8px)', color: 'var(--brand-gold)', padding: '3px 8px', borderRadius: 6, border: '1px solid var(--border-subtle)', fontWeight: 600, textTransform: 'uppercase' }}>
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
        {/* Author Header */}
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

        {/* Post Metadata & Quick Actions */}
        <div className="card-meta">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="src">
              {post.is_repost ? '🔁 Repost' : new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" }}>
              · ⚡ ~18 KB
            </span>
          </div>

          <div className="meta-actions">
            {/* Audio Listen TTS Button */}
            <button
              className={`action-pill ${isSpeaking ? 'active-audio' : ''}`}
              onClick={toggleSpeech}
              title={isSpeaking ? 'Stop listening' : 'Listen to post with headphones'}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
              </svg>
              {isSpeaking ? 'Playing…' : 'Listen'}
            </button>

            {/* Bookmark */}
            <button className={`dl-btn ${bookmarked ? 'saved' : ''}`} onClick={toggleBookmark}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
              </svg>
              {bookmarked ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>

        {/* Primary Social Engagement Bar (Likes, Dislikes, Comments, Reposts, Share) */}
        <div className="reaction-bar">
          <div className="reaction-group">
            {/* Like */}
            <button
              className={`action-pill ${reaction === 'like' ? 'active-like' : ''}`}
              onClick={() => toggleReaction('like')}
              title="Like this post"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill={reaction === 'like' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
              {likesCount > 0 && <span>{likesCount}</span>}
            </button>

            {/* Dislike */}
            <button
              className={`action-pill ${reaction === 'dislike' ? 'active-dislike' : ''}`}
              onClick={() => toggleReaction('dislike')}
              title="Downvote"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill={reaction === 'dislike' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 14V2" />
                <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z" />
              </svg>
              {dislikesCount > 0 && <span>{dislikesCount}</span>}
            </button>

            {/* Repost */}
            <button className="action-pill" onClick={repost} title="Repost">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m17 2 4 4-4 4" />
                <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
                <path d="m7 22-4-4 4-4" />
                <path d="M21 13v1a4 4 0 0 1-4 4H3" />
              </svg>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Share */}
            <button className="action-pill" onClick={handleShare} title="Share post">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
                <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
              </svg>
              <span>Share</span>
            </button>

            {/* Report */}
            {!isOwn && (
              <button className="icon-btn" onClick={report} title="Report post" style={{ width: 28, height: 28 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" x2="4" y1="22" y2="15" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Copy toast feedback */}
        {copiedToast && (
          <div style={{ marginTop: 8, padding: '4px 10px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 8, fontSize: 11, color: 'var(--signal-green)', textAlign: 'center', fontFamily: "'IBM Plex Mono', monospace" }}>
            ✓ Link copied to clipboard!
          </div>
        )}
      </div>
    </div>
  );
}


