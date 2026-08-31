'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthProvider';
import { queueOfflineAction } from '../lib/offlineStorage';

const CATEGORIES = ['Trending', 'Local', 'Tech', 'Career'];

export default function ComposeModal({ onClose, onPosted }) {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [category, setCategory] = useState('Trending');
  const [submitting, setSubmitting] = useState(false);

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  async function submit() {
    const title = text.trim();
    if (!title || !user) return;
    setSubmitting(true);

    const postPayload = {
      user_id: user.id,
      category,
      kind: 'Post',
      title,
      media_emoji: '✍️',
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
        kind: 'Post',
        title,
        media_emoji: '✍️'
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
      <div className="modal">
        <h3>New post {!isOnline && <span style={{ color: 'var(--amber)', fontSize: 12 }}>(Offline Mode)</span>}</h3>
        <textarea
          placeholder="What's happening on your route today?"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="modal-chips">
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
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>
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

