// In-memory & LocalStorage Mock Supabase Client for Zerobar
// Allows the entire webapp to function with dummy data before connecting real Supabase credentials.

const DEFAULT_USER = {
  id: 'user-zerobar-demo',
  email: 'demo@zerobar.app',
  user_metadata: {
    username: 'hemanth'
  }
};

const DEFAULT_PROFILES = [
  { id: 'user-zerobar-demo', username: 'hemanth', avatar_emoji: '⚡', bio: 'Building low-bandwidth webapps' },
  { id: 'user-1', username: 'sarah_dev', avatar_emoji: '👩‍💻', bio: 'Frontend engineer & offline enthusiast' },
  { id: 'user-2', username: 'alex_tech', avatar_emoji: '🚀', bio: 'Building the future of mobile web' },
  { id: 'user-3', username: 'priya_m', avatar_emoji: '🎨', bio: 'Design & product minimalism' },
  { id: 'user-4', username: 'metro_updates', avatar_emoji: '🚇', bio: 'Real-time urban transit news' }
];

const DEFAULT_POSTS = [
  {
    id: 'post-1',
    user_id: 'user-4',
    category: 'Local',
    kind: 'Quick read',
    title: 'Metro Yellow Line frequency increased to every 3 minutes during morning rush hour.',
    media_emoji: '🚇',
    is_repost: false,
    repost_of: null,
    source_name: null,
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString()
  },
  {
    id: 'post-2',
    user_id: 'user-1',
    category: 'Tech',
    kind: 'Post',
    title: 'Why offline-first apps are the future of mobile web: zero loading spinners, instant sync anywhere.',
    media_emoji: '⚡',
    is_repost: false,
    repost_of: null,
    source_name: null,
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString()
  },
  {
    id: 'post-3',
    user_id: 'user-2',
    category: 'Trending',
    kind: 'Quick read',
    title: 'POV: You are in an elevator with zero network bars but your feed keeps scrolling smoothly 📶❌',
    media_emoji: '⚡',
    is_repost: false,
    repost_of: null,
    source_name: null,
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString()
  },
  {
    id: 'post-4',
    user_id: 'user-3',
    category: 'Career',
    kind: 'Quick read',
    title: 'Frontend interview tip: Master service workers and cache storage. Huge differentiator for senior engineering roles.',
    media_emoji: '💡',
    is_repost: false,
    repost_of: null,
    source_name: null,
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString()
  },
  {
    id: 'post-5',
    user_id: 'user-2',
    category: 'Trending',
    kind: 'Post',
    title: 'Daily commuter routine with Zerobar: 5 stories digested before reaching the station.',
    media_emoji: '🎧',
    is_repost: false,
    repost_of: null,
    source_name: null,
    created_at: new Date(Date.now() - 1000 * 60 * 300).toISOString()
  },
  {
    id: 'post-6',
    user_id: 'user-zerobar-demo',
    category: 'Trending',
    kind: 'Post',
    title: 'Zerobar live preview: Fast, minimal, low data consumption web reader.',
    media_emoji: '🚀',
    is_repost: false,
    repost_of: null,
    source_name: null,
    created_at: new Date(Date.now() - 1000 * 60 * 600).toISOString()
  }
];

const DEFAULT_SPONSORED = [
  {
    id: 'sp-1',
    advertiser_id: 'adv-1',
    title: 'HyperFast Fiber: 300 Mbps unlimited bandwidth for remote developers. First month free.',
    media_emoji: '📣',
    category: 'Tech',
    cta_label: 'Claim Offer',
    cta_url: 'https://example.com',
    active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'sp-2',
    advertiser_id: 'adv-1',
    title: 'DevSpace Workstations: Quiet desks & backup high-speed lines in central tech hub.',
    media_emoji: '☕',
    category: 'Local',
    cta_label: 'Book Day Pass',
    cta_url: 'https://example.com',
    active: true,
    created_at: new Date().toISOString()
  }
];

const DEFAULT_PLANS = [
  {
    id: 'plan-1',
    name: 'Local Starter',
    price_inr: 2999,
    duration_days: 30,
    max_active_posts: 1,
    description: 'One sponsored card in the feed for 30 days — good for local businesses.',
    created_at: new Date().toISOString()
  },
  {
    id: 'plan-2',
    name: 'Regional Growth',
    price_inr: 9999,
    duration_days: 30,
    max_active_posts: 3,
    description: 'Up to 3 sponsored cards, priority placement, basic performance report.',
    created_at: new Date().toISOString()
  },
  {
    id: 'plan-3',
    name: 'Brand Partner',
    price_inr: 24999,
    duration_days: 30,
    max_active_posts: 8,
    description: 'Up to 8 sponsored cards, featured placement, downloadable performance report.',
    created_at: new Date().toISOString()
  }
];

const DEFAULT_ADVERTISERS = [
  {
    id: 'adv-1',
    user_id: 'user-zerobar-demo',
    company_name: 'HyperFast Tech',
    contact_email: 'ads@hyperfast.example',
    gst_number: '29AAAAA0000A1Z5',
    created_at: new Date().toISOString()
  }
];

const DEFAULT_AD_EVENTS = [
  { id: 'ev-1', sponsored_post_id: 'sp-1', event_type: 'impression' },
  { id: 'ev-2', sponsored_post_id: 'sp-1', event_type: 'impression' },
  { id: 'ev-3', sponsored_post_id: 'sp-1', event_type: 'impression' },
  { id: 'ev-4', sponsored_post_id: 'sp-1', event_type: 'click' },
  { id: 'ev-5', sponsored_post_id: 'sp-2', event_type: 'impression' }
];

const DEFAULT_REACTIONS = [
  { id: 'react-1', user_id: 'user-zerobar-demo', post_id: 'post-2', reaction_type: 'like', created_at: new Date().toISOString() },
  { id: 'react-2', user_id: 'user-1', post_id: 'post-1', reaction_type: 'like', created_at: new Date().toISOString() },
  { id: 'react-3', user_id: 'user-2', post_id: 'post-2', reaction_type: 'like', created_at: new Date().toISOString() }
];

const DEFAULT_BOOKMARKS = [
  { user_id: 'user-zerobar-demo', post_id: 'post-2', created_at: new Date().toISOString() }
];

const DEFAULT_FOLLOWS = [
  { follower_id: 'user-zerobar-demo', following_id: 'user-1', created_at: new Date().toISOString() }
];

function getStore() {
  if (typeof window === 'undefined') {
    return {
      currentUser: DEFAULT_USER,
      profiles: [...DEFAULT_PROFILES],
      posts: [...DEFAULT_POSTS],
      post_reactions: [...DEFAULT_REACTIONS],
      sponsored_posts: [...DEFAULT_SPONSORED],
      subscription_plans: [...DEFAULT_PLANS],
      advertisers: [...DEFAULT_ADVERTISERS],
      ad_events: [...DEFAULT_AD_EVENTS],
      ad_subscriptions: [],
      bookmarks: [...DEFAULT_BOOKMARKS],
      follows: [...DEFAULT_FOLLOWS],
      reports: []
    };
  }

  const saved = localStorage.getItem('zerobar_mock_store');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (!parsed.post_reactions) parsed.post_reactions = [...DEFAULT_REACTIONS];
      return parsed;
    } catch {
      // Fallback
    }
  }

  const initial = {
    currentUser: DEFAULT_USER,
    profiles: [...DEFAULT_PROFILES],
    posts: [...DEFAULT_POSTS],
    post_reactions: [...DEFAULT_REACTIONS],
    sponsored_posts: [...DEFAULT_SPONSORED],
    subscription_plans: [...DEFAULT_PLANS],
    advertisers: [...DEFAULT_ADVERTISERS],
    ad_events: [...DEFAULT_AD_EVENTS],
    ad_subscriptions: [],
    bookmarks: [...DEFAULT_BOOKMARKS],
    follows: [...DEFAULT_FOLLOWS],
    reports: []
  };
  saveStore(initial);
  return initial;
}


function saveStore(store) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('zerobar_mock_store', JSON.stringify(store));
    } catch {
      // Ignore quota errors
    }
  }
}

const authListeners = new Set();

function notifyAuthChange(event, session) {
  authListeners.forEach((fn) => {
    try {
      fn(event, session);
    } catch (e) {
      console.error(e);
    }
  });
}

class MockQueryBuilder {
  constructor(tableName) {
    this.tableName = tableName;
    this.filters = [];
    this.sort = null;
    this.limitCount = null;
    this.selectedColumns = '*';
    this.isSingle = false;
    this.isMaybeSingle = false;
    this.countOptions = null;
    this.operation = 'select';
    this.insertPayload = null;
  }

  select(columns = '*', options = null) {
    this.selectedColumns = columns;
    this.countOptions = options;
    return this;
  }

  insert(payload) {
    this.operation = 'insert';
    this.insertPayload = payload;
    return this.execute();
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  update(payload) {
    this.operation = 'update';
    this.updatePayload = payload;
    return this;
  }

  eq(column, value) {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  ilike(column, pattern) {
    const clean = pattern.replace(/%/g, '').toLowerCase();
    this.filters.push((row) => {
      const val = String(row[column] || '').toLowerCase();
      return val.includes(clean);
    });
    return this;
  }

  in(column, values) {
    this.filters.push((row) => values.includes(row[column]));
    return this;
  }

  order(column, { ascending = true } = {}) {
    this.sort = { column, ascending };
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this.execute();
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this.execute();
  }

  async execute() {
    const store = getStore();
    const table = store[this.tableName] || [];

    if (this.operation === 'insert') {
      const items = Array.isArray(this.insertPayload) ? this.insertPayload : [this.insertPayload];
      const newItems = items.map((item) => {
        const id = item.id || `mock-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        return {
          id,
          created_at: new Date().toISOString(),
          ...item
        };
      });

      store[this.tableName] = [...newItems, ...table];

      // Auto create profile row if this is an advertiser or user
      saveStore(store);
      return { data: Array.isArray(this.insertPayload) ? newItems : newItems[0], error: null };
    }

    if (this.operation === 'delete') {
      let remaining = table;
      if (this.filters.length > 0) {
        remaining = table.filter((row) => !this.filters.every((fn) => fn(row)));
      }
      store[this.tableName] = remaining;
      saveStore(store);
      return { data: null, error: null };
    }

    if (this.operation === 'update') {
      const updated = table.map((row) => {
        if (this.filters.every((fn) => fn(row))) {
          return { ...row, ...this.updatePayload };
        }
        return row;
      });
      store[this.tableName] = updated;
      saveStore(store);
      return { data: updated, error: null };
    }

    // Default: SELECT
    let rows = [...table];

    for (const filter of this.filters) {
      rows = rows.filter((r) => filter(r));
    }

    const exactCount = rows.length;

    if (this.sort) {
      const { column, ascending } = this.sort;
      rows.sort((a, b) => {
        const valA = a[column];
        const valB = b[column];
        if (valA === valB) return 0;
        if (ascending) return valA > valB ? 1 : -1;
        return valA < valB ? 1 : -1;
      });
    }

    if (this.limitCount) {
      rows = rows.slice(0, this.limitCount);
    }

    // Expand joins
    if (this.tableName === 'posts') {
      const profiles = store.profiles || [];
      rows = rows.map((post) => {
        const profile = profiles.find((p) => p.id === post.user_id) || {
          username: post.source_name || 'Anonymous',
          avatar_emoji: '🧑'
        };
        return {
          ...post,
          profiles: profile
        };
      });
    } else if (this.tableName === 'bookmarks') {
      const posts = store.posts || [];
      const profiles = store.profiles || [];
      rows = rows.map((bm) => {
        const post = posts.find((p) => p.id === bm.post_id);
        if (post) {
          const profile = profiles.find((p) => p.id === post.user_id) || {
            username: 'Anonymous',
            avatar_emoji: '🧑'
          };
          return {
            ...bm,
            posts: {
              ...post,
              profiles: profile
            }
          };
        }
        return bm;
      });
    }


    if (this.isSingle) {
      return { data: rows[0] || null, count: exactCount, error: rows[0] ? null : { message: 'Row not found' } };
    }
    if (this.isMaybeSingle) {
      return { data: rows[0] || null, count: exactCount, error: null };
    }

    return {
      data: rows,
      count: exactCount,
      error: null
    };
  }

  then(onFulfilled, onRejected) {
    return this.execute().then(onFulfilled, onRejected);
  }
}

export const mockSupabase = {
  auth: {
    async getSession() {
      const store = getStore();
      const user = store.currentUser;
      return {
        data: {
          session: user ? { user, access_token: 'mock-token' } : null
        },
        error: null
      };
    },

    async getUser() {
      const store = getStore();
      return {
        data: { user: store.currentUser },
        error: null
      };
    },

    onAuthStateChange(callback) {
      authListeners.add(callback);
      const store = getStore();
      if (store.currentUser) {
        callback('SIGNED_IN', { user: store.currentUser, access_token: 'mock-token' });
      }
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              authListeners.delete(callback);
            }
          }
        }
      };
    },

    async signInWithPassword({ email }) {
      const store = getStore();
      const username = email.split('@')[0] || 'user';
      const user = {
        id: 'user-zerobar-demo',
        email,
        user_metadata: { username }
      };
      store.currentUser = user;
      const existingProfile = store.profiles.find((p) => p.id === user.id);
      if (!existingProfile) {
        store.profiles.push({ id: user.id, username, avatar_emoji: '⚡', bio: '' });
      }
      saveStore(store);
      notifyAuthChange('SIGNED_IN', { user, access_token: 'mock-token' });
      return { data: { user, session: { user } }, error: null };
    },

    async signUp({ email, options }) {
      const store = getStore();
      const username = options?.data?.username || email.split('@')[0] || 'user';
      const user = {
        id: `user-${Date.now()}`,
        email,
        user_metadata: { username }
      };
      store.currentUser = user;
      store.profiles.push({ id: user.id, username, avatar_emoji: '⚡', bio: '' });
      saveStore(store);
      notifyAuthChange('SIGNED_IN', { user, access_token: 'mock-token' });
      return { data: { user, session: { user } }, error: null };
    },

    async signOut() {
      const store = getStore();
      store.currentUser = null;
      saveStore(store);
      notifyAuthChange('SIGNED_OUT', null);
      return { error: null };
    }
  },

  from(tableName) {
    return new MockQueryBuilder(tableName);
  }
};
