'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../components/AuthProvider';
import RequireAuth from '../components/RequireAuth';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import PostCard from '../components/PostCard';
import ComposeModal from '../components/ComposeModal';
import SponsoredCard from '../components/SponsoredCard';
import { getOfflineStash, saveOfflineStash, getOfflineSettings } from '../lib/offlineStorage';

// How often a sponsored card appears in the feed — every Nth position.
const SPONSORED_EVERY = 4;

function FeedInner() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [sponsored, setSponsored] = useState([]);
  const [loading, setLoading] = useState(true);
  const [composeOpen, setComposeOpen] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const [followingIds, setFollowingIds] = useState(new Set());

  const loadFeed = useCallback(async () => {
    setLoading(true);

    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        // Direct offline load
        const stash = getOfflineStash();
        setPosts(stash.posts || []);
        setSponsored(stash.sponsored || []);
        setBookmarkedIds(new Set(stash.bookmarks || []));
        setLoading(false);
        return;
      }

      const { data: postData, error: postErr } = await supabase
        .from('posts')
        .select('*, profiles:user_id ( username, avatar_emoji )')
        .order('created_at', { ascending: false })
        .limit(60);

      const { data: sponsoredData } = await supabase
        .from('sponsored_posts')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (postErr) throw postErr;

      const livePosts = postData || [];
      const liveSponsored = sponsoredData || [];

      setPosts(livePosts);
      setSponsored(liveSponsored);

      let bmsList = [];
      if (user) {
        const { data: bms } = await supabase.from('bookmarks').select('post_id').eq('user_id', user.id);
        bmsList = (bms || []).map((b) => b.post_id);
        setBookmarkedIds(new Set(bmsList));

        const { data: fls } = await supabase.from('follows').select('following_id').eq('follower_id', user.id);
        setFollowingIds(new Set((fls || []).map((f) => f.following_id)));
      }

      // Auto stash with user data saver budget
      const settings = getOfflineSettings();
      saveOfflineStash({
        posts: livePosts,
        reels: livePosts.filter((p) => (p.kind || '').toLowerCase().startsWith('reel')),
        sponsored: liveSponsored,
        bookmarks: bmsList,
        budgetMB: settings.dataSaverMB || 2
      });
    } catch (err) {
      console.warn('Network load failed, falling back to offline stash:', err);
      const stash = getOfflineStash();
      setPosts(stash.posts || []);
      setSponsored(stash.sponsored || []);
      setBookmarkedIds(new Set(stash.bookmarks || []));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadFeed();

    const handleStashUpdate = () => {
      const stash = getOfflineStash();
      if (stash.posts?.length) {
        setPosts(stash.posts);
      }
    };

    window.addEventListener('zerobar_stash_updated', handleStashUpdate);
    window.addEventListener('online', loadFeed);

    return () => {
      window.removeEventListener('zerobar_stash_updated', handleStashUpdate);
      window.removeEventListener('online', loadFeed);
    };
  }, [loadFeed]);

  // Interleave sponsored cards into the feed every SPONSORED_EVERY posts.
  const items = [];
  let sponsoredIndex = 0;
  posts.forEach((p, i) => {
    items.push({ type: 'post', data: p });
    if ((i + 1) % SPONSORED_EVERY === 0 && sponsoredIndex < sponsored.length) {
      items.push({ type: 'sponsored', data: sponsored[sponsoredIndex] });
      sponsoredIndex += 1;
    }
  });

  return (
    <>
      <Header onRefresh={loadFeed} />
      <div className="section-label">Today's feed</div>
      {loading && <p className="empty-note">Loading…</p>}
      {!loading && posts.length === 0 && (
        <p className="empty-note">No posts yet — tap + and be the first.</p>
      )}
      {items.map((item) =>
        item.type === 'sponsored' ? (
          <SponsoredCard key={`sp-${item.data.id}`} post={item.data} />
        ) : (
          <PostCard
            key={item.data.id}
            post={item.data}
            bookmarked={bookmarkedIds.has(item.data.id)}
            following={followingIds.has(item.data.user_id)}
            onChange={loadFeed}
          />
        )
      )}
      <button className="fab" onClick={() => setComposeOpen(true)}>
        +
      </button>
      {composeOpen && <ComposeModal onClose={() => setComposeOpen(false)} onPosted={loadFeed} />}
      <BottomNav active="feed" />
    </>
  );
}

export default function FeedPage() {
  return (
    <RequireAuth>
      <FeedInner />
    </RequireAuth>
  );
}

