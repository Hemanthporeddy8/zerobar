'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../components/AuthProvider';

export default function AdminModerationPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [postsMap, setPostsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [passError, setPassError] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  const ADMIN_PASS = 'zerobar2026';

  function handleUnlock(e) {
    e.preventDefault();
    if (passcode.trim() === ADMIN_PASS || (user && user.email?.includes('admin'))) {
      setIsAuthenticated(true);
      setPassError('');
      loadReports();
    } else {
      setPassError('Invalid admin passcode. (Default: zerobar2026)');
    }
  }

  async function loadReports() {
    setLoading(true);
    try {
      const { data: reportData } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      const allReports = reportData || [];
      setReports(allReports);

      if (allReports.length > 0) {
        const postIds = allReports.map((r) => r.post_id).filter(Boolean);
        const { data: postData } = await supabase
          .from('posts')
          .select('*, profiles:user_id ( username, avatar_emoji )')
          .in('id', postIds);

        const map = {};
        (postData || []).forEach((p) => {
          map[p.id] = p;
        });
        setPostsMap(map);
      }
    } catch (err) {
      console.error('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  }

  async function dismissReport(reportId) {
    await supabase.from('reports').delete().eq('id', reportId);
    setActionMsg('Report dismissed.');
    setTimeout(() => setActionMsg(''), 3000);
    loadReports();
  }

  async function deleteReportedPost(postId, reportId) {
    if (!window.confirm('Are you sure you want to permanently delete this post?')) return;
    await supabase.from('posts').delete().eq('id', postId);
    await supabase.from('reports').delete().eq('id', reportId);
    setActionMsg('Post and report successfully deleted.');
    setTimeout(() => setActionMsg(''), 3000);
    loadReports();
  }

  if (!isAuthenticated) {
    return (
      <div className="auth-wrap" style={{ maxWidth: 420 }}>
        <Link href="/" style={{ color: 'var(--amber)', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 20, fontFamily: "'IBM Plex Mono', monospace" }}>
          ← Back to Feed
        </Link>
        <h1 style={{ fontSize: 24, marginBottom: 6 }}>Admin Moderation</h1>
        <p className="sub">Enter your security key to review flagged posts.</p>

        <form onSubmit={handleUnlock}>
          <div className="field">
            <label>Admin Key</label>
            <input
              type="password"
              placeholder="Enter passcode (zerobar2026)"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              required
            />
          </div>
          {passError && <p className="auth-error">{passError}</p>}
          <button className="btn btn-primary" type="submit" style={{ width: '100%', marginTop: 8 }}>
            Unlock Moderation Panel
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="auth-wrap" style={{ maxWidth: 640, padding: '30px 18px 80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Link href="/" style={{ color: 'var(--amber)', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: "'IBM Plex Mono', monospace" }}>
          ← Back to Feed
        </Link>
        <button
          className="icon-btn"
          onClick={loadReports}
          style={{ width: 'auto', padding: '4px 12px', fontSize: 12, borderRadius: 999 }}
        >
          🔄 Refresh
        </button>
      </div>

      <h1 style={{ fontSize: 24, marginBottom: 4 }}>Flagged Content Reports</h1>
      <p style={{ color: 'var(--mist)', fontSize: 13, marginBottom: 20 }}>
        Review user-reported posts and maintain community safety.
      </p>

      {actionMsg && (
        <div style={{ padding: '8px 12px', background: 'rgba(74, 222, 128, 0.15)', border: '1px solid var(--green)', borderRadius: 10, color: 'var(--green)', fontSize: 13, marginBottom: 16 }}>
          ✓ {actionMsg}
        </div>
      )}

      {loading && <p className="empty-note">Loading reported items…</p>}

      {!loading && reports.length === 0 && (
        <div style={{ textAlign: 'center', padding: '50px 20px', background: 'var(--indigo-2)', borderRadius: 16, border: '1px solid var(--line)' }}>
          <p style={{ fontSize: 32, margin: '0 0 10px' }}>🛡️</p>
          <p style={{ fontWeight: 600, fontSize: 16, margin: '0 0 6px' }}>All clean!</p>
          <p style={{ color: 'var(--mist-dim)', fontSize: 13, margin: 0 }}>No open reports at this time.</p>
        </div>
      )}

      {!loading &&
        reports.map((report) => {
          const post = postsMap[report.post_id];
          return (
            <div
              key={report.id}
              style={{
                background: 'var(--indigo-2)',
                border: '1px solid var(--line)',
                borderRadius: 16,
                padding: 16,
                marginBottom: 16
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <span style={{ background: 'rgba(255, 107, 74, 0.2)', color: 'var(--rust)', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}>
                  🚩 Flagged: {report.reason}
                </span>
                <span style={{ fontSize: 11, color: 'var(--mist-dim)', fontFamily: "'IBM Plex Mono', monospace" }}>
                  {new Date(report.created_at).toLocaleDateString()}
                </span>
              </div>

              {post ? (
                <div style={{ background: 'var(--ink)', padding: 12, borderRadius: 12, border: '1px solid var(--line)', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 12 }}>
                    <span>{post.profiles?.avatar_emoji || '🧑'}</span>
                    <span style={{ fontWeight: 600 }}>@{post.profiles?.username || 'unknown'}</span>
                    <span style={{ color: 'var(--mist-dim)', fontSize: 11 }}>· {post.kind}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 14, fontFamily: "'Newsreader', serif", color: 'var(--paper)' }}>
                    {post.title}
                  </p>
                </div>
              ) : (
                <p style={{ color: 'var(--mist-dim)', fontStyle: 'italic', fontSize: 13, marginBottom: 14 }}>
                  (Target post already removed or not found)
                </p>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="btn btn-ghost"
                  onClick={() => dismissReport(report.id)}
                  style={{ padding: '8px 14px', fontSize: 12.5 }}
                >
                  Dismiss Report
                </button>
                {post && (
                  <button
                    className="btn"
                    onClick={() => deleteReportedPost(post.id, report.id)}
                    style={{
                      background: 'rgba(255, 107, 74, 0.2)',
                      border: '1px solid var(--rust)',
                      color: 'var(--rust)',
                      padding: '8px 14px',
                      fontSize: 12.5
                    }}
                  >
                    🗑️ Delete Post
                  </button>
                )}
              </div>
            </div>
          );
        })}
    </div>
  );
}
