'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthProvider';

const AVATAR_OPTIONS = [
  '🧑', '⚡', '✍️', '☕', '🎧', '💼', '🚀', '💡',
  '🗞️', '👓', '🌿', '🎯', '🦉', '🎩', '🧭', '📱'
];

export default function EditProfileModal({ isOpen, onClose, profile, onSaved }) {
  const { user } = useAuth();
  const [username, setUsername] = useState('');
  const [avatarEmoji, setAvatarEmoji] = useState('🧑');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setAvatarEmoji(profile.avatar_emoji || '🧑');
      setBio(profile.bio || '');
    }
  }, [profile, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username.trim() || !user) return;
    setSaving(true);
    setError(null);

    const payload = {
      username: username.trim(),
      avatar_emoji: avatarEmoji,
      bio: bio.trim()
    };

    try {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', user.id);

      if (updateErr) throw updateErr;

      onSaved && onSaved(payload);
      onClose();
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err.message || 'Could not update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18, letterSpacing: '-0.02em' }}>Edit Profile</h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid var(--signal-rust)',
            color: 'var(--signal-rust)',
            padding: '8px 12px',
            borderRadius: 10,
            fontSize: 12,
            marginBottom: 14,
            fontFamily: "'IBM Plex Mono', monospace"
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Avatar Preview & Selection */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div
              style={{
                width: 76,
                height: 76,
                borderRadius: 24,
                margin: '0 auto 10px',
                background: 'linear-gradient(135deg, var(--brand-gold), #FF6B4A)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 34,
                boxShadow: '0 8px 24px rgba(245, 158, 11, 0.25)'
              }}
            >
              {avatarEmoji}
            </div>
            <label style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace", display: 'block', marginBottom: 8 }}>
              Choose your avatar badge
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
              {AVATAR_OPTIONS.map((emoji) => (
                <button
                  type="button"
                  key={emoji}
                  onClick={() => setAvatarEmoji(emoji)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    border: avatarEmoji === emoji ? '2px solid var(--brand-gold)' : '1px solid var(--border-card)',
                    background: avatarEmoji === emoji ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-card)',
                    fontSize: 18,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Username Input */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11.5, color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace", marginBottom: 6 }}>
              Display Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your username"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 12,
                background: 'var(--bg-base)',
                border: '1px solid var(--border-card)',
                color: 'var(--text-primary)',
                fontSize: 14,
                fontFamily: 'inherit',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Bio Input */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
                Bio
              </label>
              <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
                {bio.length}/160
              </span>
            </div>
            <textarea
              maxLength={160}
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="What do you read or write about? Add a short bio..."
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 12,
                background: 'var(--bg-base)',
                border: '1px solid var(--border-card)',
                color: 'var(--text-primary)',
                fontSize: 13.5,
                fontFamily: 'inherit',
                outline: 'none',
                resize: 'none',
                boxSizing: 'border-box',
                lineHeight: 1.5
              }}
            />
          </div>

          {/* Actions */}
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving || !username.trim()}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
