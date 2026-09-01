-- Zerobar — Supabase schema
-- Run this once in your Supabase project: SQL Editor -> New query -> paste -> Run

-- Requires pgcrypto for gen_random_uuid() (enabled by default on Supabase)

-- ---------- PROFILES ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  avatar_emoji text default '🧑',
  bio text default '',
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are publicly readable"
  on public.profiles for select
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row whenever someone signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_emoji)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    '🧑'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- POSTS ----------
-- Covers: publisher-style quick reads, user posts, and reposts (is_repost + repost_of)
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text default 'Trending',
  kind text default 'Post',              -- 'Post' | 'Quick read' | 'Reel · 0:18' | 'Story · 15s'
  title text not null,
  media_emoji text default '✍️',
  is_repost boolean default false,
  repost_of uuid references public.posts(id) on delete set null,
  source_name text,
  source_url text,
  created_at timestamptz default now()
);

alter table public.posts enable row level security;

create policy "Posts are publicly readable"
  on public.posts for select
  using (true);

create policy "Users can insert their own posts"
  on public.posts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own posts"
  on public.posts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own posts"
  on public.posts for delete
  using (auth.uid() = user_id);

-- ---------- FOLLOWS ----------
create table if not exists public.follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id)
);

alter table public.follows enable row level security;

create policy "Follows are publicly readable"
  on public.follows for select
  using (true);

create policy "Users can follow as themselves"
  on public.follows for insert
  with check (auth.uid() = follower_id);

create policy "Users can unfollow as themselves"
  on public.follows for delete
  using (auth.uid() = follower_id);

-- ---------- BOOKMARKS (the "Library" / offline-marked list) ----------
create table if not exists public.bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, post_id)
);

alter table public.bookmarks enable row level security;

create policy "Users can read their own bookmarks"
  on public.bookmarks for select
  using (auth.uid() = user_id);

create policy "Users can add their own bookmarks"
  on public.bookmarks for insert
  with check (auth.uid() = user_id);

create policy "Users can remove their own bookmarks"
  on public.bookmarks for delete
  using (auth.uid() = user_id);

-- ---------- REPORTS ----------
-- Users can file a report; only you (via the Supabase dashboard / service role)
-- can read them for now. Wire up a real admin view before public launch.
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade,
  reporter_id uuid references auth.users(id) on delete set null,
  reason text not null,
  status text default 'open',
  created_at timestamptz default now()
);

alter table public.reports enable row level security;

create policy "Users can file reports"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

create policy "Reports are readable by authenticated users"
  on public.reports for select
  using (auth.role() = 'authenticated');

create policy "Reports can be deleted by authenticated users"
  on public.reports for delete
  using (auth.role() = 'authenticated');

-- ---------- POST REACTIONS (Likes & Dislikes) ----------
create table if not exists public.post_reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  reaction_type text not null check (reaction_type in ('like', 'dislike')),
  created_at timestamptz default now(),
  unique (user_id, post_id)
);

alter table public.post_reactions enable row level security;

create policy "Reactions are publicly readable"
  on public.post_reactions for select
  using (true);

create policy "Users can react as themselves"
  on public.post_reactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their reaction"
  on public.post_reactions for update
  using (auth.uid() = user_id);

create policy "Users can remove their reaction"
  on public.post_reactions for delete
  using (auth.uid() = user_id);

-- ---------- COMMENTS ----------
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

alter table public.comments enable row level security;

create policy "Comments are publicly readable"
  on public.comments for select
  using (true);

create policy "Users can post comments"
  on public.comments for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own comments"
  on public.comments for delete
  using (auth.uid() = user_id);

