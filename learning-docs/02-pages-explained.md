# 02 - Pages Explained

Each page in PRISM has a specific purpose. Let's understand them all!

---

## Homepage (/)

**File:** `src/app/page.js`

```javascript
import Dashboard from '@/components/Dashboard';

export default function Home() {
  return <Dashboard />;
}
```

**What it does:** Just renders the Dashboard component. This is the landing page.

---

## Review Page (/review)

**File:** `src/app/review/page.js`

**Purpose:** Analyze code for security vulnerabilities and quality issues.

### How it Works

```javascript
export default function ReviewPage() {
  // 1. State to store the code user types
  const [code, setCode] = useState(DEFAULT_CODE);

  // 2. State for the issues found
  const [issues, setIssues] = useState([]);

  // 3. Mode: 'pattern' (free) or 'llm' (AI/GPT-4)
  const [mode, setMode] = useState('pattern');

  // 4. When user clicks "Analyze"
  const handleAnalyze = async () => {
    // Call our backend API
    const response = await fetch(`${API_URL}/api/analyze`, {
      method: 'POST',
      body: JSON.stringify({ code, mode, openaiKey })
    });
    const data = await response.json();
    setIssues(data.issues);  // Show the problems found
  };
```

### Key Pattern: Fetch API

```javascript
// Send data to backend
const response = await fetch('http://localhost:3005/api/analyze', {
  method: 'POST',                              // HTTP method
  headers: { 'Content-Type': 'application/json' },  // We're sending JSON
  body: JSON.stringify({ code, mode })         // Convert JS object to JSON string
});

// Get response
const data = await response.json();  // Parse JSON response to JS object
```

---

## Docs Page (/docs)

**File:** `src/app/docs/page.js`

**Purpose:** Generate JSDoc comments and README documentation from code.

### Two Modes

1. **Pattern Mode** (client-side):
   ```javascript
   function generateClientDocs(code) {
     const functions = extractFunctions(code);  // Find all functions
     let jsdoc = '';
     functions.forEach(func => {
       jsdoc += generateJSDoc(func);  // Create JSDoc for each
     });
     return { jsdoc, readme };
   }
   ```

2. **LLM Mode** (server-side with GPT-4):
   ```javascript
   const response = await fetch(`${API_URL}/api/generate-docs`, {
     body: JSON.stringify({ code, language, mode: 'llm', openaiKey })
   });
   ```

### Tabs Logic

```javascript
const [activeTab, setActiveTab] = useState('jsdoc');

// In the render:
<button onClick={() => setActiveTab('jsdoc')}>JSDoc</button>
<button onClick={() => setActiveTab('readme')}>README</button>

// Show content based on active tab:
{activeTab === 'jsdoc' ? docs.jsdoc : docs.readme}
```

---

## Chat Page (/chat)

**File:** `src/app/chat/page.js`

**Purpose:** Chat with a codebase using RAG (Retrieval-Augmented Generation).

### The Flow

1. **Index a repo** - Send repo URL to backend, it downloads and vectorizes all code
2. **Ask questions** - Backend searches for relevant code, sends to GPT-4
3. **Get answers** - GPT-4 answers using the retrieved code as context

```javascript
// Step 1: Index
const handleIndex = async () => {
  const response = await fetch(`${API_URL}/api/rag/ingest`, {
    body: JSON.stringify({ repoPath, openaiKey })
  });
  // Now the repo is indexed!
};

// Step 2 & 3: Chat
const handleSend = async () => {
  const response = await fetch(`${API_URL}/api/rag/query`, {
    body: JSON.stringify({ query: input, openaiKey })
  });
  // data.answer contains GPT's response
  // data.context contains the code snippets it used
};
```

### Message Rendering with Markdown

```javascript
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

// Render markdown with syntax highlighting:
<ReactMarkdown
  components={{
    code({ inline, className, children }) {
      const match = /language-(\w+)/.exec(className);
      return !inline && match ? (
        <SyntaxHighlighter language={match[1]}>
          {children}
        </SyntaxHighlighter>
      ) : (
        <code>{children}</code>
      );
    }
  }}
>
  {message.content}
</ReactMarkdown>
```

---

## GitHub Page (/github)

**File:** `src/app/github/page.js`

**Purpose:** Analyze entire GitHub repos or specific Pull Requests.

### Two Modes

```javascript
const [mode, setMode] = useState('repo');  // 'repo' or 'pr'

// Repository mode
const response = await fetch(`${API_URL}/api/github/analyze-repo`, {
  body: JSON.stringify({ url, token, mode: analysisMode })
});

// PR mode
const response = await fetch(`${API_URL}/api/github/analyze-pr`, {
  body: JSON.stringify({ url, token, mode: analysisMode })
});
```

---

## Settings Page (/settings)

**File:** `src/app/settings/page.js`

**Purpose:** User profile, API key, and theme selection.

### Theme System

```javascript
const themes = [
  { id: 'monochromatic', name: 'Prism', colors: ['#ffffff', '#525252'] },
  { id: 'neon', name: 'Neon', colors: ['#22d3ee', '#f472b6'] },
  { id: 'oceanic', name: 'Oceanic', colors: ['#38bdf8', '#3b82f6'] },
  { id: 'sunset', name: 'Sunset', colors: ['#fb923c', '#ef4444'] },
];

// When user clicks a theme:
<button onClick={() => updateTheme('neon')}>
  Neon
</button>
```

### API Key Storage

```javascript
const { openaiKey, updateApiKey } = useSettings();

// User types their key:
<input
  type="password"
  value={openaiKey}
  onChange={(e) => updateApiKey(e.target.value)}
/>
```

The key is stored in localStorage (browser's local storage).

---

## Auth API Route

**File:** `src/app/api/auth/[...nextauth]/route.js`

This handles GitHub OAuth login using NextAuth.js:

```javascript
import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";

export const authOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  ],
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

**The `[...nextauth]` folder name is special** - it's a "catch-all" route that handles:
- `/api/auth/signin`
- `/api/auth/callback/github`
- `/api/auth/signout`

---

## Next: [Components](./03-components.md)
