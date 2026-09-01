'use client';

import { useState, useEffect } from 'react';

export default function InstallPrompt({ isOpen, onClose }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsInstalled(true);
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  async function handleInstallClick() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
      onClose();
    }
  }

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 440, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg, var(--brand-gold), var(--brand-amber))', color: '#090B14', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 16px', boxShadow: 'var(--glow-amber)' }}>
          ⚡
        </div>

        <h3 style={{ fontSize: 20, margin: '0 0 8px', letterSpacing: '-0.02em' }}>Install Zerobar App</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, margin: '0 0 20px', lineHeight: 1.5 }}>
          Get instant 1-tap offline access from your phone home screen with zero app store downloads.
        </p>

        {isInstalled ? (
          <div style={{ padding: '12px 16px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 14, color: 'var(--signal-green)', fontSize: 13.5, fontWeight: 600 }}>
            ✓ Zerobar is already installed on this device!
          </div>
        ) : isIOS ? (
          <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-card)', borderRadius: 16, padding: '16px', textAlign: 'left', fontSize: 13, color: 'var(--text-secondary)' }}>
            <p style={{ margin: '0 0 10px', color: 'var(--text-primary)', fontWeight: 600 }}>
              How to install on iPhone / iPad:
            </p>
            <ol style={{ paddingLeft: 20, margin: 0, lineHeight: 1.8 }}>
              <li>Tap the <b>Share button</b> in the Safari bottom bar.</li>
              <li>Scroll down and tap <b>&quot;Add to Home Screen&quot;</b>.</li>
              <li>Tap <b>Add</b> in the top right corner.</li>
            </ol>
          </div>
        ) : deferredPrompt ? (
          <button className="btn btn-primary" onClick={handleInstallClick} style={{ width: '100%', padding: '14px', fontSize: 15 }}>
            📲 Install to Home Screen
          </button>
        ) : (
          <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-card)', borderRadius: 16, padding: '16px', textAlign: 'left', fontSize: 13, color: 'var(--text-secondary)' }}>
            <p style={{ margin: '0 0 6px', color: 'var(--text-primary)', fontWeight: 600 }}>
              To install directly:
            </p>
            <p style={{ margin: 0, lineHeight: 1.5 }}>
              Open your browser menu (<b>⋮</b> in Chrome or Edge) and tap <b>&quot;Install App&quot;</b> or <b>&quot;Add to Home screen&quot;</b>.
            </p>
          </div>
        )}

        <button className="btn btn-ghost" onClick={onClose} style={{ width: '100%', marginTop: 14 }}>
          Close
        </button>
      </div>
    </div>
  );
}
