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
    // Initial read
    setOutboxCount(getOfflineOutbox().length);
    const stash = getOfflineStash();
    setStashMeta(stash.meta);

    // Event listeners
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

  // Auto flush outbox when online
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
            <span className={`dot ${online ? '' : 'off'}`}></span>
            Zerobar
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
                  background: 'rgba(255, 107, 74, 0.15)',
                  borderColor: 'var(--rust)',
                  color: 'var(--rust)'
                }}
              >
                🔄 {outboxCount} {syncing ? 'syncing…' : 'queued'}
              </button>
            )}

            <button
              onClick={() => setStashModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 12px',
                borderRadius: 999,
                background: 'rgba(255, 178, 56, 0.12)',
                border: '1px solid var(--amber)',
                color: 'var(--amber)',
                fontSize: 11.5,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'IBM Plex Mono', monospace"
              }}
            >
              📦 {stashMeta?.sizeFormatted ? `Stash (${stashMeta.sizeFormatted})` : 'Stash Feed'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="status-label">
            {online
              ? "🟢 Connected · Live community feed"
              : `📶 No signal · Offline Stash (${stashMeta?.totalPosts || 0} posts)`}
          </div>
          {stashMeta?.budgetMB && (
            <span style={{ fontSize: 10, color: 'var(--mist-dim)', fontFamily: "'IBM Plex Mono', monospace" }}>
              Budget: {stashMeta.budgetMB} MB
            </span>
          )}
        </div>

        {syncToast && (
          <div style={{ marginTop: 8, padding: '6px 10px', background: 'rgba(74, 222, 128, 0.15)', border: '1px solid var(--green)', borderRadius: 8, fontSize: 11.5, color: 'var(--green)', textAlign: 'center' }}>
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

