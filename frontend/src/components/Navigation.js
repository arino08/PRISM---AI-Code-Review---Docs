'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import PrismLogo from '@/components/PrismLogo';

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/review', label: 'Review' },
    { href: '/github', label: 'GitHub' },
    { href: '/chat', label: 'Chat' },
    { href: '/docs', label: 'Docs' },
    { href: '/settings', label: 'Settings' },
  ];

  return (
    <nav className="nav">
      <Link href="/" className="nav-brand">
        <div className="nav-brand-icon">
          <PrismLogo size={24} />
        </div>
        <span className="nav-brand-text">Prism</span>
      </Link>

      <div className="nav-links">
        {navItems.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`nav-link ${pathname === href ? 'active' : ''}`}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
