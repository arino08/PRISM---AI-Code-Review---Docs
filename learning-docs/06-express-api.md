# 06 - Express API Backend

## What is Express?

Express is a Node.js web framework for building APIs. It handles:
- HTTP requests (GET, POST, etc.)
- URL routing
- Middleware (functions that run on every request)

---

## Project Structure

```
backend/
├── src/
│   ├── index.js           # Main server file
│   └── services/          # Business logic
│       ├── analyzers/     # Code analysis (security, quality, performance)
│       ├── githubService.js       # GitHub API integration
│       ├── documentationGenerator.js  # Generate docs
│       ├── llmAnalyzer.js         # OpenAI/GPT integration
│       └── rag/           # RAG chat system
├── package.json
└── Dockerfile
```

---

## index.js Explained

**File:** `backend/src/index.js`

### 1. Setup & Imports

```javascript
const express = require('express');
const cors = require('cors');

// Import our services
const { analyzeCode } = require('./services/analyzers/securityAnalyzer');
const { generateDocumentation } = require('./services/documentationGenerator');
const { analyzeWithLLM } = require('./services/llmAnalyzer');

const app = express();
const PORT = process.env.PORT || 3005;
```

### 2. Middleware

```javascript
// Allow requests from frontend (different port)
app.use(cors({
    origin: ['http://localhost:3008', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Parse JSON request bodies
app.use(express.json({ limit: '10mb' }));
```

**CORS** = Cross-Origin Resource Sharing. Without it, browsers block requests from frontend (port 3004) to backend (port 3005).

### 3. API Routes

Each route handles a specific URL:

```javascript
// Health check - verify server is running
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});
```

---

## Main API Endpoints

### POST /api/analyze

Analyzes code for security and quality issues.

```javascript
app.post('/api/analyze', async (req, res) => {
  try {
    // 1. Get data from request body
    const { code, language, mode, openaiKey } = req.body;

    // 2. Validate
    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    // 3. Choose analysis method
    let allIssues = [];

    if (mode === 'llm') {
      // Use GPT-4 for analysis
      const llmResult = await analyzeWithLLM(code, openaiKey);
      allIssues = llmResult.issues;
    } else {
      // Use pattern matching (free)
      const securityIssues = analyzeCode(code);
      const qualityIssues = analyzeQuality(code);
      allIssues = [...securityIssues, ...qualityIssues];
    }

    // 4. Send response
    res.json({ issues: allIssues });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### POST /api/generate-docs

Generates JSDoc and README documentation.

```javascript
app.post('/api/generate-docs', async (req, res) => {
  const { code, language, mode, openaiKey } = req.body;

  if (mode === 'llm') {
    // Use GPT-4 for better docs
    const docs = await generateDocsWithLLM(code, openaiKey);
    res.json(docs);
  } else {
    // Pattern-based generation
    const docs = generateDocumentation(code);
    res.json(docs);
  }
});
```

### POST /api/rag/ingest

Indexes a GitHub repo for chat.

```javascript
app.post('/api/rag/ingest', async (req, res) => {
  const { repoPath, openaiKey } = req.body;

  // Download repo, split into chunks, create embeddings
  const result = await ingestRepo(repoPath, openaiKey);
  res.json(result);
});
```

### POST /api/rag/query

Chat with the indexed codebase.

```javascript
app.post('/api/rag/query', async (req, res) => {
  const { query, openaiKey } = req.body;

  // Search similar code, send to GPT-4 with context
  const result = await askCodebase(query, openaiKey);
  res.json(result);  // { answer: "...", context: [...] }
});
```

---

## Express Patterns

### Request & Response

```javascript
app.post('/api/example', (req, res) => {
  // req.body = request body (JSON)
  const { name, age } = req.body;

  // req.query = URL query params (?foo=bar)
  const { sort } = req.query;

  // req.params = URL params (/users/:id)
  const { id } = req.params;

  // Send response
  res.json({ message: 'Success' });

  // Or with status code
  res.status(400).json({ error: 'Bad request' });
});
```

### Async/Await with Try/Catch

```javascript
app.post('/api/analyze', async (req, res) => {
  try {
    const result = await someAsyncFunction();
    res.json(result);
  } catch (error) {
    // Handle errors gracefully
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

---

## Starting the Server

```javascript
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

This starts listening for HTTP requests on port 3005.

---

## Next: [Code Analysis](./07-code-analysis.md)
