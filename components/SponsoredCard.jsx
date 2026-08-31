'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

// Renders a brand's directly-sold sponsored post. Unlike a third-party ad
// network card, this is safe to include in the offline bundle — it's your
// own content, not a live-verified third-party ad call.
export default function SponsoredCard({ post }) {
  const loggedImpression = useRef(false);

  useEffect(() => {
    if (loggedImpression.current) return;
    loggedImpression.current = true;
    logEvent('impression');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function logEvent(eventType) {
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from('ad_events').insert({
      sponsored_post_id: post.id,
      event_type: eventType,
      viewer_id: userData?.user?.id || null
    });
    // If this insert fails because the device is offline, Supabase's client
    // will just throw here silently for now. Before launch, queue failed
    // events (e.g. in IndexedDB) and retry them on the 'online' event, so
    // offline impressions still count once signal returns.
  }

  function handleClick() {
    logEvent('click');
  }

  return (
    <div className="card" style={{ borderColor: 'rgba(255,178,56,0.35)' }}>
      <div className="card-media">
        <span className="kind" style={{ background: 'rgba(255,178,56,0.85)', color: '#241704' }}>
          Sponsored
        </span>
        {post.media_emoji || '📣'}
      </div>
      <div className="card-body">
        <p className="card-title">{post.title}</p>
        <div className="card-meta">
          <span className="src">{post.category}</span>
          {post.cta_url && (
            <a
              className="dl-btn saved"
              href={post.cta_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleClick}
            >
              {post.cta_label || 'Learn more'}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
