# 03 - Components Explained

Components are reusable pieces of UI. PRISM has 6 main components.

---

## Navigation.js

**File:** `src/components/Navigation.js`

The navbar shown on every page.

```javascript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';  // Get current URL path
import PrismLogo from '@/components/PrismLogo';

export default function Navigation() {
  const pathname = usePathname();  // Returns '/review', '/docs', etc.

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
      {/* Logo + Brand */}
      <Link href="/" className="nav-brand">
        <PrismLogo size={24} />
        <span>Prism</span>
      </Link>

      {/* Nav Links */}
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
```

### Key Concepts

1. **`usePathname()`** - Hook that returns the current URL path
2. **Conditional classes** - `pathname === href ? 'active' : ''` adds 'active' class to current page
3. **`map()` for lists** - Loop through navItems array to render links

---

## PrismLogo.js

**File:** `src/components/PrismLogo.js`

An SVG logo component that can be sized dynamically.

```javascript
export default function PrismLogo({ size = 24, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
    >
      {/* Prism triangle */}
      <path
        d="M16 4L6 28H26L16 4Z"
        stroke="currentColor"  // ← Uses parent's text color
        strokeWidth="2"
      />
      {/* Refraction lines */}
      <path d="M16 4L10 28" stroke="currentColor" strokeOpacity="0.6" />
      <path d="M16 4L22 28" stroke="currentColor" strokeOpacity="0.6" />
    </svg>
  );
}
```

### Key Concepts

1. **Props with defaults** - `size = 24` means if no size is passed, use 24
2. **`currentColor`** - SVG inherits the parent element's color (theme-aware!)

---

## Dashboard.js

**File:** `src/components/Dashboard.js`

The landing page content with hero section.

```javascript
'use client';

import Link from 'next/link';
import { Code2, FileText } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="hero-section">
      {/* Big headline */}
      <h1 className="hero-title">
        Review code. <span className="gradient-text">Generate docs.</span>
      </h1>

      {/* Subheadline */}
      <p className="hero-subtitle">
        AI-powered security analysis and documentation generation
      </p>

      {/* CTA buttons */}
      <div className="hero-actions">
        <Link href="/review" className="btn btn-primary">
          Start Review
        </Link>
        <Link href="/docs" className="btn btn-secondary">
          Generate Docs
        </Link>
      </div>
    </div>
  );
}
```

---

## ReviewPanel.js

**File:** `src/components/ReviewPanel.js`

Displays the list of code issues found during analysis.

```javascript
'use client';

import { useState } from 'react';
import { Shield, ChevronDown, AlertTriangle } from 'lucide-react';

export default function ReviewPanel({ issues = [], isLoading = false }) {
  // Track which issues are expanded
  const [expanded, setExpanded] = useState(new Set());

  // Toggle an issue's expanded state
  const toggle = (id) => {
    const next = new Set(expanded);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpanded(next);
  };

  // Count issues by severity
  const count = (sev) => issues.filter(i => i.severity === sev).length;

  return (
    <div className="review-panel">
      {/* Header with issue count */}
      <div className="panel-header">
        <Shield size={16} />
        <span>Results</span>
        {issues.length > 0 && <span>{issues.length}</span>}
      </div>

      {/* Content */}
      {isLoading ? (
        <div>Analyzing...</div>
      ) : issues.length === 0 ? (
        <div>Click Analyze to scan code</div>
      ) : (
        <>
          {/* Summary badges */}
          <div className="summary">
            {count('critical') > 0 && (
              <span className="badge critical">
                <AlertTriangle size={12} /> {count('critical')}
              </span>
            )}
            {/* ... more badges */}
          </div>

          {/* Issues list */}
          {issues.map((issue) => (
            <div key={issue.id} className="issue-item">
              <div onClick={() => toggle(issue.id)}>
                {issue.title}
                <ChevronDown className={expanded.has(issue.id) ? 'open' : ''} />
              </div>

              {/* Expanded content */}
              {expanded.has(issue.id) && (
                <div className="issue-body">
                  <p>{issue.description}</p>
                  <div className="code-bad">{issue.code}</div>
                  <div className="code-fix">{issue.fix}</div>
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
```

### Key Concepts

1. **Set for tracking state** - `new Set()` is efficient for checking if ID exists
2. **Conditional rendering** - `isLoading ? (...) : (...)`
3. **Props validation** - `issues = []` prevents errors if no issues passed

---

## Background3D.js

**File:** `src/components/Background3D.js`

A decorative 3D animated background (currently not used in most pages).

Uses Three.js for 3D graphics - more advanced, not essential to understand.

---

## CustomCursor.js

**File:** `src/components/CustomCursor.js`

A custom mouse cursor effect (decorative only).

---

## Icons from Lucide

We use [Lucide React](https://lucide.dev/) for icons:

```javascript
import { Shield, Code2, Settings, Github } from 'lucide-react';

// Use like this:
<Shield size={16} />
<Code2 size={20} strokeWidth={1.5} />
```

---

## Next: [Context & State Management](./04-context-state.md)
