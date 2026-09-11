export const TURSO_SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    avatar_emoji TEXT DEFAULT '⚡',
    bio TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    category TEXT DEFAULT 'Trending',
    kind TEXT DEFAULT 'Post',
    title TEXT NOT NULL,
    media_emoji TEXT DEFAULT '✍️',
    location TEXT,
    is_repost INTEGER DEFAULT 0,
    repost_of TEXT,
    source_name TEXT,
    source_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts (created_at DESC);`,
  `CREATE INDEX IF NOT EXISTS idx_posts_category ON posts (category);`,
  `CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts (user_id);`,

  `CREATE TABLE IF NOT EXISTS post_reactions (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    reaction_type TEXT DEFAULT 'like',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id, reaction_type)
  );`,

  `CREATE TABLE IF NOT EXISTS bookmarks (
    user_id TEXT NOT NULL,
    post_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, post_id)
  );`,

  `CREATE TABLE IF NOT EXISTS follows (
    follower_id TEXT NOT NULL,
    following_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, following_id)
  );`,

  `CREATE TABLE IF NOT EXISTS sponsored_posts (
    id TEXT PRIMARY KEY,
    advertiser_id TEXT NOT NULL,
    title TEXT NOT NULL,
    media_emoji TEXT DEFAULT '📣',
    category TEXT DEFAULT 'Trending',
    cta_label TEXT DEFAULT 'Learn More',
    cta_url TEXT DEFAULT '',
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`
];
