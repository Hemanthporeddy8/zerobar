# Zerobar — starter app (Next.js + Supabase)

This is a real, working starter build of the Zerobar concept — feed, posts,
reposts, follows, a library (bookmarks), reels, profiles, and basic
auth — wired to a real database (Supabase). It replaces the earlier
click-through HTML mockup with actual working screens.

**You only need to add your own Supabase project.** Everything else —
frontend, database schema, auth, and the core interactions — is here.

## 1. Create your Supabase project

1. Go to https://supabase.com and create a free project.
2. In the Supabase dashboard, open **SQL Editor** → **New query**.
3. Paste the entire contents of `schema.sql` (in this folder) and click **Run**.
   This creates all the tables (profiles, posts, follows, bookmarks, reports)
   with row-level security already turned on.
4. Go to **Settings → API** and copy your **Project URL** and **anon public key**.
5. Also run `ads-schema.sql` (same way, SQL Editor → New query → paste → Run) to set up the direct-advertiser system — brand accounts, plans, sponsored posts, and impression/click tracking.

## 2. Connect the app to your project

1. Copy `.env.example` to `.env.local`.
2. Paste in your Project URL and anon key:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

## 3. Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 — you can sign up, post, follow, bookmark, and
repost right away. Every account you create is a real row in your Supabase
`auth.users` + `profiles` tables.

## 4. Deploy

Push this folder to a GitHub repo, then import it in Vercel. Add the same two
environment variables (`NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`) in the Vercel project's Settings →
Environment Variables, and deploy.

## What's actually included

- Real auth (Supabase Auth — email + password)
- Real database (Postgres via Supabase, with row-level security policies
  so users can only edit their own data)
- Feed, Library (bookmarks), Reels, Profile — all reading/writing real rows
- Posting, reposting, following, bookmarking, reporting a post
- A basic service worker (`public/sw.js`) so pages you've already opened
  still load with no signal — this is real offline support, not a UI demo
- Auto-created user profile on signup (via a Postgres trigger)
- **Direct advertiser system** (`/advertise`) — brands sign up separately, pick a
  plan, and publish their own sponsored card, which appears in the reader feed
  every 4th post with a "Sponsored" label. Impressions and clicks are logged
  to `ad_events`, viewable in the advertiser's own dashboard. No third-party
  ad network involved — see the note in `ads-schema.sql` about why that
  matters for offline caching and ad-network policy.

## What is NOT included (on purpose — read this before you launch)

This gets you a real, testable app. It does **not** make you launch-ready.
Carried over from earlier planning, still true:

- **No payments/payouts.** Sending real money to users requires KYC,
  a payment gateway with payout support (e.g. Razorpay, Cashfree), and
  TDS handling. Not something to bolt on without a lawyer's input.
- **Advertiser plan payments are also stubbed.** Clicking "Request this
  plan" logs interest to `ad_subscriptions` with status `pending_payment`
  — it does not charge anyone. Wire up a real payment gateway (and get
  GST-registered, since you'll be invoicing businesses) before treating
  this as real revenue.
- **No offline queueing for ad events yet.** If a sponsored card is
  viewed with no signal, the impression/click write will currently just
  fail silently. Before relying on this for real billing, queue failed
  `ad_events` writes locally and flush them on the browser's `online`
  event — noted in `SponsoredCard.jsx`.
- **No admin/moderation dashboard.** Reports are saved to the `reports`
  table, but only readable via the Supabase dashboard right now — you'd
  check them manually. A real admin view is a next step, not a blocker
  to testing with a small group.
- **No age gate / minimum-age check.**
- **No Privacy Policy or Terms of Service page** — required before any
  public signup, not just nice-to-have.
- **No push notifications.**
- **No predictive/background pre-caching.** The service worker here only
  caches pages you've already visited — it does not proactively download
  new content in the background. That's a deliberate feature to design
  later (Background Sync API), not a quick add.
- **App icons are placeholders.** `public/manifest.json` has an empty
  `icons` array — add real icon files before treating this as installable.

## Suggested next steps

1. Test locally with a few friends signed up as real accounts.
2. Draft a Privacy Policy + Terms of Service (talk to a lawyer about IT
   Rules 2021 intermediary status once real users can post).
3. Build a simple admin page to review the `reports` table.
4. Only after that: look at payments/payouts with a payment gateway.
