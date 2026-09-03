'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function SponsoredCard({ post }) {
  const loggedImpression = useRef(false);

  useEffect(() => {
    if (loggedImpression.current) return;
    loggedImpression.current = true;
    logEvent('impression');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function logEvent(eventType) {
    try {
      const { data: userData } = await supabase.auth.getUser();
      await supabase.from('ad_events').insert({
        sponsored_post_id: post.id,
        event_type: eventType,
        viewer_id: userData?.user?.id || null
      });
    } catch {
      // Ignore offline failures
    }
  }

  function handleClick() {
    logEvent('click');
  }

  const isImage =
    Boolean(post.media_url) ||
    (typeof post.media_emoji === 'string' &&
      (post.media_emoji.startsWith('data:image') ||
        post.media_emoji.startsWith('http') ||
        post.media_emoji.startsWith('/')));

  return (
    <div className="card" style={{ borderColor: 'rgba(245, 158, 11, 0.45)', background: 'var(--bg-card)' }}>
      <div className="card-media" style={isImage ? { height: 180, background: 'var(--bg-media)' } : {}}>
        <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6, zIndex: 3 }}>
          <span className="kind" style={{ background: 'linear-gradient(135deg, var(--brand-gold), var(--brand-amber))', color: '#090B14', fontWeight: 700 }}>
            Sponsored
          </span>
          <span style={{ fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", background: 'var(--bg-media-badge)', backdropFilter: 'blur(8px)', color: 'var(--text-secondary)', padding: '3px 8px', borderRadius: 6, border: '1px solid var(--border-subtle)', fontWeight: 600 }}>
            {post.category || 'Featured'}
          </span>
        </div>

        {isImage ? (
          <img
            src={post.media_url || post.media_emoji}
            alt={post.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
          />
        ) : (
          <span style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}>
            {post.media_emoji || '📣'}
          </span>
        )}
      </div>

      <div className="card-body">
        <p className="card-title" style={{ fontSize: 17.5 }}>
          {post.title}
        </p>

        <div className="card-meta" style={{ marginTop: 12 }}>
          <span className="src" style={{ color: 'var(--brand-gold)', fontWeight: 600 }}>
            Verified Partner
          </span>

          {post.cta_url && (
            <a
              className="dl-btn saved"
              href={post.cta_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleClick}
              style={{ padding: '6px 14px', fontSize: 11.5 }}
            >
              {post.cta_label || 'Learn more'} →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

