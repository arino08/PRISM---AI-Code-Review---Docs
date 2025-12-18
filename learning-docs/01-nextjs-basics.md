# 01 - Next.js Basics

## What is Next.js?

Next.js is a **React framework** that adds features like:
- **File-based routing** - Create a file, get a page automatically
- **Server-side rendering** - Pages can load data on the server
- **API routes** - Build backend APIs inside your frontend project

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # All pages live here
│   │   ├── layout.js           # Root layout (wraps all pages)
│   │   ├── page.js             # Homepage (/)
│   │   ├── globals.css         # Global styles
│   │   ├── review/page.js      # /review page
│   │   ├── docs/page.js        # /docs page
│   │   └── api/auth/...        # API routes for authentication
│   ├── components/             # Reusable React components
│   └── context/                # Global state (React Context)
├── package.json                # Dependencies
└── next.config.mjs             # Next.js configuration
```

## How File-Based Routing Works

```
src/app/page.js         →  yoursite.com/
src/app/review/page.js  →  yoursite.com/review
src/app/docs/page.js    →  yoursite.com/docs
src/app/settings/page.js →  yoursite.com/settings
```

**Rule:** Create a folder with a `page.js` file inside = new route!

---

## Key Concepts

### 1. 'use client' Directive

```javascript
'use client';  // ← This line is crucial!

import { useState } from 'react';

export default function MyPage() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

**Why?** By default, Next.js components run on the server (where there's no browser).
Adding `'use client'` tells Next.js: "This component needs to run in the browser."

**You need 'use client' when:**
- Using `useState`, `useEffect`, or other React hooks
- Handling user events (onClick, onChange, etc.)
- Using browser APIs (localStorage, window, etc.)

### 2. The Layout System

`layout.js` wraps all pages. Think of it as the "shell" of your app:

```javascript
// src/app/layout.js
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navigation />      {/* Shows on ALL pages */}
        {children}          {/* The actual page content */}
      </body>
    </html>
  );
}
```

### 3. Dynamic Imports

Some components can't run on the server (like Monaco Editor):

```javascript
import dynamic from 'next/dynamic';

// Load Monaco only in the browser, show spinner while loading
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,  // Don't run on server
  loading: () => <div>Loading editor...</div>
});
```

---

## Our Layout File Explained

```javascript
// src/app/layout.js
import "./globals.css";
import { SettingsProvider } from '@/context/SettingsContext';
import { SessionProvider } from 'next-auth/react';

export const metadata = {
  title: "PRISM",
  description: "AI Code Review",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>        {/* Auth state */}
          <SettingsProvider>     {/* App settings */}
            {children}           {/* Page content */}
          </SettingsProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
```

**What each part does:**
- `metadata` - Sets the browser tab title
- `SessionProvider` - Provides login/auth status to all pages
- `SettingsProvider` - Provides theme & API key settings to all pages
- `{children}` - Whatever page you're viewing gets inserted here

---

## Next Steps

Now that you understand Next.js basics, let's look at [each page in detail](./02-pages-explained.md).
