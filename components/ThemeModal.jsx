'use client';

import { useState, useEffect } from 'react';
import { THEMES, getActiveTheme, applyTheme } from '../lib/themes';

export default function ThemeModal({ isOpen, onClose }) {
  const [currentTheme, setCurrentTheme] = useState('obsidian');

  useEffect(() => {
    setCurrentTheme(getActiveTheme());

    const handleThemeChange = (e) => {
      if (e.detail?.themeId) {
        setCurrentTheme(e.detail.themeId);
      }
    };

    window.addEventListener('zerobar_theme_changed', handleThemeChange);
    return () => window.removeEventListener('zerobar_theme_changed', handleThemeChange);
  }, []);

  if (!isOpen) return null;

  function handleSelect(id) {
    setCurrentTheme(id);
    applyTheme(id);
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxHeight: '88vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <h3 style={{ margin: 0, fontSize: 18, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>🎨</span> Select App Theme
          </h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '0 0 16px', fontFamily: "'IBM Plex Mono', monospace" }}>
          Tap any theme to preview live. Changes apply instantly.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {THEMES.map((theme) => {
            const isSelected = currentTheme === theme.id;
            return (
              <div
                key={theme.id}
                onClick={() => handleSelect(theme.id)}
                style={{
                  border: isSelected ? '2px solid var(--brand-gold)' : '1px solid var(--border-card)',
                  background: isSelected ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-base)',
                  borderRadius: 14,
                  padding: '12px 14px',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12
                }}
              >
                {/* Left: Swatch + Details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Visual Swatch Circle */}
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      background: theme.palette.bg,
                      border: `2px solid ${theme.palette.accent}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                      flexShrink: 0
                    }}
                  >
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        background: theme.palette.accent
                      }}
                    />
                  </div>

                  <div>
                    <div style={{
                      fontWeight: 700,
                      fontSize: 14,
                      color: isSelected ? 'var(--brand-gold)' : 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}>
                      <span>{theme.name}</span>
                      {!theme.isDark && (
                        <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#E6DEC8', color: '#4A4035', fontFamily: "'IBM Plex Mono', monospace" }}>
                          Light
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {theme.tagline}
                    </div>
                  </div>
                </div>

                {/* Right: Selected Checkmark */}
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    border: isSelected ? '2px solid var(--brand-gold)' : '2px solid var(--border-card)',
                    background: isSelected ? 'var(--brand-gold)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    color: '#000',
                    fontWeight: 900,
                    flexShrink: 0
                  }}
                >
                  {isSelected ? '✓' : ''}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <button
            className="btn btn-primary"
            onClick={onClose}
            style={{ width: '100%', padding: '10px 0' }}
          >
            Keep This Theme
          </button>
        </div>
      </div>
    </div>
  );
}
