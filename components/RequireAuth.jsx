'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return <p className="empty-note">Loading…</p>;
  }

  if (!user) {
    // Redirecting — render nothing to avoid a flash of protected content
    return null;
  }

  return children;
}
