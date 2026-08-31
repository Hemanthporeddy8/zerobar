// Zerobar Offline Engine: Stash Manager, Data Saver Budgeting, & Outbox Auto-Sync

const STASH_KEY = 'zerobar_offline_stash';
const OUTBOX_KEY = 'zerobar_offline_outbox';
const SETTINGS_KEY = 'zerobar_offline_settings';

// Default data saver presets in Megabytes
export const DATA_SAVER_PRESETS = [
  { id: '1mb', label: '1 MB · Lite', mb: 1, maxPosts: 25, desc: 'Quick commute (text & compact stories)' },
  { id: '2mb', label: '2 MB · Standard', mb: 2, maxPosts: 50, desc: 'Subway / Train (~50 posts + reels)' },
  { id: '5mb', label: '5 MB · Flight Pack', mb: 5, maxPosts: 120, desc: 'Long flight / Full offline digest' },
  { id: '10mb', label: '10 MB · Heavy', mb: 10, maxPosts: 250, desc: 'Max offline archive' }
];

export function getOfflineSettings() {
  if (typeof window === 'undefined') {
    return { dataSaverMB: 2, autoStashOnWifi: true };
  }
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : { dataSaverMB: 2, autoStashOnWifi: true };
  } catch {
    return { dataSaverMB: 2, autoStashOnWifi: true };
  }
}

export function saveOfflineSettings(settings) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Could not save offline settings:', e);
    }
  }
}

export function getOfflineStash() {
  if (typeof window === 'undefined') {
    return { posts: [], reels: [], sponsored: [], bookmarks: [], meta: null };
  }
  try {
    const raw = localStorage.getItem(STASH_KEY);
    return raw ? JSON.parse(raw) : { posts: [], reels: [], sponsored: [], bookmarks: [], meta: null };
  } catch {
    return { posts: [], reels: [], sponsored: [], bookmarks: [], meta: null };
  }
}

function calculateSizeInBytes(obj) {
  try {
    const str = JSON.stringify(obj);
    return new Blob([str]).size;
  } catch {
    return 0;
  }
}

export function saveOfflineStash({ posts = [], reels = [], sponsored = [], bookmarks = [], budgetMB = 2 }) {
  if (typeof window === 'undefined') return;

  const maxBytes = budgetMB * 1024 * 1024;
  let currentBytes = 0;
  const filteredPosts = [];

  // Truncate list if it exceeds data budget
  for (const post of posts) {
    const postBytes = calculateSizeInBytes(post);
    if (currentBytes + postBytes > maxBytes) {
      break;
    }
    filteredPosts.push(post);
    currentBytes += postBytes;
  }

  const meta = {
    updatedAt: new Date().toISOString(),
    totalPosts: filteredPosts.length,
    totalBytes: currentBytes,
    budgetMB,
    sizeFormatted: (currentBytes / 1024).toFixed(1) + ' KB'
  };

  const stashData = {
    posts: filteredPosts,
    reels: reels.slice(0, 20),
    sponsored: sponsored.slice(0, 5),
    bookmarks: bookmarks || [],
    meta
  };

  try {
    localStorage.setItem(STASH_KEY, JSON.stringify(stashData));
    window.dispatchEvent(new CustomEvent('zerobar_stash_updated', { detail: meta }));
  } catch (e) {
    console.warn('Storage quota exceeded while caching stash:', e);
  }

  return meta;
}

// ----------------- OUTBOX MANAGEMENT -----------------

export function getOfflineOutbox() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(OUTBOX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveOfflineOutbox(actions) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(actions));
    window.dispatchEvent(new CustomEvent('zerobar_outbox_changed', { detail: { count: actions.length } }));
  } catch (e) {
    console.warn('Could not save outbox:', e);
  }
}

export function queueOfflineAction(action) {
  const outbox = getOfflineOutbox();
  const newAction = {
    id: `outbox-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    ...action
  };
  outbox.push(newAction);
  saveOfflineOutbox(outbox);

  // Optimistically update offline stash so user sees changes immediately
  applyOptimisticStashUpdate(newAction);
  return newAction;
}

function applyOptimisticStashUpdate(action) {
  const stash = getOfflineStash();
  if (action.type === 'CREATE_POST' && action.payload) {
    const tempPost = {
      id: action.payload.temp_id || `temp-${Date.now()}`,
      user_id: action.payload.user_id,
      category: action.payload.category || 'Trending',
      kind: action.payload.kind || 'Post',
      title: action.payload.title,
      media_emoji: action.payload.media_emoji || '✍️',
      created_at: new Date().toISOString(),
      profiles: action.payload.authorProfile || { username: 'You', avatar_emoji: '⚡' },
      _isOptimistic: true
    };
    stash.posts = [tempPost, ...stash.posts];
    if (tempPost.kind.toLowerCase().startsWith('reel')) {
      stash.reels = [tempPost, ...stash.reels];
    }
  } else if (action.type === 'REPOST' && action.payload) {
    const repost = {
      id: `repost-${Date.now()}`,
      user_id: action.payload.user_id,
      category: action.payload.category,
      kind: action.payload.kind,
      title: action.payload.title,
      media_emoji: action.payload.media_emoji,
      is_repost: true,
      repost_of: action.payload.repost_of,
      source_name: action.payload.source_name,
      created_at: new Date().toISOString(),
      profiles: action.payload.authorProfile || { username: 'You', avatar_emoji: '⚡' },
      _isOptimistic: true
    };
    stash.posts = [repost, ...stash.posts];
  } else if (action.type === 'TOGGLE_BOOKMARK' && action.payload) {
    if (action.payload.bookmarked) {
      if (!stash.bookmarks.includes(action.payload.post_id)) {
        stash.bookmarks.push(action.payload.post_id);
      }
    } else {
      stash.bookmarks = stash.bookmarks.filter((id) => id !== action.payload.post_id);
    }
  }

  try {
    localStorage.setItem(STASH_KEY, JSON.stringify(stash));
  } catch (e) {
    // Ignore
  }
}

// ----------------- SYNC OUTBOX WHEN RECONNECTED -----------------

export async function flushOfflineOutbox(supabaseClient, user) {
  const outbox = getOfflineOutbox();
  if (!outbox.length || !user) return { syncedCount: 0 };

  const remaining = [];
  let syncedCount = 0;

  for (const action of outbox) {
    try {
      if (action.type === 'CREATE_POST') {
        const { error } = await supabaseClient.from('posts').insert({
          user_id: user.id,
          category: action.payload.category,
          kind: action.payload.kind || 'Post',
          title: action.payload.title,
          media_emoji: action.payload.media_emoji || '✍️'
        });
        if (error) throw error;
        syncedCount++;
      } else if (action.type === 'REPOST') {
        const { error } = await supabaseClient.from('posts').insert({
          user_id: user.id,
          category: action.payload.category,
          kind: action.payload.kind || 'Post',
          title: action.payload.title,
          media_emoji: action.payload.media_emoji || '✍️',
          is_repost: true,
          repost_of: action.payload.repost_of,
          source_name: action.payload.source_name
        });
        if (error) throw error;
        syncedCount++;
      } else if (action.type === 'TOGGLE_BOOKMARK') {
        if (action.payload.bookmarked) {
          await supabaseClient.from('bookmarks').insert({ user_id: user.id, post_id: action.payload.post_id });
        } else {
          await supabaseClient.from('bookmarks').delete().eq('user_id', user.id).eq('post_id', action.payload.post_id);
        }
        syncedCount++;
      } else if (action.type === 'TOGGLE_FOLLOW') {
        if (action.payload.following) {
          await supabaseClient.from('follows').insert({ follower_id: user.id, following_id: action.payload.following_id });
        } else {
          await supabaseClient.from('follows').delete().eq('follower_id', user.id).eq('following_id', action.payload.following_id);
        }
        syncedCount++;
      } else if (action.type === 'REPORT') {
        await supabaseClient.from('reports').insert({
          post_id: action.payload.post_id,
          reporter_id: user.id,
          reason: action.payload.reason
        });
        syncedCount++;
      } else if (action.type === 'AD_EVENT') {
        await supabaseClient.from('ad_events').insert({
          sponsored_post_id: action.payload.sponsored_post_id,
          event_type: action.payload.event_type,
          viewer_id: user.id
        });
        syncedCount++;
      }
    } catch (err) {
      console.error('Failed to sync action:', action, err);
      remaining.push(action);
    }
  }

  saveOfflineOutbox(remaining);
  if (syncedCount > 0 && typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('zerobar_sync_notification', {
        detail: { message: `Synced ${syncedCount} offline action${syncedCount > 1 ? 's' : ''} to community` }
      })
    );
  }

  return { syncedCount, remainingCount: remaining.length };
}
