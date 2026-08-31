-- Zerobar — Direct advertiser system (self-serve, no third-party ad network)
-- Run this AFTER schema.sql, in Supabase SQL Editor.
--
-- Because these are your own direct-sold ads (not a third-party ad network's),
-- they are safe to include in your offline bundle — this is exactly the
-- distinction covered earlier: cache your own sponsored content, never a
-- third-party network's ads.

-- ---------- ADVERTISERS (brand accounts) ----------
create table if not exists public.advertisers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_name text not null,
  contact_email text not null,
  gst_number text,               -- required before you can issue a proper GST invoice
  created_at timestamptz default now(),
  unique(user_id)
);

alter table public.advertisers enable row level security;

create policy "Advertisers can read their own profile"
  on public.advertisers for select
  using (auth.uid() = user_id);

create policy "Advertisers can create their own profile"
  on public.advertisers for insert
  with check (auth.uid() = user_id);

create policy "Advertisers can update their own profile"
  on public.advertisers for update
  using (auth.uid() = user_id);

-- ---------- SUBSCRIPTION PLANS ----------
-- Edit prices/names to your real pricing before launch — these are placeholders.
create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price_inr integer not null,
  duration_days integer not null default 30,
  max_active_posts integer not null default 1,
  description text,
  created_at timestamptz default now()
);

alter table public.subscription_plans enable row level security;

create policy "Plans are publicly readable"
  on public.subscription_plans for select
  using (true);

-- Starter plans — replace with your real pricing.
insert into public.subscription_plans (name, price_inr, duration_days, max_active_posts, description)
values
  ('Local Starter', 2999, 30, 1, 'One sponsored card in the feed for 30 days — good for local businesses.'),
  ('Regional Growth', 9999, 30, 3, 'Up to 3 sponsored cards, priority placement, basic performance report.'),
  ('Brand Partner', 24999, 30, 8, 'Up to 8 sponsored cards, featured placement, downloadable performance report.')
on conflict do nothing;

-- ---------- AD SUBSCRIPTIONS ----------
create table if not exists public.ad_subscriptions (
  id uuid primary key default gen_random_uuid(),
  advertiser_id uuid not null references public.advertisers(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id),
  status text not null default 'pending_payment',  -- pending_payment | active | expired | cancelled
  started_at timestamptz,
  expires_at timestamptz,
  payment_reference text,        -- fill in once you wire up a real payment gateway
  created_at timestamptz default now()
);

alter table public.ad_subscriptions enable row level security;

create policy "Advertisers can read their own subscriptions"
  on public.ad_subscriptions for select
  using (advertiser_id in (select id from public.advertisers where user_id = auth.uid()));

create policy "Advertisers can create their own subscriptions"
  on public.ad_subscriptions for insert
  with check (advertiser_id in (select id from public.advertisers where user_id = auth.uid()));

-- ---------- SPONSORED POSTS ----------
create table if not exists public.sponsored_posts (
  id uuid primary key default gen_random_uuid(),
  advertiser_id uuid not null references public.advertisers(id) on delete cascade,
  title text not null,
  media_emoji text default '📣',
  category text default 'Trending',
  cta_label text default 'Learn more',
  cta_url text,
  active boolean default true,
  created_at timestamptz default now()
);

alter table public.sponsored_posts enable row level security;

create policy "Active sponsored posts are publicly readable"
  on public.sponsored_posts for select
  using (active = true);

create policy "Advertisers can read their own sponsored posts"
  on public.sponsored_posts for select
  using (advertiser_id in (select id from public.advertisers where user_id = auth.uid()));

create policy "Advertisers can create their own sponsored posts"
  on public.sponsored_posts for insert
  with check (advertiser_id in (select id from public.advertisers where user_id = auth.uid()));

create policy "Advertisers can update their own sponsored posts"
  on public.sponsored_posts for update
  using (advertiser_id in (select id from public.advertisers where user_id = auth.uid()));

-- ---------- AD EVENTS (impressions/clicks) ----------
-- Written when a sponsored card is seen or tapped. If this happens while the
-- device is offline, your app should queue the write locally and flush it
-- once signal returns — this table doesn't care whether that took 2 seconds
-- or 2 days.
create table if not exists public.ad_events (
  id uuid primary key default gen_random_uuid(),
  sponsored_post_id uuid not null references public.sponsored_posts(id) on delete cascade,
  event_type text not null,      -- 'impression' | 'click'
  viewer_id uuid references auth.users(id) on delete set null,
  occurred_at timestamptz default now()
);

alter table public.ad_events enable row level security;

create policy "Anyone signed in can log an ad event"
  on public.ad_events for insert
  with check (true);

create policy "Advertisers can read events on their own posts"
  on public.ad_events for select
  using (
    sponsored_post_id in (
      select id from public.sponsored_posts
      where advertiser_id in (select id from public.advertisers where user_id = auth.uid())
    )
  );
