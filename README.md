<p align="center">
  <img src="frontend/icon.svg" alt="PRISM Logo" width="120" height="120">
</p>

<h1 align="center">PRISM</h1>
<h3 align="center">AI-Powered Code Review & Documentation Platform</h3>

<p align="center">
  <strong>Your automated senior engineer, security auditor, and technical writer — all in one.</strong>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-usage">Usage</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-api-reference">API Reference</a> •
  <a href="#-docker-deployment">Docker</a> •
  <a href="#-learning-docs">Learn</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/Express.js-4-green?style=for-the-badge&logo=express" alt="Express">
  <img src="https://img.shields.io/badge/OpenAI-GPT--4-412991?style=for-the-badge&logo=openai" alt="OpenAI">
  <img src="https://img.shields.io/badge/Weaviate-Vector_DB-00A98F?style=for-the-badge" alt="Weaviate">
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker" alt="Docker">
</p>

---

## ✨ Features

PRISM provides a comprehensive suite of AI-powered development tools designed to enhance code quality, security, and documentation.

### 🛡️ Automated Code Review

<table>
<tr>
<td width="50%">

#### Security Analysis
- SQL Injection detection
- XSS (Cross-Site Scripting) vulnerabilities
- Hardcoded credentials & API keys
- Insecure data exposure
- Authentication weaknesses
- Command injection risks

</td>
<td width="50%">

#### Code Quality
- Cyclomatic complexity detection
- Missing error handling
- Empty catch blocks
- `var` vs `let/const` usage
- Magic numbers detection
- TODO comment tracking

</td>
</tr>
<tr>
<td width="50%">

#### Performance Analysis
- N+1 query detection
- Synchronous file operations
- Memory leak patterns
- Inefficient array operations
- Blocking I/O detection

</td>
<td width="50%">

#### Dual Analysis Modes
- **Pattern Mode**: Fast, regex-based analysis (free)
- **LLM Mode**: Deep AI-powered analysis using GPT-4
- Severity classification (Critical, High, Moderate, Low)
- Actionable fix suggestions

</td>
</tr>
</table>

### 📚 Documentation Generation

- **JSDoc Comments**: Auto-generate comprehensive function documentation
- **README Generation**: Create project descriptions from codebase analysis
- **API Documentation**: Document endpoints and parameters
- Support for pattern-based and LLM-enhanced generation

### 🐙 GitHub Integration

| Feature | Description |
|---------|-------------|
| **Repository Analysis** | Analyze entire GitHub repositories for issues |
| **Pull Request Review** | Review PR diffs and added code for problems |
| **GitHub Actions** | 🆕 Automatic PR analysis via CI/CD workflow |
| **AI PR Summaries** | 🆕 LLM-generated descriptions of what each PR does |
| **File Tree Exploration** | Browse repository structure before analysis |
| **OAuth Authentication** | Secure GitHub sign-in for private repos |


### 💬 RAG Chat (Ask Your Codebase)

PRISM includes a powerful Retrieval-Augmented Generation chat system:

- **Ingest Repositories**: Index entire codebases into a vector database
- **Semantic Search**: Find relevant code using natural language queries
- **AI-Powered Answers**: Get context-aware responses about your code
- **Powered by Weaviate**: Enterprise-grade vector database for embeddings

### 🎨 Modern UI/UX

- **Glassmorphism Design**: Beautiful, modern aesthetic
- **Monaco Editor**: VS Code-quality code editing experience
- **Dark Mode**: Eye-friendly interface for long sessions
- **Responsive Layout**: Works on desktop and tablets
- **Custom Cursor Effects**: Engaging interactive elements
- **3D Background Effects**: Dynamic visual experience

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **npm** or **yarn**
- **OpenAI API Key** (for LLM features)
- **Docker & Docker Compose** (for containerized deployment)

### Local Development Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/ai-code-review.git
cd ai-code-review

# Create environment file with your API keys
cp .env.example .env
# Edit .env with your OPENAI_API_KEY, GITHUB_ID, GITHUB_SECRET

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Running the Application

**Terminal 1 - Start Backend:**
```bash
cd backend
npm run dev
# Server starts on http://localhost:3005
```

**Terminal 2 - Start Frontend:**
```bash
cd frontend
npm run dev
# App available at http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📖 Usage

### Code Review

1. Navigate to **Code Review** from the dashboard
2. Paste your code in the Monaco editor (or use sample code)
3. Select the programming language
4. Choose analysis mode:
   - **Pattern Mode**: Fast, free analysis
   - **LLM Mode**: Deep AI analysis (requires OpenAI key)
5. Click **Analyze Code**
6. View issues organized by severity with explanations and fix suggestions

### Documentation Generation

1. Navigate to **Documentation** from the dashboard
2. Paste your code in the editor
3. Click **Generate Docs**
4. View generated:
   - JSDoc comments for functions
   - README documentation
5. Copy to clipboard as needed

### GitHub Repository Analysis

1. Navigate to **GitHub** from the dashboard
2. Sign in with GitHub (optional, for private repos)
3. Enter repository URL (e.g., `https://github.com/user/repo`)
4. Click **Analyze Repository**
5. View comprehensive analysis across all files

### Pull Request Review

1. Enter the Pull Request URL
2. PRISM analyzes only the changed code
3. Get focused feedback on new/modified code

### RAG Chat

1. Navigate to **Chat** or **Setup** page
2. Enter repository path and OpenAI API key
3. Click **Ingest Repository** to index the codebase
4. Ask natural language questions about the code
5. Get AI-powered answers with code context

### 🤖 GitHub Actions (Automatic PR Review)

Set up PRISM to automatically review every Pull Request in your repository:

**Step 1: Copy the workflow file**

Copy `.github/workflows/prism-review.yml` to your repository:

```yaml
name: PRISM Code Review
on:
  pull_request:
    types: [opened, synchronize, reopened]
permissions:
  contents: read
  pull-requests: write
jobs:
  prism-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: PRISM Analysis
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          PRISM_API_URL: ${{ secrets.PRISM_API_URL }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: |
          curl -X POST "$PRISM_API_URL/api/github/webhook" \
            -H "Content-Type: application/json" \
            -d '{
              "owner": "${{ github.repository_owner }}",
              "repo": "${{ github.event.repository.name }}",
              "prNumber": ${{ github.event.pull_request.number }},
              "token": "'"$GITHUB_TOKEN"'",
              "openaiKey": "'"$OPENAI_API_KEY"'"
            }'
```

**Step 2: Add repository secrets**

In your repo → Settings → Secrets:
- `PRISM_API_URL`: Your PRISM backend URL
- `OPENAI_API_KEY`: OpenAI key for LLM summaries

**What you get:**

Every PR will receive an automated comment with:
- 📋 **PR Summary**: AI-generated description of what the PR does
- 🏷️ **Category**: feature/bugfix/refactor/docs/etc.
- 📊 **Impact Level**: Low/Medium/High
- 🔍 **Security Analysis**: Vulnerabilities detected
- 💡 **Fix Suggestions**: How to resolve issues
- ⚠️ **Breaking Changes**: Warnings if detected

---


## 🏗️ Architecture

```
ai-code-review/
├── frontend/                    # Next.js 14 Application
│   ├── src/
│   │   ├── app/                # App Router pages
│   │   │   ├── page.js         # Dashboard
│   │   │   ├── review/         # Code review page
│   │   │   ├── docs/           # Documentation generator
│   │   │   ├── github/         # GitHub integration
│   │   │   ├── chat/           # RAG chat interface
│   │   │   ├── setup/          # Configuration page
│   │   │   ├── settings/       # User settings
│   │   │   └── api/auth/       # NextAuth.js endpoints
│   │   ├── components/         # Reusable UI components
│   │   │   ├── Dashboard.js    # Main dashboard
│   │   │   ├── ReviewPanel.js  # Code review UI
│   │   │   ├── Navigation.js   # Nav bar
│   │   │   ├── Background3D.js # 3D effects
│   │   │   └── CustomCursor.js # Cursor effects
│   │   └── context/            # React Context (settings)
│   └── public/                 # Static assets
│
├── backend/                     # Express.js API Server
│   └── src/
│       ├── index.js            # Main server & routes
│       └── services/
│           ├── analyzers/      # Code analysis engines
│           │   ├── securityAnalyzer.js
│           │   ├── qualityAnalyzer.js
│           │   └── performanceAnalyzer.js
│           ├── documentationGenerator.js
│           ├── githubService.js
│           ├── llmAnalyzer.js  # OpenAI integration
│           └── rag/            # RAG system
│               ├── ingestion.js
│               ├── search.js
│               └── ragAnalyzer.js
│
├── docker-compose.yml          # Container orchestration
├── weaviate_data/             # Vector DB persistence
└── learning-docs/              # Comprehensive documentation
```

### System Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │  Dashboard  │  │ Code Review │  │    Docs     │  │ GitHub Analysis │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘ │
│         │                │                │                   │          │
│         └────────────────┴────────────────┴───────────────────┘          │
│                                    │                                     │
│                              Next.js 14                                  │
└────────────────────────────────────┼─────────────────────────────────────┘
                                     │ HTTP/JSON
┌────────────────────────────────────┼─────────────────────────────────────┐
│                              BACKEND                                     │
│                                    ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                        Express.js Server                            │ │
│  │  ┌───────────┐  ┌───────────┐  ┌────────────┐  ┌─────────────────┐  │ │
│  │  │  /analyze │  │/gen-docs  │  │  /github/* │  │    /rag/*       │  │ │
│  │  └─────┬─────┘  └─────┬─────┘  └──────┬─────┘  └───────┬─────────┘  │ │
│  └────────┼──────────────┼───────────────┼────────────────┼────────────┘ │
│           │              │               │                │              │
│   ┌───────▼───────┐ ┌────▼────┐ ┌────────▼───────┐ ┌──────▼──────┐      │
│   │   Analyzers   │ │  Doc    │ │ GitHub Service │ │ RAG System  │      │
│   │ • Security    │ │Generator│ │ • Repo fetch   │ │ • Ingest    │      │
│   │ • Quality     │ │         │ │ • PR analysis  │ │ • Search    │      │
│   │ • Performance │ │         │ │ • OAuth        │ │ • Chat      │      │
│   └───────────────┘ └─────────┘ └────────────────┘ └──────┬──────┘      │
│                                                           │              │
└───────────────────────────────────────────────────────────┼──────────────┘
                                                            │
                   ┌────────────────────────────────────────┴────┐
                   │                                             │
           ┌───────▼───────┐                           ┌─────────▼─────────┐
           │   OpenAI API   │                           │     Weaviate      │
           │   (GPT-4)      │                           │   Vector DB       │
           │ • LLM Analysis │                           │ • Embeddings      │
           │ • Chat         │                           │ • Semantic Search │
           └───────────────┘                           └───────────────────┘
```

---

## 📡 API Reference

### Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check and version info |
| `/api/analyze` | POST | Analyze code for issues |
| `/api/generate-docs` | POST | Generate documentation |

### GitHub Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/github/repo` | POST | Get repo info and file tree |
| `/api/github/analyze-repo` | POST | Analyze entire repository |
| `/api/github/analyze-pr` | POST | Analyze Pull Request changes |
| `/api/github/webhook` | POST | 🆕 GitHub Actions webhook (auto-review PRs) |
| `/api/github/review-pr` | POST | Analyze PR and post comments directly |


### RAG Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/rag/ingest` | POST | Ingest repository into vector DB |
| `/api/rag/search` | POST | Semantic search in codebase |
| `/api/rag/ask` | POST | Ask questions about code |

### Example: Code Analysis Request

```bash
curl -X POST http://localhost:3005/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "code": "const password = \"admin123\";",
    "language": "javascript",
    "mode": "pattern"
  }'
```

**Response:**
```json
{
  "issues": [
    {
      "type": "hardcoded-credentials",
      "severity": "critical",
      "message": "Hardcoded password detected",
      "line": 1,
      "suggestion": "Use environment variables for sensitive data"
    }
  ],
  "summary": {
    "total": 1,
    "critical": 1,
    "high": 0,
    "moderate": 0,
    "low": 0
  }
}
```

---

## 🐳 Docker Deployment

### Quick Start with Docker Compose

```bash
# Set environment variables
export OPENAI_API_KEY="your-openai-key"
export GITHUB_ID="your-github-oauth-id"
export GITHUB_SECRET="your-github-oauth-secret"

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### Services

| Service | Port | Description |
|---------|------|-------------|
| `frontend` | 3008 | Next.js application |
| `backend` | 3005 | Express.js API |
| `weaviate` | 8090 | Vector database |

### Production Deployment

For production, update `docker-compose.yml`:

```yaml
environment:
  - NEXTAUTH_URL=https://your-domain.com
  - NEXTAUTH_SECRET=generate-a-secure-secret
  - NEXT_PUBLIC_API_URL=https://api.your-domain.com
```

---

## 📚 Learning Docs

PRISM includes comprehensive learning documentation for developers who want to understand how the project works. Perfect for contributors or those learning modern web development.

### Documentation Index

| Document | Topic |
|----------|-------|
| [01-nextjs-basics.md](learning-docs/01-nextjs-basics.md) | How Next.js App Router works |
| [02-pages-explained.md](learning-docs/02-pages-explained.md) | Each page breakdown |
| [03-components.md](learning-docs/03-components.md) | Reusable React components |
| [04-context-state.md](learning-docs/04-context-state.md) | React Context state management |
| [05-styling.md](learning-docs/05-styling.md) | CSS and glassmorphism theming |
| [06-express-api.md](learning-docs/06-express-api.md) | Express.js API basics |
| [07-code-analysis.md](learning-docs/07-code-analysis.md) | How code scanning works |
| [08-github-integration.md](learning-docs/08-github-integration.md) | GitHub API integration |
| [09-rag-chat.md](learning-docs/09-rag-chat.md) | RAG and vector search |
| [10-llm-integration.md](learning-docs/10-llm-integration.md) | OpenAI/LangChain integration |
| [11-docker.md](learning-docs/11-docker.md) | Containerization explained |

---

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **Monaco Editor** - VS Code editor component
- **NextAuth.js** - Authentication (GitHub OAuth)
- **Lucide React** - Icon library
- **React Markdown** - Markdown rendering

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **LangChain** - LLM orchestration
- **OpenAI SDK** - GPT-4 integration
- **Weaviate Client** - Vector database client
- **Acorn** - JavaScript parser for code analysis

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Container orchestration
- **Weaviate** - Vector database for RAG
- **GitHub Actions** - CI/CD (optional)

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# OpenAI (required for LLM features)
OPENAI_API_KEY=sk-your-openai-key

# GitHub OAuth (required for GitHub integration)
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret

# NextAuth (required for authentication)
NEXTAUTH_SECRET=your-random-secret-string
NEXTAUTH_URL=http://localhost:3000

# API URL (for frontend to connect to backend)
NEXT_PUBLIC_API_URL=http://localhost:3005
```

### GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set Homepage URL: `http://localhost:3000`
4. Set Callback URL: `http://localhost:3000/api/auth/callback/github`
5. Copy Client ID and Client Secret to `.env`

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with ❤️ using Next.js, Express, and OpenAI
</p>
