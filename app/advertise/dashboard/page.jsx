'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../components/AuthProvider';
import RequireAuth from '../../../components/RequireAuth';

function DashboardInner() {
  const { user } = useAuth();
  const router = useRouter();
  const [advertiser, setAdvertiser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [eventCounts, setEventCounts] = useState({});
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);

  // Compose form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Trending');
  const [ctaLabel, setCtaLabel] = useState('Learn more');
  const [ctaUrl, setCtaUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);

    const { data: adv } = await supabase.from('advertisers').select('*').eq('user_id', user.id).maybeSingle();
    if (!adv) {
      router.push('/advertise/onboarding');
      return;
    }
    setAdvertiser(adv);

    const { data: myPosts } = await supabase
      .from('sponsored_posts')
      .select('*')
      .eq('advertiser_id', adv.id)
      .order('created_at', { ascending: false });
    setPosts(myPosts || []);

    if (myPosts && myPosts.length > 0) {
      const ids = myPosts.map((p) => p.id);
      const { data: events } = await supabase
        .from('ad_events')
        .select('sponsored_post_id, event_type')
        .in('sponsored_post_id', ids);
      const counts = {};
      (events || []).forEach((e) => {
        counts[e.sponsored_post_id] = counts[e.sponsored_post_id] || { impression: 0, click: 0 };
        counts[e.sponsored_post_id][e.event_type] += 1;
      });
      setEventCounts(counts);
    }

    const { data: planData } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('price_inr', { ascending: true });
    setPlans(planData || []);

    setLoading(false);
  }

  async function createPost(e) {
    e.preventDefault();
    if (!title.trim() || !advertiser) return;
    setSubmitting(true);
    await supabase.from('sponsored_posts').insert({
      advertiser_id: advertiser.id,
      title: title.trim(),
      category,
      cta_label: ctaLabel.trim() || 'Learn more',
      cta_url: ctaUrl.trim() || null
    });
    setSubmitting(false);
    setTitle('');
    setCtaUrl('');
    setComposing(false);
    load();
  }

  async function requestPlan(planId) {
    if (!advertiser) return;
    await supabase.from('ad_subscriptions').insert({
      advertiser_id: advertiser.id,
      plan_id: planId,
      status: 'pending_payment'
    });
    window.alert(
      "Thanks — we've logged your interest in this plan. Payment isn't wired up yet, so we'll follow up directly to invoice you."
    );
  }

  if (loading) {
    return <p className="empty-note">Loading…</p>;
  }

  return (
    <div className="auth-wrap" style={{ maxWidth: 480 }}>
      <h1>{advertiser?.company_name}</h1>
      <p className="sub">{advertiser?.contact_email}</p>

      <button className="btn btn-primary" onClick={() => setComposing(!composing)} style={{ width: '100%', marginBottom: 18 }}>
        {composing ? 'Cancel' : '+ New sponsored post'}
      </button>

      {composing && (
        <form onSubmit={createPost} style={{ marginBottom: 24 }}>
          <div className="field">
            <label>Post text</label>
            <input required value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="field">
            <label>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 12,
                background: 'var(--indigo-2)',
                border: '1px solid var(--line)',
                color: 'var(--paper)'
              }}
            >
              <option>Trending</option>
              <option>Local</option>
              <option>Tech</option>
              <option>Career</option>
            </select>
          </div>
          <div className="field">
            <label>Button label</label>
            <input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} />
          </div>
          <div className="field">
            <label>Link (where the button sends readers)</label>
            <input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} placeholder="https://" />
          </div>
          <button className="btn btn-primary" type="submit" disabled={submitting} style={{ width: '100%' }}>
            {submitting ? 'Publishing…' : 'Publish to feed'}
          </button>
        </form>
      )}

      <div className="section-label" style={{ padding: '0 0 8px' }}>
        Your sponsored posts
      </div>
      {posts.length === 0 && <p className="empty-note">Nothing live yet.</p>}
      {posts.map((p) => {
        const counts = eventCounts[p.id] || { impression: 0, click: 0 };
        return (
          <div className="card" key={p.id} style={{ margin: '0 0 12px' }}>
            <div className="card-body">
              <p className="card-title" style={{ fontSize: 15 }}>
                {p.title}
              </p>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'var(--mist)' }}>
                {counts.impression} views · {counts.click} clicks · {p.active ? 'Live' : 'Inactive'}
              </p>
            </div>
          </div>
        );
      })}

      <div className="section-label" style={{ padding: '20px 0 8px' }}>
        Plans
      </div>
      {plans.map((plan) => (
        <div className="card" key={plan.id} style={{ margin: '0 0 12px' }}>
          <div className="card-body">
            <p className="card-title" style={{ fontSize: 15 }}>
              {plan.name} — ₹{plan.price_inr.toLocaleString('en-IN')}
            </p>
            <p style={{ color: 'var(--mist)', fontSize: 12.5, margin: '0 0 10px' }}>{plan.description}</p>
            <button className="btn btn-ghost" onClick={() => requestPlan(plan.id)}>
              Request this plan
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardInner />
    </RequireAuth>
  );
}
