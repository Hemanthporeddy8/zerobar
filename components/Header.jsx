'use client';

import { useState, useEffect } from 'react';
import { useOnlineStatus } from './OfflineRegister';
import { getOfflineOutbox, getOfflineStash, flushOfflineOutbox } from '../lib/offlineStorage';
import { useAuth } from './AuthProvider';
import { supabase } from '../lib/supabaseClient';
import StashModal from './StashModal';

export default function Header({ onRefresh }) {
  const online = useOnlineStatus();
  const { user } = useAuth();
  const [stashModalOpen, setStashModalOpen] = useState(false);
  const [outboxCount, setOutboxCount] = useState(0);
  const [stashMeta, setStashMeta] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState('');

  useEffect(() => {
    setOutboxCount(getOfflineOutbox().length);
    const stash = getOfflineStash();
    setStashMeta(stash.meta);

    const handleOutbox = (e) => setOutboxCount(e.detail?.count || 0);
    const handleStash = (e) => setStashMeta(e.detail);
    const handleNotification = (e) => {
      setSyncToast(e.detail?.message || 'Synced to community');
      setTimeout(() => setSyncToast(''), 4000);
    };

    window.addEventListener('zerobar_outbox_changed', handleOutbox);
    window.addEventListener('zerobar_stash_updated', handleStash);
    window.addEventListener('zerobar_sync_notification', handleNotification);

    return () => {
      window.removeEventListener('zerobar_outbox_changed', handleOutbox);
      window.removeEventListener('zerobar_stash_updated', handleStash);
      window.removeEventListener('zerobar_sync_notification', handleNotification);
    };
  }, []);

  useEffect(() => {
    if (online && user && outboxCount > 0 && !syncing) {
      handleManualSync();
    }
  }, [online, user, outboxCount]);

  async function handleManualSync() {
    if (!online || !user) return;
    setSyncing(true);
    await flushOfflineOutbox(supabase, user);
    setOutboxCount(getOfflineOutbox().length);
    setSyncing(false);
    onRefresh && onRefresh();
  }

  function handleStashed(meta) {
    setStashMeta(meta);
    onRefresh && onRefresh();
  }

  return (
    <>
      <div className="signalbar">
        <div className="signalbar-top">
          <div className="brand">
            <div className="brand-icon">⚡</div>
            <span>Zerobar</span>
            <span className={`dot ${online ? '' : 'off'}`} title={online ? 'Connected' : 'Offline'}></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {outboxCount > 0 && (
              <button
                className="icon-btn"
                onClick={handleManualSync}
                disabled={!online || syncing}
                title={online ? 'Click to sync offline actions' : 'Offline — will sync when signal returns'}
                style={{
                  width: 'auto',
                  padding: '4px 10px',
                  borderRadius: 999,
                  fontSize: 11,
                  fontFamily: "'IBM Plex Mono', monospace",
                  background: 'rgba(244, 63, 94, 0.12)',
                  borderColor: 'rgba(244, 63, 94, 0.3)',
                  color: 'var(--signal-rust)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                  <path d="M16 21h5v-5" />
                </svg>
                {outboxCount} {syncing ? 'syncing…' : 'queued'}
              </button>
            )}

            <button
              onClick={() => setStashModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 999,
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid var(--border-active)',
                color: 'var(--brand-gold)',
                fontSize: 11.5,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'IBM Plex Mono', monospace",
                transition: 'all 0.15s ease'
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                <path d="m3.3 7 8.7 5 8.7-5" />
                <path d="M12 22V12" />
              </svg>
              {stashMeta?.sizeFormatted ? `Stashed (${stashMeta.sizeFormatted})` : 'Stash Feed'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="status-label">
            {online ? (
              <>
                <span style={{ color: 'var(--signal-green)' }}>●</span> Live Feed
              </>
            ) : (
              <>
                <span style={{ color: 'var(--signal-rust)' }}>●</span> Offline Stash ({stashMeta?.totalPosts || 0} posts)
              </>
            )}
          </div>
          {stashMeta?.budgetMB && (
            <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
              Cap: {stashMeta.budgetMB} MB
            </span>
          )}
        </div>

        {syncToast && (
          <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 10, fontSize: 12, color: 'var(--signal-green)', textAlign: 'center', fontWeight: 500 }}>
            ✓ {syncToast}
          </div>
        )}
      </div>

      {stashModalOpen && (
        <StashModal onClose={() => setStashModalOpen(false)} onStashed={handleStashed} />
      )}
    </>
  );
}


