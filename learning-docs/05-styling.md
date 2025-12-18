# 05 - Styling & Theming

## How Styles Work in This Project

We use **CSS Variables** (custom properties) for theming. This lets us change colors across the entire app by just changing a few variables.

---

## globals.css Structure

**File:** `src/app/globals.css`

```css
/* 1. CSS Variables (colors, spacing, etc.) */
:root {
  --bg-primary: #050505;
  --bg-secondary: #0a0a0a;
  --text-primary: #ffffff;
  --accent-primary: #ffffff;
  --border-color: #222222;
  --radius-md: 8px;
  --transition-fast: 0.15s ease;
}

/* 2. Theme variations */
[data-theme="neon"] {
  --bg-primary: #090014;
  --accent-primary: #22d3ee;
}

[data-theme="oceanic"] {
  --bg-primary: #020617;
  --accent-primary: #38bdf8;
}

/* 3. Base styles */
body {
  background: var(--bg-primary);
  color: var(--text-primary);
}

/* 4. Component styles */
.btn {
  background: var(--accent-primary);
  color: var(--bg-primary);
  border-radius: var(--radius-md);
}
```

---

## CSS Variables Explained

### Defining Variables

```css
:root {
  --my-color: #ff0000;
  --my-size: 16px;
}
```

`:root` means these are available everywhere.

### Using Variables

```css
.button {
  background: var(--my-color);
  font-size: var(--my-size);
}
```

`var()` reads the variable's value.

### Changing Variables with JavaScript

```javascript
document.documentElement.setAttribute('data-theme', 'neon');
```

This adds `data-theme="neon"` to the HTML element, which activates the `[data-theme="neon"]` styles in CSS.

---

## Theme System

### 1. Default Theme (Monochromatic)

```css
:root {
  --bg-primary: #050505;
  --bg-secondary: #0a0a0a;
  --bg-tertiary: #141414;
  --text-primary: #ffffff;
  --text-secondary: #a3a3a3;
  --text-muted: #525252;
  --accent-primary: #ffffff;
  --border-color: #222222;
}
```

### 2. Neon Theme

```css
[data-theme="neon"] {
  --bg-primary: #090014;
  --accent-primary: #22d3ee;  /* Cyan */
}
```

### 3. How Themes Get Applied

```javascript
// In SettingsContext.js
const updateTheme = (newTheme) => {
  setTheme(newTheme);
  localStorage.setItem('theme', newTheme);
  document.documentElement.setAttribute('data-theme', newTheme);
  //                         ↑ This triggers the CSS theme change!
};
```

---

## Common CSS Patterns

### 1. Flexbox Layouts

```css
.nav {
  display: flex;
  justify-content: space-between;  /* Push items to edges */
  align-items: center;             /* Vertical center */
  gap: 1rem;                       /* Space between items */
}
```

### 2. Grid Layouts

```css
.editor-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;  /* Two equal columns */
  gap: 1rem;
}

/* Responsive: stack on mobile */
@media (max-width: 1024px) {
  .editor-layout {
    grid-template-columns: 1fr;  /* One column */
  }
}
```

### 3. Transitions

```css
.btn {
  transition: opacity var(--transition-fast);
}

.btn:hover {
  opacity: 0.85;  /* Smoothly fades */
}
```

### 4. JSX Inline Styles

Sometimes we use inline styles in JSX:

```javascript
<div style={{
  display: 'flex',
  gap: '1rem',
  padding: '1.5rem'
}}>
```

Note: CSS properties use camelCase in JavaScript (`fontSize` not `font-size`).

---

## JSX Styled Components

Some pages use `<style jsx>` for scoped styles:

```javascript
function MyComponent() {
  return (
    <>
      <div className="container">Hello</div>

      <style jsx>{`
        .container {
          background: var(--bg-secondary);
          padding: 2rem;
        }
      `}</style>
    </>
  );
}
```

These styles only apply to THIS component, not globally.

---

## Fonts

```css
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono&display=swap');

:root {
  --font-display: 'Space Grotesk', sans-serif;  /* Headings */
  --font-mono: 'JetBrains Mono', monospace;     /* Code */
}

h1, h2, h3 {
  font-family: var(--font-display);
}

code, pre {
  font-family: var(--font-mono);
}
```

---

## Next: [Express API Backend](./06-express-api.md)
