'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { apiAuthLogin } from '../../lib/apiClient';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (isSupabaseConfigured) {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (!err) {
        setSubmitting(false);
        router.push('/');
        return;
      }
    }

    const authRes = await apiAuthLogin(email, password);
    setSubmitting(false);
    if (authRes.success || authRes.user) {
      window.location.href = '/';
      return;
    }
    setError(authRes.error || 'Failed to log in');
  }

  return (
    <div className="auth-wrap">
      <h1>Welcome back</h1>
      <p className="sub">Log in to PageGG.</p>
      <form onSubmit={submit}>
        <div className="field">
          <label>Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="auth-error">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={submitting} style={{ width: '100%' }}>
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="auth-switch">
        New here? <Link href="/signup">Create an account</Link>
      </p>
    </div>
  );
}
