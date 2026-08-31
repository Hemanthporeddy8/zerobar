'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../components/AuthProvider';
import RequireAuth from '../../components/RequireAuth';
import BottomNav from '../../components/BottomNav';
import PostCard from '../../components/PostCard';

function ProfileInner() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [postsCount, setPostsCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    if (!user) return;
    setLoading(true);

    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
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

    setLoading(false);
  }

  if (loading) {
    return <p className="empty-note">Loading…</p>;
  }

  return (
    <>
      <div className="profile-head">
        <div className="p-avatar">{profile?.avatar_emoji || '🧑'}</div>
        <div className="p-name">{profile?.username || 'You'}</div>
        <div className="p-handle">@{profile?.username || 'you'}</div>
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
        <button className="signout-btn" onClick={signOut}>
          Sign out
        </button>
      </div>
      <div className="section-label">Your posts &amp; reposts</div>
      {posts.length === 0 && <p className="empty-note">Nothing posted or reposted yet.</p>}
      {posts.map((p) => (
        <PostCard key={p.id} post={p} bookmarked={false} following={false} onChange={load} showFollow={false} />
      ))}

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
