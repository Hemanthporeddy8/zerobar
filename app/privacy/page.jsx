'use client';

import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="auth-wrap" style={{ maxWidth: 580, padding: '40px 20px 80px' }}>
      <Link href="/" style={{ color: 'var(--amber)', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 20, fontFamily: "'IBM Plex Mono', monospace" }}>
        ← Back to Feed
      </Link>

      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Privacy Policy</h1>
      <p style={{ color: 'var(--mist-dim)', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", marginBottom: 24 }}>
        Last updated: August 31, 2026 · Effective immediately
      </p>

      <div style={{ color: 'var(--paper)', fontSize: 14.5, lineHeight: 1.6 }}>
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, color: 'var(--amber)', marginBottom: 8 }}>1. Our Privacy Philosophy</h2>
          <p style={{ color: 'var(--mist)' }}>
            Zerobar is built with a <b>privacy-first, low-bandwidth architecture</b>. We believe in providing a seamless, fast social reading experience without intrusive surveillance, data harvesting, or third-party ad networks.
          </p>
        </section>

        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, color: 'var(--amber)', marginBottom: 8 }}>2. Information We Collect</h2>
          <ul style={{ color: 'var(--mist)', paddingLeft: 20 }}>
            <li><b>Account Information:</b> When you sign up, we collect your email address and preferred username to authenticate your session.</li>
            <li><b>User-Generated Content:</b> Posts, reposts, bookmarks, follows, and reports you create within the platform.</li>
            <li><b>Direct Ad Performance Data:</b> Aggregated impression and click counts for direct-sold sponsored cards. We do not track individual cross-site browsing behavior.</li>
          </ul>
        </section>

        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, color: 'var(--amber)', marginBottom: 8 }}>3. Offline Caching &amp; Local Storage</h2>
          <p style={{ color: 'var(--mist)' }}>
            To enable offline reading on flights and subways, Zerobar stores recent feed posts, user bookmarks, and pending outbox actions in your browser&apos;s <code>localStorage</code> and <code>CacheStorage</code>. This data resides on your physical device and can be cleared at any time through your browser settings.
          </p>
        </section>

        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, color: 'var(--amber)', marginBottom: 8 }}>4. Zero Third-Party Ad Networks</h2>
          <p style={{ color: 'var(--mist)' }}>
            Zerobar does <b>not</b> use third-party programmatic ad networks (e.g. Google AdSense, Meta Pixel, or data brokers). All sponsored posts are direct-sold and served directly from our database, ensuring your reading habits are never sold to external advertisers.
          </p>
        </section>

        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, color: 'var(--amber)', marginBottom: 8 }}>5. Data Retention &amp; User Rights</h2>
          <p style={{ color: 'var(--mist)' }}>
            You have the right to request deletion of your account and all associated posts, bookmarks, and personal data at any time by contacting support.
          </p>
        </section>

        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, color: 'var(--amber)', marginBottom: 8 }}>6. Contact Us</h2>
          <p style={{ color: 'var(--mist)' }}>
            For privacy inquiries or data requests, please contact us at <code>privacy@zerobar.app</code>.
          </p>
        </section>
      </div>

      <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid var(--line)', textAlign: 'center', fontSize: 12, color: 'var(--mist-dim)' }}>
        <Link href="/terms" style={{ color: 'var(--amber)', marginRight: 16 }}>Terms of Service</Link>
        <Link href="/">Feed</Link>
      </div>
    </div>
  );
}
