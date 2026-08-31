'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } }
    });
    setSubmitting(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push('/');
  }

  return (
    <div className="auth-wrap">
      <h1>Create your account</h1>
      <p className="sub">Join Zerobar in a minute.</p>
      <form onSubmit={submit}>
        <div className="field">
          <label>Username</label>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="auth-error">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={submitting} style={{ width: '100%' }}>
          {submitting ? 'Creating…' : 'Create account'}
        </button>
      </form>
      <p className="auth-switch">
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </div>
  );
}
