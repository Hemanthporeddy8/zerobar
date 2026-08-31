'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

export default function AdvertiseLanding() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('subscription_plans')
      .select('*')
      .order('price_inr', { ascending: true })
      .then(({ data }) => {
        setPlans(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="auth-wrap" style={{ maxWidth: 480 }}>
      <h1>Advertise on Zerobar</h1>
      <p className="sub">
        Your card, in a real reader's feed — online or off. No ad network middleman, no
        auction, no cut taken out before it reaches us.
      </p>

      {loading && <p className="empty-note">Loading plans…</p>}

      {!loading &&
        plans.map((plan) => (
          <div className="card" key={plan.id} style={{ margin: '0 0 14px' }}>
            <div className="card-body">
              <p className="card-title" style={{ fontSize: 18 }}>
                {plan.name}
              </p>
              <p style={{ color: 'var(--mist)', fontSize: 13, margin: '0 0 10px' }}>
                {plan.description}
              </p>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: 'var(--amber)' }}>
                ₹{plan.price_inr.toLocaleString('en-IN')} / {plan.duration_days} days · up to{' '}
                {plan.max_active_posts} live post{plan.max_active_posts > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        ))}

      <Link href="/advertise/onboarding" className="btn btn-primary" style={{ display: 'block', textAlign: 'center', marginTop: 10 }}>
        Get started
      </Link>
      <p className="auth-switch">
        Already set up? <Link href="/advertise/dashboard">Go to your dashboard</Link>
      </p>
    </div>
  );
}
