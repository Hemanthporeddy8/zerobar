'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../components/AuthProvider';
import RequireAuth from '../../components/RequireAuth';
import Header from '../../components/Header';
import BottomNav from '../../components/BottomNav';
import PostCard from '../../components/PostCard';
import { getOfflineStash } from '../../lib/offlineStorage';

function ReelsInner() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const stash = getOfflineStash();
        const cachedReels = stash.reels?.length
          ? stash.reels
          : (stash.posts || []).filter((p) => (p.kind || '').toLowerCase().startsWith('reel'));
        setPosts(cachedReels);
        setBookmarkedIds(new Set(stash.bookmarks || []));
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles:user_id ( username, avatar_emoji )')
        .ilike('kind', 'Reel%')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);

      if (user) {
        const { data: bms } = await supabase.from('bookmarks').select('post_id').eq('user_id', user.id);
        setBookmarkedIds(new Set((bms || []).map((b) => b.post_id)));
      }
    } catch (err) {
      console.warn('Reels fetch failed, reading from offline stash:', err);
      const stash = getOfflineStash();
      const cachedReels = stash.reels?.length
        ? stash.reels
        : (stash.posts || []).filter((p) => (p.kind || '').toLowerCase().startsWith('reel'));
      setPosts(cachedReels);
      setBookmarkedIds(new Set(stash.bookmarks || []));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
    window.addEventListener('online', load);
    return () => window.removeEventListener('online', load);
  }, [load]);

  return (
    <>
      <Header onRefresh={load} />
      <div className="section-label">Reels</div>
      {loading && <p className="empty-note">Loading…</p>}
      {!loading && posts.length === 0 && <p className="empty-note">No reels stashed yet.</p>}
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

