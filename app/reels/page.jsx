'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../components/AuthProvider';
import RequireAuth from '../../components/RequireAuth';
import Header from '../../components/Header';
import BottomNav from '../../components/BottomNav';
import PostCard from '../../components/PostCard';

function ReelsInner() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('posts')
      .select('*, profiles:user_id ( username, avatar_emoji )')
      .ilike('kind', 'Reel%')
      .order('created_at', { ascending: false });
    setPosts(data || []);

    if (user) {
      const { data: bms } = await supabase.from('bookmarks').select('post_id').eq('user_id', user.id);
      setBookmarkedIds(new Set((bms || []).map((b) => b.post_id)));
    }
    setLoading(false);
  }

  return (
    <>
      <Header />
      <div className="section-label">Reels</div>
      {loading && <p className="empty-note">Loading…</p>}
      {!loading && posts.length === 0 && <p className="empty-note">No reels yet.</p>}
      {posts.map((p) => (
        <PostCard key={p.id} post={p} bookmarked={bookmarkedIds.has(p.id)} following={false} onChange={load} />
      ))}
      <BottomNav active="reels" />
    </>
  );
}

export default function ReelsPage() {
  return (
    <RequireAuth>
      <ReelsInner />
    </RequireAuth>
  );
}
