'use client';

import Link from 'next/link';

const ITEMS = [
  { href: '/', label: 'Feed', icon: '📰', key: 'feed' },
  { href: '/library', label: 'Library', icon: '🔖', key: 'library' },
  { href: '/reels', label: 'Reels', icon: '🎞', key: 'reels' },
  { href: '/profile', label: 'Profile', icon: '👤', key: 'profile' }
];

export default function BottomNav({ active }) {
  return (
    <div className="navbar">
      {ITEMS.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={`navitem ${active === item.key ? 'active' : ''}`}
        >
          <span className="ic">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </div>
  );
}
