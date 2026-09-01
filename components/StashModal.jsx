'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { DATA_SAVER_PRESETS, getOfflineSettings, saveOfflineSettings, saveOfflineStash } from '../lib/offlineStorage';

export default function StashModal({ onClose, onStashed }) {
  const currentSettings = getOfflineSettings();
  const [selectedMB, setSelectedMB] = useState(currentSettings.dataSaverMB || 2);
  const [isCustom, setIsCustom] = useState(false);
  const [customVal, setCustomVal] = useState(selectedMB);
  const [downloading, setDownloading] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [stashedSummary, setStashedSummary] = useState(null);

  async function handleDownload() {
    setDownloading(true);
    setProgressText('Connecting to feed…');

    try {
      const activeMB = isCustom ? Number(customVal) || 2 : selectedMB;
      saveOfflineSettings({ ...currentSettings, dataSaverMB: activeMB });

      setProgressText('Downloading latest posts within data budget…');
      const { data: postData } = await supabase
        .from('posts')
        .select('*, profiles:user_id ( username, avatar_emoji )')
        .order('created_at', { ascending: false })
        .limit(300);

      setProgressText('Downloading reels & micro-stories…');
      const { data: reelData } = await supabase
        .from('posts')
        .select('*, profiles:user_id ( username, avatar_emoji )')
        .ilike('kind', 'Reel%')
        .order('created_at', { ascending: false })
        .limit(50);

      setProgressText('Downloading offline-safe sponsored cards…');
      const { data: sponsoredData } = await supabase
        .from('sponsored_posts')
        .select('*')
        .eq('active', true)
        .limit(10);

      const meta = saveOfflineStash({
        posts: postData || [],
        reels: reelData || [],
        sponsored: sponsoredData || [],
        budgetMB: activeMB
      });

      setStashedSummary(meta);
      onStashed && onStashed(meta);
    } catch (err) {
      console.error('Error creating offline stash:', err);
      setProgressText('Error downloading stash. Please check your connection.');
    } finally {
      setDownloading(false);
    }
  }

  const activeMB = isCustom ? Number(customVal) || 2 : selectedMB;

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 18, letterSpacing: '-0.02em' }}>📦 Stash Feed for Offline</h3>
          <button className="icon-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, margin: '0 0 18px', lineHeight: 1.5 }}>
          Pre-load your feed before getting on a <b>flight, subway, or train</b>. Read and scroll with <b>zero signal</b>.
        </p>

        {stashedSummary ? (
          <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)', padding: 16, borderRadius: 16, marginBottom: 16 }}>
            <p style={{ color: 'var(--signal-green)', fontWeight: 700, fontSize: 15, margin: '0 0 6px' }}>
              ✓ Feed Stashed Successfully
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: 0, fontFamily: "'IBM Plex Mono', monospace" }}>
              {stashedSummary.totalPosts} posts stashed · {stashedSummary.sizeFormatted} used (budget: {stashedSummary.budgetMB} MB)
            </p>
            <button
              className="btn btn-primary"
              onClick={onClose}
              style={{ width: '100%', marginTop: 16, padding: 11 }}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11.5, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'IBM Plex Mono', monospace", marginBottom: 10 }}>
                ⚡ Data Saver Budget Cap
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                {DATA_SAVER_PRESETS.map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => {
                      setSelectedMB(preset.mb);
                      setIsCustom(false);
                    }}
                    style={{
                      padding: '12px',
                      borderRadius: 14,
                      cursor: 'pointer',
                      border: !isCustom && selectedMB === preset.mb ? '1.5px solid var(--brand-amber)' : '1px solid var(--border-card)',
                      background: !isCustom && selectedMB === preset.mb ? 'rgba(245, 158, 11, 0.12)' : 'var(--bg-base)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: !isCustom && selectedMB === preset.mb ? 'var(--brand-gold)' : 'var(--text-primary)' }}>
                      {preset.label}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                      {preset.desc}
                    </div>
                  </div>
                ))}
              </div>

              <div
                onClick={() => setIsCustom(true)}
                style={{
                  padding: '10px 14px',
                  borderRadius: 14,
                  border: isCustom ? '1.5px solid var(--brand-amber)' : '1px solid var(--border-card)',
                  background: isCustom ? 'rgba(245, 158, 11, 0.12)' : 'var(--bg-base)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer'
                }}
              >
                <span style={{ fontSize: 13, color: isCustom ? 'var(--brand-gold)' : 'var(--text-secondary)', fontWeight: 500 }}>
                  Custom Limit:
                </span>
                <input
                  type="number"
                  min="0.5"
                  max="50"
                  step="0.5"
                  value={customVal}
                  onChange={(e) => {
                    setCustomVal(e.target.value);
                    setIsCustom(true);
                  }}
                  style={{
                    width: 76,
                    padding: '6px 10px',
                    borderRadius: 8,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-card)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    fontFamily: "'IBM Plex Mono', monospace"
                  }}
                />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>MB</span>
              </div>
            </div>

            <div style={{ background: 'var(--bg-base)', padding: '12px 16px', borderRadius: 14, border: '1px solid var(--border-card)', marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontFamily: "'IBM Plex Mono', monospace", color: 'var(--text-secondary)' }}>
                <span>Budget Limit:</span>
                <span style={{ color: 'var(--brand-gold)', fontWeight: 700 }}>{activeMB} MB</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontFamily: "'IBM Plex Mono', monospace", color: 'var(--text-secondary)', marginTop: 6 }}>
                <span>Estimated Feed Items:</span>
                <span style={{ color: 'var(--text-primary)' }}>~{Math.round(activeMB * 25)} posts + reels</span>
              </div>
            </div>

            {downloading && (
              <p style={{ textAlign: 'center', color: 'var(--brand-amber)', fontSize: 13, fontFamily: "'IBM Plex Mono', monospace", margin: '12px 0' }}>
                ⏳ {progressText}
              </p>
            )}

            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={onClose} disabled={downloading}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleDownload} disabled={downloading}>
                {downloading ? 'Downloading…' : `📦 Download Stash (${activeMB} MB)`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

