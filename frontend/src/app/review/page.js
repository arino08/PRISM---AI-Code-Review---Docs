'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Navigation from '@/components/Navigation';
import ReviewPanel from '@/components/ReviewPanel';
import { API_URL } from '../../config';
import { useSettings } from '@/context/SettingsContext';
import { Play, Sparkles, Cpu, AlertCircle, Settings } from 'lucide-react';
import Link from 'next/link';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="editor-loading">
      <div className="spinner"></div>
      <span>Loading editor...</span>
    </div>
  )
});

const DEFAULT_CODE = `// Paste your code here or try this sample

// ❌ SQL Injection
function getUserByEmail(email) {
  const query = \`SELECT * FROM users WHERE email = '\${email}'\`;
  return db.execute(query);
}

// ❌ XSS Vulnerability
function displayComment(comment) {
  document.getElementById('output').innerHTML = comment;
}

// ❌ Hardcoded Credentials
const config = {
  adminPassword: "admin123",
  apiKey: "sk-1234567890abcdef"
};
`;

export default function ReviewPage() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [language, setLanguage] = useState('javascript');
  const [issues, setIssues] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mode, setMode] = useState('pattern');
  const { openaiKey } = useSettings();

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setIssues([]);

    try {
      if (mode === 'llm' && !openaiKey) {
        throw new Error("API key required for AI mode");
      }

      const response = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, mode, openaiKey })
      });
      const data = await response.json();
      setIssues(data.issues || []);
    } catch (error) {
      setIssues([{
        id: 'error',
        severity: 'critical',
        title: error.message,
        line: 0
      }]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <>
      <Navigation />
      <main className="main-content">
        <div className="review-page">
          {/* Header */}
          <header className="page-header">
            <div>
              <h1>Code Review</h1>
              <p>Scan for vulnerabilities and quality issues</p>
            </div>
            <div className="header-actions">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="lang-select"
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="go">Go</option>
                <option value="java">Java</option>
                <option value="rust">Rust</option>
                <option value="php">PHP</option>
              </select>

              <button
                className="btn-analyze"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
              >
                <Play size={16} />
                {isAnalyzing ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
          </header>

          {/* Mode Toggle */}
          <div className="mode-section">
            <div className="mode-toggle">
              <button
                className={`mode-btn ${mode === 'pattern' ? 'active' : ''}`}
                onClick={() => setMode('pattern')}
              >
                <Cpu size={14} />
                Pattern
                <span className="badge free">Free</span>
              </button>
              <button
                className={`mode-btn ${mode === 'llm' ? 'active' : ''}`}
                onClick={() => setMode('llm')}
              >
                <Sparkles size={14} />
                AI
                <span className="badge ai">GPT-4</span>
              </button>
            </div>

            {mode === 'llm' && !openaiKey && (
              <div className="api-warning">
                <AlertCircle size={14} />
                <span>API key required</span>
                <Link href="/settings" className="config-link">
                  <Settings size={12} /> Configure
                </Link>
              </div>
            )}
          </div>

          {/* Editor Layout */}
          <div className="editor-layout">
            <div className="editor-pane">
              <MonacoEditor
                height="100%"
                language={language}
                value={code}
                onChange={(value) => setCode(value || '')}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  fontFamily: "var(--font-mono)",
                  padding: { top: 16 },
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  lineNumbers: 'on',
                }}
              />
            </div>

            <ReviewPanel issues={issues} isLoading={isAnalyzing} />
          </div>
        </div>
      </main>

      <style jsx>{`
        .review-page {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 80px);
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .page-header h1 {
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .page-header p {
          color: var(--text-muted);
          font-size: 0.875rem;
        }

        .header-actions {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }

        .lang-select {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 0.5rem 0.875rem;
          border-radius: var(--radius-md);
          font-size: 0.8125rem;
          cursor: pointer;
        }

        .btn-analyze {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--accent-primary);
          color: var(--bg-primary);
          border: none;
          padding: 0.5rem 1rem;
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: opacity var(--transition-fast);
        }

        .btn-analyze:hover:not(:disabled) {
          opacity: 0.85;
        }

        .btn-analyze:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .mode-section {
          margin-bottom: 1rem;
        }

        .mode-toggle {
          display: inline-flex;
          gap: 0.25rem;
          padding: 0.25rem;
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
        }

        .mode-btn {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.5rem 0.75rem;
          background: transparent;
          border: none;
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          font-size: 0.8125rem;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .mode-btn:hover {
          color: var(--text-secondary);
        }

        .mode-btn.active {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .badge {
          font-size: 0.625rem;
          padding: 0.125rem 0.375rem;
          border-radius: 3px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .badge.free {
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
        }

        .badge.ai {
          background: rgba(139, 92, 246, 0.15);
          color: #a78bfa;
        }

        .api-warning {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.75rem;
          padding: 0.5rem 0.75rem;
          background: rgba(234, 179, 8, 0.1);
          border: 1px solid rgba(234, 179, 8, 0.2);
          border-radius: var(--radius-md);
          color: #eab308;
          font-size: 0.8125rem;
        }

        .config-link {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          margin-left: 0.5rem;
          padding: 0.25rem 0.5rem;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
          color: var(--text-primary);
          text-decoration: none;
          font-size: 0.75rem;
        }

        .editor-layout {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 1rem;
          min-height: 0;
        }

        .editor-pane {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }

        .editor-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: 0.75rem;
          color: var(--text-muted);
        }

        .spinner {
          width: 24px;
          height: 24px;
          border: 2px solid var(--border-color);
          border-top-color: var(--accent-primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 1024px) {
          .editor-layout {
            grid-template-columns: 1fr;
            grid-template-rows: 1fr 400px;
          }
        }
      `}</style>
    </>
  );
}
