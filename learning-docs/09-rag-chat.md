# 09 - RAG Chat System

## What is RAG?

**RAG** = Retrieval-Augmented Generation

Instead of just asking GPT-4 a question, we:
1. **Retrieve** relevant code snippets from a vector database
2. **Augment** the question with that code as context
3. **Generate** an answer using GPT-4 with the context

This lets GPT-4 answer questions about YOUR specific codebase!

---

## How It Works

```
┌──────────────────────────────────────────────────────────────────┐
│                        INDEXING PHASE                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  GitHub Repo  →  Clone  →  Split into Chunks  →  Create Vectors │
│                              (1000 chars)           (embeddings)  │
│                                                         ↓        │
│                                              Store in Weaviate   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                         QUERY PHASE                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User Question  →  Create Vector  →  Search Weaviate  →  Top 10 │
│  "How does auth work?"                                   matches │
│                                                            ↓     │
│                                    Send to GPT-4 with context   │
│                                              ↓                  │
│                                         Answer + Sources        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## The Three Services

### 1. Ingestion (ingestion.js)

Indexes a repository into the vector database.

```javascript
async function ingestRepo(repoInput, apiKey) {
  // 1. Clone repo if it's a GitHub URL
  let repoPath = repoInput;
  if (isGitHubUrl(repoInput)) {
    repoPath = await cloneRepo(repoInput);  // git clone to temp folder
  }

  // 2. Find all code files
  const files = await glob('**/*.{js,ts,py,rs,go,...}', {
    cwd: repoPath,
    ignore: ['**/node_modules/**', '**/.git/**']
  });

  // 3. Split files into chunks
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,      // 1000 characters per chunk
    chunkOverlap: 200,    // 200 char overlap between chunks
    separators: ["\nfunction", "\nclass", "\n//", "\n"]
  });

  // 4. Store chunks in Weaviate
  const batcher = client.batch.objectsBatcher();

  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');
    const chunks = await textSplitter.createDocuments([content]);

    for (const chunk of chunks) {
      batcher.withObject({
        class: 'CodeSnippet',
        properties: {
          code: chunk.pageContent,
          filename: relativePath,
          language: 'js'
        }
      });
    }
  }

  await batcher.do();  // Weaviate auto-creates embeddings!
}
```

**Key Concepts:**

- **Embeddings** = Numbers that represent text meaning
- **Weaviate** = Vector database that stores and searches embeddings
- **Chunking** = Splitting code into smaller pieces

### 2. Search (search.js)

Finds relevant code chunks for a query.

```javascript
async function semanticSearch(query, apiKey, limit = 10) {
  const client = getClient(apiKey);

  // Vector search - finds similar code by meaning, not keywords!
  const result = await client.graphql
    .get()
    .withClassName('CodeSnippet')
    .withNearText({ concepts: [query] })  // "nearText" = vector similarity
    .withLimit(limit)
    .withFields('code filename language startLine')
    .do();

  return result.data.Get.CodeSnippet;
}
```

**Why Vector Search is Magic:**

| Traditional Search | Vector Search |
|-------------------|---------------|
| "auth" matches "auth" | "auth" matches "login", "password", "session" |
| Exact keywords only | Understands meaning |
| Miss renamed functions | Finds conceptually similar code |

### 3. RAG Analyzer (ragAnalyzer.js)

Combines search + GPT-4.

```javascript
async function askCodebase(query, apiKey) {
  // 1. Search for relevant code
  const contextItems = await semanticSearch(query, apiKey, 10);

  // 2. Format as prompt context
  const contextString = contextItems.map(item =>
    `File: ${item.filename}\n\`\`\`${item.language}\n${item.code}\n\`\`\``
  ).join('\n\n');

  // 3. Create system prompt
  const systemPrompt = `You are a codebase expert. Answer using this context:

--- Code Context ---
${contextString}
`;

  // 4. Call GPT-4
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ]
    })
  });

  const data = await response.json();
  return {
    answer: data.choices[0].message.content,
    context: contextItems  // Return sources for UI
  };
}
```

---

## Weaviate Setup

Weaviate runs in Docker (see docker-compose.yml):

```yaml
weaviate:
  image: semitechnologies/weaviate:1.28.0
  environment:
    ENABLE_MODULES: 'text2vec-openai'  # Use OpenAI embeddings
    OPENAI_APIKEY: ${OPENAI_API_KEY}
```

The `text2vec-openai` module automatically creates embeddings when you insert data!

---

## Next: [LLM Integration](./10-llm-integration.md)
