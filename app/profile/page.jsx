'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../components/AuthProvider';
import RequireAuth from '../../components/RequireAuth';
import BottomNav from '../../components/BottomNav';
import PostCard from '../../components/PostCard';
import EditProfileModal from '../../components/EditProfileModal';
import ThemeModal from '../../components/ThemeModal';
import { getOfflineStash, clearOfflineStash, getOfflineSettings } from '../../lib/offlineStorage';

function ProfileInner() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [postsCount, setPostsCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Edit Profile Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);

  // Tabs: 'posts' or 'stash'
  const [activeTab, setActiveTab] = useState('posts');

  // Offline Storage HUD stats
  const [stashData, setStashData] = useState({ posts: [], meta: null });
  const [settings, setSettings] = useState({ dataSaverMB: 2 });
  const [stashClearedNotice, setStashClearedNotice] = useState(false);

  const refreshStashStats = useCallback(() => {
    const stash = getOfflineStash();
    setStashData(stash);
    setSettings(getOfflineSettings());
  }, []);

  useEffect(() => {
    refreshStashStats();

    const handleStashUpdate = () => {
      refreshStashStats();
    };

    window.addEventListener('zerobar_stash_updated', handleStashUpdate);
    return () => {
      window.removeEventListener('zerobar_stash_updated', handleStashUpdate);
    };
  }, [refreshStashStats]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(profileData);

      const { data: myPosts, count: pCount } = await supabase
        .from('posts')
        .select('*, profiles:user_id ( username, avatar_emoji )', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setPosts(myPosts || []);
      setPostsCount(pCount || 0);

      const { count: followers } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', user.id);
      setFollowersCount(followers || 0);

      const { count: following } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', user.id);
      setFollowingCount(following || 0);
    } catch (err) {
      console.warn('Error loading profile data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  function handleProfileSaved(updatedFields) {
    setProfile((prev) => ({ ...prev, ...updatedFields }));
    load();
  }

  function handleClearStash() {
    if (confirm('Clear your offline cached stories? They will be re-downloaded next time you connect.')) {
      clearOfflineStash();
      refreshStashStats();
      setStashClearedNotice(true);
      setTimeout(() => setStashClearedNotice(false), 3000);
    }
  }

  if (loading) {
    return <p className="empty-note">Loading profile…</p>;
  }

  const stashedPosts = stashData.posts || [];
  const stashSizeText = stashData.meta?.sizeFormatted || `${Math.round(JSON.stringify(stashedPosts).length / 1024)} KB`;

  return (
    <>
      {/* Profile Header */}
      <div className="profile-head">
        <div className="p-avatar">{profile?.avatar_emoji || '🧑'}</div>
        <div className="p-name">{profile?.username || 'You'}</div>
        <div className="p-handle">@{profile?.username || 'you'}</div>

        {/* Bio */}
        {profile?.bio ? (
          <p className="p-bio">{profile.bio}</p>
        ) : (
          <p className="p-bio empty">No bio yet. Tap &quot;Edit Profile&quot; to introduce yourself.</p>
        )}

        {/* Stats */}
        <div className="p-stats">
          <div>
            <b>{postsCount}</b>
            <span>POSTS</span>
          </div>
          <div>
            <b>{followersCount}</b>
            <span>FOLLOWERS</span>
          </div>
          <div>
            <b>{followingCount}</b>
            <span>FOLLOWING</span>
          </div>
        </div>

        {/* Profile Action Buttons */}
        <div className="profile-btn-row">
          <button className="edit-profile-btn" onClick={() => setEditModalOpen(true)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              <path d="m15 5 4 4" />
            </svg>
            Edit Profile
          </button>
          <button
            className="signout-btn"
            onClick={() => setThemeModalOpen(true)}
            title="Change Theme"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            <span>🎨</span> Themes
          </button>
          <button className="signout-btn" onClick={signOut}>
            Sign out
          </button>
        </div>
      </div>

      {/* Offline Storage & Data Saver HUD */}
      <div className="storage-hud-card">
        <div className="storage-hud-header">
          <div className="storage-hud-title">
            <span>📦</span> Offline Stash Engine
          </div>
          <span className="storage-hud-badge">
            {settings.dataSaverMB || 2} MB Data Saver
          </span>
        </div>

        <div className="storage-hud-body">
          <div>
            <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
              {stashedPosts.length} stories
            </span>
            <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>
              ({stashSizeText} used)
            </span>
          </div>

          {stashedPosts.length > 0 ? (
            <button className="storage-clear-btn" onClick={handleClearStash}>
              Clear Cache
            </button>
          ) : (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Stash empty</span>
          )}
        </div>

        {stashClearedNotice && (
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--signal-green)', fontFamily: "'IBM Plex Mono', monospace" }}>
            ✓ Cache cleared successfully.
          </div>
        )}
      </div>

      {/* Activity Tabs */}
      <div className="profile-tab-bar">
        <button
          className={`profile-tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          Your Posts ({postsCount})
        </button>
        <button
          className={`profile-tab-btn ${activeTab === 'stash' ? 'active' : ''}`}
          onClick={() => setActiveTab('stash')}
        >
          Offline Stash ({stashedPosts.length})
        </button>
      </div>

      {/* Tab Content: User Posts */}
      {activeTab === 'posts' && (
        <>
          {posts.length === 0 && (
            <p className="empty-note">Nothing published or reposted yet. Tap + to publish.</p>
          )}
          {posts.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              bookmarked={false}
              following={false}
              onChange={load}
              showFollow={false}
            />
          ))}
        </>
      )}

      {/* Tab Content: Offline Stash */}
      {activeTab === 'stash' && (
        <>
          {stashedPosts.length === 0 && (
            <p className="empty-note">No stories currently in your offline stash. Go to the feed or tap &quot;Download Stash&quot; to save stories.</p>
          )}
          {stashedPosts.map((p) => (
            <PostCard
              key={`stashed-${p.id}`}
              post={p}
              bookmarked={false}
              following={false}
              onChange={refreshStashStats}
              showFollow={false}
            />
          ))}
        </>
      )}

      {/* Platform & Legal Footer */}
      <div style={{ marginTop: 30, padding: '20px 16px 40px', borderTop: '1px solid var(--line)', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 14, fontSize: 12, color: 'var(--mist-dim)', fontFamily: "'IBM Plex Mono', monospace" }}>
          <a href="/advertise" style={{ color: 'var(--amber)' }}>📣 Advertise</a>
          <a href="/admin" style={{ color: 'var(--mist)' }}>🛡️ Admin</a>
          <a href="/privacy" style={{ color: 'var(--mist)' }}>Privacy</a>
          <a href="/terms" style={{ color: 'var(--mist)' }}>Terms</a>
        </div>
        <p style={{ color: 'var(--mist-dim)', fontSize: 10.5, marginTop: 10, fontFamily: "'IBM Plex Mono', monospace" }}>
          Zerobar v1.0 · Offline-first social reader
        </p>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        profile={profile}
        onSaved={handleProfileSaved}
      />

      {/* Theme Selection Modal */}
      <ThemeModal
        isOpen={themeModalOpen}
        onClose={() => setThemeModalOpen(false)}
      />

      <BottomNav active="profile" />
    </>
  );
}

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileInner />
    </RequireAuth>
  );
}
