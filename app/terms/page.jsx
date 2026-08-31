'use client';

import Link from 'next/link';

export default function TermsOfServicePage() {
  return (
    <div className="auth-wrap" style={{ maxWidth: 580, padding: '40px 20px 80px' }}>
      <Link href="/" style={{ color: 'var(--amber)', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 20, fontFamily: "'IBM Plex Mono', monospace" }}>
        ← Back to Feed
      </Link>

      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Terms of Service</h1>
      <p style={{ color: 'var(--mist-dim)', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", marginBottom: 24 }}>
        Last updated: August 31, 2026 · Effective immediately
      </p>

      <div style={{ color: 'var(--paper)', fontSize: 14.5, lineHeight: 1.6 }}>
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, color: 'var(--amber)', marginBottom: 8 }}>1. Acceptance of Terms</h2>
          <p style={{ color: 'var(--mist)' }}>
            By creating an account or accessing Zerobar, you agree to comply with these Terms of Service. If you do not agree, please do not use the service.
          </p>
        </section>

        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, color: 'var(--amber)', marginBottom: 8 }}>2. User-Generated Content &amp; Conduct</h2>
          <p style={{ color: 'var(--mist)' }}>
            You retain ownership of the content you publish on Zerobar. By posting, you grant Zerobar a non-exclusive license to display and distribute your content across the platform. You agree not to post:
          </p>
          <ul style={{ color: 'var(--mist)', paddingLeft: 20 }}>
            <li>Illegal, threatening, defamatory, or abusive material.</li>
            <li>Content that infringes upon third-party intellectual property or copyright.</li>
            <li>Automated spam, malware, or deceptive phishing links.</li>
          </ul>
        </section>

        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, color: 'var(--amber)', marginBottom: 8 }}>3. Content Moderation &amp; Reporting</h2>
          <p style={{ color: 'var(--mist)' }}>
            Zerobar maintains a community reporting tool. Content flagged as violating our standards or applicable regulations may be reviewed and removed without prior notice. Accounts engaging in repeat violations may be suspended or permanently banned.
          </p>
        </section>

        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, color: 'var(--amber)', marginBottom: 8 }}>4. Offline Availability &amp; Disclaimer</h2>
          <p style={{ color: 'var(--mist)' }}>
            While Zerobar provides offline caching for convenience, offline availability depends on your device&apos;s storage capacity and operating system cache retention policies. The service is provided &quot;as is&quot; without warranties of uninterrupted availability.
          </p>
        </section>

        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, color: 'var(--amber)', marginBottom: 8 }}>5. Advertiser Terms</h2>
          <p style={{ color: 'var(--mist)' }}>
            Businesses publishing sponsored cards must provide accurate business identification (including valid GST registration where required) and ensure all promotional claims adhere to applicable advertising standards.
          </p>
        </section>

        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, color: 'var(--amber)', marginBottom: 8 }}>6. Contact Information</h2>
          <p style={{ color: 'var(--mist)' }}>
            For legal inquiries or terms clarification, reach out to <code>legal@zerobar.app</code>.
          </p>
        </section>
      </div>

      <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid var(--line)', textAlign: 'center', fontSize: 12, color: 'var(--mist-dim)' }}>
        <Link href="/privacy" style={{ color: 'var(--amber)', marginRight: 16 }}>Privacy Policy</Link>
        <Link href="/">Feed</Link>
      </div>
    </div>
  );
}
