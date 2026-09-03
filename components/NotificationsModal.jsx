'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthProvider';

export default function NotificationsModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !user) return;
    loadNotifications();
  }, [isOpen, user]);

  async function loadNotifications() {
    setLoading(true);
    try {
      // Fetch real activity: recent likes on your posts
      const { data: myPosts } = await supabase
        .from('posts')
        .select('id, title')
        .eq('user_id', user.id);

      if (!myPosts || myPosts.length === 0) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      const postIds = myPosts.map(p => p.id);
      const postMap = {};
      myPosts.forEach(p => { postMap[p.id] = p.title; });

      const { data: reactions } = await supabase
        .from('post_reactions')
        .select('*, profiles:user_id ( username, avatar_emoji )')
        .in('post_id', postIds)
        .eq('reaction_type', 'like')
        .neq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      const notifs = (reactions || []).map((r, i) => ({
        id: `notif-${i}`,
        type: 'like',
        title: 'New Like',
        message: `${r.profiles?.avatar_emoji || '🧑'} @${r.profiles?.username || 'someone'} liked: "${(postMap[r.post_id] || '').slice(0, 60)}..."`,
        time: formatTimeAgo(r.created_at),
        unread: isRecent(r.created_at)
      }));

      setNotifications(notifs);
    } catch (err) {
      console.warn('Error loading notifications:', err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }

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
              <span style={{ background: 'var(--brand-amber)', color: 'var(--bg-base)', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>
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

        {loading && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '30px 0' }}>Loading…</p>
        )}

        {!loading && notifications.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔔</div>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, fontFamily: "'IBM Plex Mono', monospace", margin: 0 }}>
              No notifications yet. When people like or repost your stories, they will appear here.
            </p>
          </div>
        )}

        {!loading && notifications.length > 0 && (
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
                    background: 'rgba(244, 63, 94, 0.15)',
                    color: 'var(--signal-rust)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    flexShrink: 0
                  }}
                >
                  ❤️
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
        )}
      </div>
    </div>
  );
}

function formatTimeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function isRecent(dateStr) {
  return Date.now() - new Date(dateStr).getTime() < 24 * 60 * 60 * 1000;
}
