# AI-Powered Code Review & Documentation Platform

A comprehensive platform that automates code review, generates documentation, and provides AI-powered code understanding - acting as an automated senior engineer, technical writer, and security auditor.

## Features

### 🛡️ Tier 1: Automated Code Review
- **Security Vulnerability Detection**
  - SQL Injection patterns
  - XSS (Cross-Site Scripting) vulnerabilities
  - Hardcoded credentials and API keys
  - Insecure data exposure
  - Authentication issues

- **Code Quality Analysis**
  - Cyclomatic complexity detection
  - Missing error handling
  - Empty catch blocks
  - Use of `var` instead of `let/const`
  - Magic numbers and TODO comments

- **Performance Analysis**
  - N+1 query detection
  - Synchronous file operations
  - Memory leak patterns
  - Inefficient array operations

### 📚 Tier 2: Documentation Generation
- Auto-generate JSDoc comments
- README generation from codebase
- API documentation

## Quick Start

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
cd ai-code-review

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Running the Application

**Start the backend (Terminal 1):**
```bash
cd backend
npm run dev
```

**Start the frontend (Terminal 2):**
```bash
cd frontend
npm run dev
```

Open http://localhost:3000 in your browser.

## Usage

### Code Review
1. Navigate to "Code Review" from the dashboard
2. Paste your code in the editor or use the sample code
3. Select the programming language
4. Click "Analyze Code"
5. View issues organized by severity with explanations and fixes

### Documentation Generation
1. Navigate to "Documentation" from the dashboard
2. Paste your code in the editor
3. Click "Generate Docs"
4. View generated JSDoc and README documentation
5. Copy to clipboard as needed

## Architecture

```
ai-code-review/
├── frontend/                # Next.js 15 application
│   └── src/
│       ├── app/            # App Router pages
│       └── components/     # React components
│
└── backend/                 # Express.js API
    └── src/
        ├── services/
        │   ├── analyzers/  # Security, Quality, Performance
        │   └── documentationGenerator.js
        └── index.js        # API server
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/analyze` | POST | Analyze code for issues |
| `/api/generate-docs` | POST | Generate documentation |

## Technology Stack

- **Frontend:** Next.js 15, React 19, Monaco Editor
- **Backend:** Node.js, Express.js
- **Styling:** Custom CSS with glassmorphism design
- **Icons:** Lucide React

## License

MIT
