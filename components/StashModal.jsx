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
          <h3 style={{ margin: 0, fontSize: 17 }}>📦 Stash Feed for Offline</h3>
          <button className="icon-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <p style={{ color: 'var(--mist)', fontSize: 13, margin: '0 0 16px', lineHeight: 1.4 }}>
          Download your feed before getting on a <b>flight, subway, or train</b>. Read and scroll seamlessly with <b>zero signal</b>.
        </p>

        {stashedSummary ? (
          <div style={{ background: 'rgba(74, 222, 128, 0.1)', border: '1px solid var(--green)', padding: 14, borderRadius: 14, marginBottom: 16 }}>
            <p style={{ color: 'var(--green)', fontWeight: 600, fontSize: 14, margin: '0 0 6px' }}>
              ✓ Feed Stashed for Offline
            </p>
            <p style={{ fontSize: 12.5, color: 'var(--paper)', margin: 0, fontFamily: "'IBM Plex Mono', monospace" }}>
              {stashedSummary.totalPosts} posts stashed · {stashedSummary.sizeFormatted} used (budget: {stashedSummary.budgetMB} MB)
            </p>
            <button
              className="btn btn-primary"
              onClick={onClose}
              style={{ width: '100%', marginTop: 14, padding: 10 }}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--mist)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'IBM Plex Mono', monospace", marginBottom: 8 }}>
                ⚡ Data Saver Budget (Max Download Size)
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                {DATA_SAVER_PRESETS.map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => {
                      setSelectedMB(preset.mb);
                      setIsCustom(false);
                    }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 12,
                      cursor: 'pointer',
                      border: !isCustom && selectedMB === preset.mb ? '1.5px solid var(--amber)' : '1px solid var(--line)',
                      background: !isCustom && selectedMB === preset.mb ? 'rgba(255, 178, 56, 0.12)' : 'var(--ink)'
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 13, color: !isCustom && selectedMB === preset.mb ? 'var(--amber)' : 'var(--paper)' }}>
                      {preset.label}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--mist-dim)', marginTop: 2 }}>
                      {preset.desc}
                    </div>
                  </div>
                ))}
              </div>

              <div
                onClick={() => setIsCustom(true)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 12,
                  border: isCustom ? '1.5px solid var(--amber)' : '1px solid var(--line)',
                  background: isCustom ? 'rgba(255, 178, 56, 0.12)' : 'var(--ink)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer'
                }}
              >
                <span style={{ fontSize: 12.5, color: isCustom ? 'var(--amber)' : 'var(--mist)' }}>
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
                    width: 70,
                    padding: '4px 8px',
                    borderRadius: 8,
                    background: 'var(--indigo-2)',
                    border: '1px solid var(--line)',
                    color: 'var(--paper)',
                    fontSize: 13,
                    fontFamily: "'IBM Plex Mono', monospace"
                  }}
                />
                <span style={{ fontSize: 12, color: 'var(--mist-dim)' }}>MB</span>
              </div>
            </div>

            <div style={{ background: 'var(--ink)', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--line)', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", color: 'var(--mist)' }}>
                <span>Budget Cap:</span>
                <span style={{ color: 'var(--amber)' }}>{activeMB} MB</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", color: 'var(--mist)', marginTop: 4 }}>
                <span>Est. Offline Stories:</span>
                <span style={{ color: 'var(--paper)' }}>~{Math.round(activeMB * 25)} posts</span>
              </div>
            </div>

            {downloading && (
              <p style={{ textAlign: 'center', color: 'var(--amber)', fontSize: 12.5, fontFamily: "'IBM Plex Mono', monospace", margin: '10px 0' }}>
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
