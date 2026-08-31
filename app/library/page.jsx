'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../components/AuthProvider';
import RequireAuth from '../../components/RequireAuth';
import Header from '../../components/Header';
import BottomNav from '../../components/BottomNav';
import PostCard from '../../components/PostCard';

function LibraryInner() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('bookmarks')
      .select('post_id, posts:post_id ( *, profiles:user_id ( username, avatar_emoji ) )')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setPosts((data || []).map((row) => row.posts).filter(Boolean));
    setLoading(false);
  }

  return (
    <>
      <Header />
      <div className="section-label">Your library</div>
      {loading && <p className="empty-note">Loading…</p>}
      {!loading && posts.length === 0 && (
        <p className="empty-note">Nothing added yet — tap 🔖 Add on any post in your feed.</p>
      )}
      {posts.map((p) => (
        <PostCard key={p.id} post={p} bookmarked={true} following={false} onChange={load} showFollow={false} />
      ))}
      <BottomNav active="library" />
    </>
  );
}

export default function LibraryPage() {
  return (
    <RequireAuth>
      <LibraryInner />
    </RequireAuth>
  );
}
