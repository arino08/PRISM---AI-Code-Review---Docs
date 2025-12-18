# PRISM - AI Code Review & Documentation

Welcome to the learning documentation for PRISM! This guide explains how every part of the project works, written for someone with JavaScript basics knowledge.

## What is PRISM?

PRISM is a web application that helps developers:
1. **Review code** for security vulnerabilities and quality issues
2. **Generate documentation** (JSDoc comments and README files)
3. **Analyze GitHub repositories** and Pull Requests
4. **Chat with codebases** using RAG (Retrieval-Augmented Generation)

## Project Architecture

```
ai-code-review/
├── frontend/          # Next.js React app (the website)
├── backend/           # Express.js API server (the brain)
├── docker-compose.yml # Runs everything together
└── weaviate_data/     # Vector database storage (for RAG)
```

### How They Connect

```
┌─────────────────┐     HTTP      ┌─────────────────┐     Embeddings    ┌─────────────┐
│    Frontend     │ ──────────▶  │     Backend     │  ─────────────▶   │  Weaviate   │
│   (Next.js)     │              │   (Express)     │                    │ (Vector DB) │
│   Port 3004     │ ◀────────── │   Port 3005     │  ◀───────────────  │  Port 8080  │
└─────────────────┘     JSON     └─────────────────┘     Vectors        └─────────────┘
                                        │
                                        ▼
                                 ┌─────────────┐
                                 │  OpenAI API │
                                 │   (GPT-4)   │
                                 └─────────────┘
```

## Documentation Index

### Frontend (Next.js)
- [01-nextjs-basics.md](./01-nextjs-basics.md) - How Next.js works
- [02-pages-explained.md](./02-pages-explained.md) - Each page breakdown
- [03-components.md](./03-components.md) - Reusable components
- [04-context-state.md](./04-context-state.md) - State management
- [05-styling.md](./05-styling.md) - CSS and theming

### Backend (Express)
- [06-express-api.md](./06-express-api.md) - API server basics
- [07-code-analysis.md](./07-code-analysis.md) - How code scanning works
- [08-github-integration.md](./08-github-integration.md) - GitHub API usage
- [09-rag-chat.md](./09-rag-chat.md) - RAG and vector search
- [10-llm-integration.md](./10-llm-integration.md) - OpenAI integration

### DevOps
- [11-docker.md](./11-docker.md) - Containerization explained

---

> **Tip:** Start with [01-nextjs-basics.md](./01-nextjs-basics.md) if you're new to Next.js!
