'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthProvider';
import { queueOfflineAction } from '../lib/offlineStorage';
import { apiCreatePost } from '../lib/apiClient';

const CATEGORIES = ['Trending', 'Local', 'Tech', 'Career'];
const EMOJI_BADGES = ['✍️', '⚡', '🚀', '💡', '🚇', '🗞️', '☕', '🎧', '📣'];
const LOCATION_PRESETS = ['📍 Metro Tunnel', '📍 Flight / Airborne', '📍 Train Station', '📍 Bangalore', '📍 Hyderabad', '📍 Delhi NCR'];

export default function ComposeModal({ onClose, onPosted }) {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [category, setCategory] = useState('Trending');
  const [selectedEmoji, setSelectedEmoji] = useState('✍️');
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  function insertTag(tag) {
    setText((prev) => (prev ? `${prev} ${tag} ` : `${tag} `));
  }

  async function submit() {
    const title = text.trim();
    if (!title || !user) return;
    setSubmitting(true);

    const mediaValue = selectedEmoji || '✍️';
    const kind = 'Post';
    const locValue = location.trim() || null;

    const postPayload = {
      user_id: user.id,
      category,
      kind,
      title,
      location: locValue,
      media_emoji: mediaValue,
      authorProfile: {
        username: user.user_metadata?.username || user.email?.split('@')[0] || 'You',
        avatar_emoji: '⚡'
      }
    };

    if (!isOnline) {
      queueOfflineAction({
        type: 'CREATE_POST',
        payload: postPayload
      });
      setSubmitting(false);
      setText('');
      onPosted && onPosted();
      onClose();
      return;
    }

    try {
      const { error } = await apiCreatePost(postPayload);
      if (error) throw error;
    } catch {
      queueOfflineAction({
        type: 'CREATE_POST',
        payload: postPayload
      });
    }

    setSubmitting(false);
    setText('');
    onPosted && onPosted();
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="modal"
        style={{
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>
            New post {!isOnline && <span style={{ color: 'var(--brand-gold)', fontSize: 12 }}>(Offline Mode)</span>}
          </h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        <textarea
          placeholder="What's happening on your route today? Use #tags or 🕊️@username..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          autoFocus
          style={{ width: '100%', resize: 'vertical' }}
        />

        {/* Quick Tags Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
            Add:
          </span>
          <button
            type="button"
            onClick={() => insertTag('#metro')}
            style={{
              background: 'rgba(251, 191, 36, 0.12)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              color: 'var(--brand-gold)',
              borderRadius: 6,
              padding: '2px 7px',
              fontSize: 11,
              fontFamily: "'IBM Plex Mono', monospace",
              cursor: 'pointer'
            }}
          >
            #metro
          </button>
          <button
            type="button"
            onClick={() => insertTag('#transit')}
            style={{
              background: 'rgba(251, 191, 36, 0.12)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              color: 'var(--brand-gold)',
              borderRadius: 6,
              padding: '2px 7px',
              fontSize: 11,
              fontFamily: "'IBM Plex Mono', monospace",
              cursor: 'pointer'
            }}
          >
            #transit
          </button>
          <button
            type="button"
            onClick={() => insertTag('#tech')}
            style={{
              background: 'rgba(251, 191, 36, 0.12)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              color: 'var(--brand-gold)',
              borderRadius: 6,
              padding: '2px 7px',
              fontSize: 11,
              fontFamily: "'IBM Plex Mono', monospace",
              cursor: 'pointer'
            }}
          >
            #tech
          </button>
          <button
            type="button"
            onClick={() => insertTag('#local')}
            style={{
              background: 'rgba(251, 191, 36, 0.12)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              color: 'var(--brand-gold)',
              borderRadius: 6,
              padding: '2px 7px',
              fontSize: 11,
              fontFamily: "'IBM Plex Mono', monospace",
              cursor: 'pointer'
            }}
          >
            #local
          </button>
          <button
            type="button"
            onClick={() => insertTag('🕊️@')}
            style={{
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              borderRadius: 6,
              padding: '2px 7px',
              fontSize: 11,
              fontFamily: "'IBM Plex Mono', monospace",
              cursor: 'pointer'
            }}
            title="Pigeon Tag User"
          >
            🕊️@
          </button>
        </div>

        {/* Location Picker */}
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase' }}>
              📍 Transit / City Location (Optional)
            </span>
            {location && (
              <button
                type="button"
                onClick={() => setLocation('')}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer' }}
              >
                Clear
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6 }}>
            {LOCATION_PRESETS.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => setLocation(location === loc ? '' : loc)}
                style={{
                  background: location === loc ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: location === loc ? '1px solid var(--signal-green)' : '1px solid var(--border-subtle)',
                  color: location === loc ? 'var(--signal-green)' : 'var(--text-secondary)',
                  borderRadius: 999,
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer'
                }}
              >
                {loc}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Or type custom station / route (e.g. Hyderabad Blue Line, BLR Airport)..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={{
              width: '100%',
              marginTop: 4,
              padding: '6px 12px',
              fontSize: 12,
              background: 'var(--bg-base)',
              border: '1px solid var(--border-card)',
              borderRadius: 8,
              color: 'var(--text-primary)',
              outline: 'none'
            }}
          />
        </div>

        {/* Emoji Badge Tray */}
        <div style={{ marginTop: 12 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase' }}>
            Icon Badge
          </span>
          <div style={{ display: 'flex', gap: 6, marginTop: 6, overflowX: 'auto', paddingBottom: 4 }}>
            {EMOJI_BADGES.map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => {
                  setSelectedEmoji(em);
                }}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  fontSize: 16,
                  background: selectedEmoji === em ? 'var(--brand-amber)' : 'rgba(255,255,255,0.06)',
                  border: selectedEmoji === em ? '1.5px solid var(--brand-gold)' : '1px solid var(--border-card)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {em}
              </button>
            ))}
          </div>
        </div>

        {/* Category Chips */}
        <div style={{ marginTop: 10 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase' }}>
            Category
          </span>
          <div className="modal-chips" style={{ margin: '6px 0 14px' }}>
            {CATEGORIES.map((c) => (
              <div
                key={c}
                className={`chip ${category === c ? 'active' : ''}`}
                onClick={() => setCategory(c)}
              >
                {c}
              </div>
            ))}
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={submit} disabled={submitting}>
            {submitting ? 'Posting…' : isOnline ? 'Post' : 'Queue to Outbox'}
          </button>
        </div>
      </div>
    </div>
  );
}
