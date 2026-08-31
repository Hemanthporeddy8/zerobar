'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../components/AuthProvider';
import RequireAuth from '../../../components/RequireAuth';

function OnboardingInner() {
  const { user } = useAuth();
  const router = useRouter();
  const [companyName, setCompanyName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [gst, setGst] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const { error: err } = await supabase.from('advertisers').insert({
      user_id: user.id,
      company_name: companyName.trim(),
      contact_email: contactEmail.trim(),
      gst_number: gst.trim() || null
    });
    setSubmitting(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push('/advertise/dashboard');
  }

  return (
    <div className="auth-wrap">
      <h1>Set up your brand account</h1>
      <p className="sub">
        This creates your advertiser profile — separate from a normal Zerobar reader account.
      </p>
      <form onSubmit={submit}>
        <div className="field">
          <label>Company name</label>
          <input required value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
        </div>
        <div className="field">
          <label>Contact email</label>
          <input
            type="email"
            required
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
          />
        </div>
        <div className="field">
          <label>GST number (optional for now — required before we can invoice you)</label>
          <input value={gst} onChange={(e) => setGst(e.target.value)} />
        </div>
        {error && <p className="auth-error">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={submitting} style={{ width: '100%' }}>
          {submitting ? 'Creating…' : 'Create brand account'}
        </button>
      </form>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <RequireAuth>
      <OnboardingInner />
    </RequireAuth>
  );
}
