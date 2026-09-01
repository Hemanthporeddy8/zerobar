'use client';

import { useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthProvider';
import { queueOfflineAction } from '../lib/offlineStorage';

const CATEGORIES = ['Trending', 'Local', 'Tech', 'Career'];
const EMOJI_BADGES = ['✍️', '📸', '⚡', '🚀', '💡', '🚇', '🗞️', '☕', '🎧', '📣'];

export default function ComposeModal({ onClose, onPosted }) {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [category, setCategory] = useState('Trending');
  const [selectedEmoji, setSelectedEmoji] = useState('✍️');
  const [imagePreview, setImagePreview] = useState(null);
  const [imageSizeKB, setImageSizeKB] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  // Compress image on the client before saving/stashing
  function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

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

  function removeImage() {
    setImagePreview(null);
    setImageSizeKB(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function submit() {
    const title = text.trim();
    if (!title || !user) return;
    setSubmitting(true);

    const mediaValue = imagePreview || selectedEmoji || '✍️';
    const kind = imagePreview ? 'Photo' : 'Post';

    const postPayload = {
      user_id: user.id,
      category,
      kind,
      title,
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
      <div className="modal" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>
            New post {!isOnline && <span style={{ color: 'var(--amber)', fontSize: 12 }}>(Offline Mode)</span>}
          </h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        <textarea
          placeholder="What's happening on your route today?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
        />

        {/* Image Preview Container */}
        {imagePreview ? (
          <div style={{ position: 'relative', marginTop: 10, borderRadius: 14, overflow: 'hidden', border: '1px solid var(--line)', background: 'var(--ink)' }}>
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
                background: 'rgba(18, 22, 42, 0.85)',
                border: '1px solid var(--line)',
                color: 'var(--paper)',
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
            <span style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.6)', color: 'var(--green)', fontSize: 10.5, padding: '2px 8px', borderRadius: 6, fontFamily: "'IBM Plex Mono', monospace" }}>
              ⚡ Compressed: ~{imageSizeKB} KB (Data Saver Ready)
            </span>
          </div>
        ) : (
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
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
                padding: '8px 14px',
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px dashed var(--mist-dim)',
                color: 'var(--amber)',
                fontSize: 12.5,
                fontFamily: "'IBM Plex Mono', monospace",
                cursor: 'pointer'
              }}
            >
              📷 Attach Photo
            </button>
            <span style={{ fontSize: 11, color: 'var(--mist-dim)' }}>Auto-compressed for offline stash</span>
          </div>
        )}

        {/* Emoji Badge Tray */}
        <div style={{ marginTop: 12 }}>
          <span style={{ fontSize: 11, color: 'var(--mist)', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase' }}>
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
                  background: selectedEmoji === em ? 'var(--amber)' : 'rgba(255,255,255,0.06)',
                  border: selectedEmoji === em ? '1.5px solid var(--amber)' : '1px solid var(--line)',
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
          <span style={{ fontSize: 11, color: 'var(--mist)', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase' }}>
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


