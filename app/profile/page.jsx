'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../components/AuthProvider';
import RequireAuth from '../../components/RequireAuth';
import BottomNav from '../../components/BottomNav';
import PostCard from '../../components/PostCard';
import EditProfileModal from '../../components/EditProfileModal';
import ThemeModal from '../../components/ThemeModal';

function ProfileInner() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [postsCount, setPostsCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modals
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);

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

  if (loading) {
    return <p className="empty-note">Loading profile…</p>;
  }

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

      {/* User's Published Stories Stream */}
      <div className="section-label">Your published stories ({postsCount})</div>
      {posts.length === 0 && (
        <p className="empty-note">Nothing published or reposted yet. Tap + on the feed to write a story.</p>
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

      {/* Platform & Legal Footer */}
      <div style={{ marginTop: 30, padding: '20px 16px 40px', borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 14, fontSize: 12, color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
          <a href="/advertise" style={{ color: 'var(--brand-amber)' }}>📣 Advertise</a>
          <a href="/admin" style={{ color: 'var(--text-secondary)' }}>🛡️ Admin</a>
          <a href="/privacy" style={{ color: 'var(--text-secondary)' }}>Privacy</a>
          <a href="/terms" style={{ color: 'var(--text-secondary)' }}>Terms</a>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 10.5, marginTop: 10, fontFamily: "'IBM Plex Mono', monospace" }}>
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
