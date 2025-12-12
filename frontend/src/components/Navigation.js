'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, FileText, Home, Github, Zap, Settings } from 'lucide-react';
import PrismLogo from '@/components/PrismLogo';

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/review', label: 'Code Review', icon: Shield },
    { href: '/github', label: 'GitHub', icon: Github },
    { href: '/setup', label: 'Setup', icon: Zap },
    { href: '/docs', label: 'Docs', icon: FileText },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="nav">
      <Link href="/" className="nav-brand">
        <div className="nav-brand-icon">
          <PrismLogo size={28} />
        </div>
        <span className="nav-brand-text">Prism</span>
      </Link>

      <div className="nav-links">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`nav-link ${pathname === href ? 'active' : ''}`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
