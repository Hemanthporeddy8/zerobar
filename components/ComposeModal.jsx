'use client';

import { useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthProvider';
import { queueOfflineAction } from '../lib/offlineStorage';

const CATEGORIES = ['Trending', 'Local', 'Tech', 'Career'];
const EMOJI_BADGES = ['✍️', '📸', '⚡', '🚀', '💡', '🚇', '🗞️', '☕', '🎧', '📣'];
const LOCATION_PRESETS = ['📍 Metro Tunnel', '📍 Flight / Airborne', '📍 Train Station', '📍 Bangalore', '📍 Hyderabad', '📍 Delhi NCR'];

export default function ComposeModal({ onClose, onPosted }) {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [category, setCategory] = useState('Trending');
  const [selectedEmoji, setSelectedEmoji] = useState('✍️');
  const [location, setLocation] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [imageSizeKB, setImageSizeKB] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  // Compress image on the client before saving/stashing
  function processImageFile(file) {
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 720;
        const scaleSize = MAX_WIDTH / Math.max(img.width, MAX_WIDTH);
        canvas.width = Math.min(img.width, MAX_WIDTH);
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Compress to WebP / JPEG at 0.72 quality
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.72);
        const approxKB = Math.round((compressedBase64.length * 3) / 4 / 1024);

        setImagePreview(compressedBase64);
        setImageSizeKB(approxKB);
        setSelectedEmoji('📸');
      };
      img.src = event.target?.result;
    };
    reader.readAsDataURL(file);
  }

  function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  }

  function removeImage() {
    setImagePreview(null);
    setImageSizeKB(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function insertTag(tag) {
    setText((prev) => (prev ? `${prev} ${tag} ` : `${tag} `));
  }

  async function submit() {
    const title = text.trim();
    if (!title || !user) return;
    setSubmitting(true);

    const mediaValue = imagePreview || selectedEmoji || '✍️';
    const kind = imagePreview ? 'Photo' : 'Post';
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
      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        category,
        kind,
        title,
        location: locValue,
        media_emoji: mediaValue
      });
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
          overflowY: 'auto',
          border: isDragging ? '2px dashed var(--brand-gold)' : '1px solid var(--border-card)',
          boxShadow: isDragging ? '0 0 25px rgba(251, 191, 36, 0.25)' : undefined
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer?.files?.[0];
          if (file) processImageFile(file);
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
          rows={3}
        />

        {/* Quick Helper Tags Tray */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
            Add:
          </span>
          {['#metro', '#transit', '#tech', '#local', '🕊️@'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => insertTag(t)}
              style={{
                background: t.startsWith('🕊️') ? 'rgba(96, 165, 250, 0.12)' : 'rgba(251, 191, 36, 0.1)',
                border: t.startsWith('🕊️') ? '1px solid rgba(96, 165, 250, 0.3)' : '1px solid rgba(251, 191, 36, 0.3)',
                color: t.startsWith('🕊️') ? '#60A5FA' : 'var(--brand-gold)',
                borderRadius: 999,
                padding: '2px 8px',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'IBM Plex Mono', monospace"
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Location Selector Bar */}
        <div style={{ marginTop: 14 }}>
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

        {/* Image Preview / Drag & Drop Upload Zone */}
        {imagePreview ? (
          <div style={{ position: 'relative', marginTop: 12, borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border-card)', background: 'var(--bg-card)' }}>
            <img
              src={imagePreview}
              alt="Preview"
              style={{ width: '100%', maxHeight: 180, objectFit: 'cover', display: 'block' }}
            />
            <button
              onClick={removeImage}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: 'rgba(9, 11, 20, 0.85)',
                border: '1px solid var(--border-card)',
                color: 'var(--text-primary)',
                width: 28,
                height: 28,
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12
              }}
            >
              ✕
            </button>
            <span style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.7)', color: 'var(--signal-green)', fontSize: 10.5, padding: '2px 8px', borderRadius: 6, fontFamily: "'IBM Plex Mono', monospace" }}>
              ⚡ Compressed: ~{imageSizeKB} KB (Data Saver Ready)
            </span>
          </div>
        ) : (
          <div
            style={{
              marginTop: 12,
              padding: '12px 14px',
              borderRadius: 12,
              border: '1px dashed var(--border-card)',
              background: isDragging ? 'rgba(251, 191, 36, 0.08)' : 'rgba(255, 255, 255, 0.02)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10
            }}
          >
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--brand-gold)',
                fontSize: 12,
                fontFamily: "'IBM Plex Mono', monospace",
                cursor: 'pointer'
              }}
            >
              📷 Attach Photo
            </button>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {isDragging ? 'Drop image now!' : 'Or drag & drop photo here'}
            </span>
          </div>
        )}

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
