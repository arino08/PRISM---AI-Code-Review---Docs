# 04 - Context & State Management

## What is Context?

React Context lets you share data across all components without passing props down manually.

Think of it like a "global variable" that any component can access.

---

## SettingsContext.js

**File:** `src/context/SettingsContext.js`

This manages:
1. **Theme** - Which color scheme to use
2. **OpenAI Key** - User's API key for AI features

```javascript
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { SessionProvider } from 'next-auth/react';

// 1. Create a Context object
const SettingsContext = createContext();

// 2. Provider component that wraps the app
export function SettingsProvider({ children }) {
  // State for theme and API key
  const [theme, setTheme] = useState('monochromatic');
  const [openaiKey, setOpenaiKey] = useState('');

  // Load from localStorage when app starts
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const savedKey = localStorage.getItem('openai_key');

    if (savedTheme) setTheme(savedTheme);
    if (savedKey) setOpenaiKey(savedKey);
  }, []);  // Empty array = run once on mount

  // Update theme and save to localStorage
  const updateTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    // Apply to HTML element so CSS can read it
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // Update API key and save
  const updateApiKey = (newKey) => {
    setOpenaiKey(newKey);
    localStorage.setItem('openai_key', newKey);
  };

  // Provide values to all children
  return (
    <SessionProvider>
      <SettingsContext.Provider value={{
        theme,
        updateTheme,
        openaiKey,
        updateApiKey
      }}>
        {children}
      </SettingsContext.Provider>
    </SessionProvider>
  );
}

// 3. Custom hook to use settings anywhere
export function useSettings() {
  return useContext(SettingsContext);
}
```

---

## How to Use It

In any component:

```javascript
import { useSettings } from '@/context/SettingsContext';

function MyComponent() {
  // Get values from context
  const { theme, updateTheme, openaiKey, updateApiKey } = useSettings();

  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={() => updateTheme('neon')}>Switch to Neon</button>

      <input
        type="text"
        value={openaiKey}
        onChange={(e) => updateApiKey(e.target.value)}
      />
    </div>
  );
}
```

---

## The Pattern Explained

### 1. createContext()

```javascript
const SettingsContext = createContext();
```

Creates an empty "container" for the data.

### 2. Provider

```javascript
<SettingsContext.Provider value={{ theme, updateTheme }}>
  {children}
</SettingsContext.Provider>
```

Wraps components that need access. The `value` prop is what gets shared.

### 3. useContext()

```javascript
const { theme } = useContext(SettingsContext);
```

Reads the current value from the context.

### 4. Custom Hook (useSettings)

```javascript
export function useSettings() {
  return useContext(SettingsContext);
}
```

A convenient wrapper so you write `useSettings()` instead of `useContext(SettingsContext)`.

---

## localStorage

Browser's built-in storage that persists across page refreshes:

```javascript
// Save
localStorage.setItem('theme', 'neon');

// Read
const theme = localStorage.getItem('theme');  // Returns 'neon'

// Remove
localStorage.removeItem('theme');
```

Data stays even after closing the browser!

---

## SessionProvider (NextAuth)

This is from NextAuth.js and provides login session info:

```javascript
import { useSession, signIn, signOut } from 'next-auth/react';

function Profile() {
  const { data: session } = useSession();

  if (session) {
    return (
      <div>
        <p>Welcome, {session.user.name}!</p>
        <button onClick={() => signOut()}>Sign Out</button>
      </div>
    );
  }

  return <button onClick={() => signIn('github')}>Sign In</button>;
}
```

---

## Next: [Styling & Theming](./05-styling.md)
