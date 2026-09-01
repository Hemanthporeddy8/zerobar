'use client';

import Link from 'next/link';

export default function BottomNav({ active }) {
  return (
    <div className="navbar">
      <Link href="/" className={`navitem ${active === 'feed' ? 'active' : ''}`}>
        <span className="ic">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 11a9 9 0 0 1 9 9" />
            <path d="M4 4a16 16 0 0 1 16 16" />
            <circle cx="5" cy="19" r="1" />
          </svg>
        </span>
        Feed
      </Link>

      <Link href="/library" className={`navitem ${active === 'library' ? 'active' : ''}`}>
        <span className="ic">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
          </svg>
        </span>
        Library
      </Link>


      <Link href="/profile" className={`navitem ${active === 'profile' ? 'active' : ''}`}>
        <span className="ic">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </span>
        Profile
      </Link>
    </div>
  );
}

