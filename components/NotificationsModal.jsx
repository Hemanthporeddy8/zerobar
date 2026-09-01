'use client';

import { useState } from 'react';

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    type: 'like',
    title: 'New Like on your story',
    message: '@sarah_dev liked your post: "Why offline-first apps are the future of mobile web..."',
    time: '5m ago',
    unread: true
  },
  {
    id: 'notif-2',
    type: 'reply',
    title: 'New Comment',
    message: '@alex_tech replied: "Frequency is noticeable during peak hours today. Good step."',
    time: '25m ago',
    unread: true
  },
  {
    id: 'notif-3',
    type: 'trending',
    title: 'Trending Alert',
    message: '🔥 Your commute update is now trending in the Local stream!',
    time: '1h ago',
    unread: true
  },
  {
    id: 'notif-4',
    type: 'offline',
    title: 'Offline Stash Ready',
    message: '📦 48 stories stashed for flight/commute (2.1 MB used). Zero signal required.',
    time: '3h ago',
    unread: false
  }
];

export default function NotificationsModal({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  if (!isOpen) return null;

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  }

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 500, maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: 18, letterSpacing: '-0.02em' }}>Notifications</h3>
            {unreadCount > 0 && (
              <span style={{ background: 'var(--brand-amber)', color: '#090B14', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>
                {unreadCount} new
              </span>
            )}
          </div>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        {unreadCount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
            <button
              onClick={markAllRead}
              style={{ background: 'none', border: 'none', color: 'var(--brand-gold)', fontSize: 12, cursor: 'pointer', fontFamily: "'IBM Plex Mono', monospace" }}
            >
              ✓ Mark all as read
            </button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {notifications.map((n) => (
            <div
              key={n.id}
              style={{
                background: n.unread ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-base)',
                border: n.unread ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--border-card)',
                borderRadius: 14,
                padding: '12px 14px',
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start'
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: n.type === 'like' ? 'rgba(244, 63, 94, 0.15)' : n.type === 'reply' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  color: n.type === 'like' ? 'var(--signal-rust)' : n.type === 'reply' ? 'var(--brand-gold)' : 'var(--signal-green)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  flexShrink: 0
                }}
              >
                {n.type === 'like' ? '❤️' : n.type === 'reply' ? '💬' : n.type === 'trending' ? '🔥' : '📦'}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{n.title}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>{n.time}</span>
                </div>
                <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {n.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
