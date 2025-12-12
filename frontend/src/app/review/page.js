'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Navigation from '@/components/Navigation';
import ReviewPanel from '@/components/ReviewPanel';
import { API_URL } from '../../config';
import { useSettings } from '@/context/SettingsContext';
import { Play, Sparkles, Cpu, Settings as SettingsIcon, AlertCircle } from 'lucide-react';
import Link from 'next/link';

// Dynamically import Monaco to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="loading">
      <div className="loading-spinner"></div>
      <span>Loading editor...</span>
    </div>
  )
});

const DEFAULT_CODE = `// Paste your code here or try this sample with vulnerabilities

// ❌ SQL Injection Vulnerability
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
  adminUser: "admin",
  adminPassword: "admin123",
  apiKey: "sk-1234567890abcdef"
};
`;

export default function ReviewPage() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [language, setLanguage] = useState('javascript');
  const [issues, setIssues] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisMode, setAnalysisMode] = useState('pattern'); // 'pattern' or 'llm'
  const { openaiKey } = useSettings();

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setIssues([]);

    try {
      // Check API Key for LLM mode
      if (analysisMode === 'llm' && !openaiKey) {
        throw new Error("OpenAI API Key is required for AI mode. Please configure it in Settings.");
      }

      const response = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          mode: analysisMode,
          openaiKey
        })
      });
      const data = await response.json();
      setIssues(data.issues || []);
    } catch (error) {
      console.error('Analysis failed:', error);
      // Show error in UI as a system-level issue
      setIssues([{
        id: 'system-error',
        ruleId: 'SYSTEM_ERROR',
        severity: 'critical',
        message: error.message || 'Analysis failed. Please check backend connection.',
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
        <div className="editor-page">
          <div className="editor-section">
            <div className="section-header">
              <h2 className="section-title">
                <Sparkles size={20} />
                AI Code Review
              </h2>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="language-select"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python</option>
                </select>
                <button
                  className="btn btn-primary"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                >
                  <Play size={18} />
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Code'}
                </button>
              </div>
            </div>

            {/* Mode Toggle */}
            <div className="mode-toggle-container">
              <div className="mode-toggle">
                <button
                  className={`mode-btn ${analysisMode === 'pattern' ? 'active' : ''}`}
                  onClick={() => setAnalysisMode('pattern')}
                >
                  <Cpu size={16} />
                  Pattern Matching
                  <span className="mode-badge free">Free</span>
                </button>
                <button
                  className={`mode-btn ${analysisMode === 'llm' ? 'active' : ''}`}
                  onClick={() => setAnalysisMode('llm')}
                >
                  <Sparkles size={16} />
                  AI (GPT-4)
                  <span className="mode-badge pro">Deep</span>
                </button>
              </div>

              {analysisMode === 'llm' && !openaiKey && (
                <div className="api-notice">
                  <AlertCircle size={16} />
                  <span>API Key required for AI mode.</span>
                  <Link href="/settings" className="settings-link">
                    Configure <SettingsIcon size={12} />
                  </Link>
                </div>
              )}
            </div>

            <div className="editor-container">
              <MonacoEditor
                height="100%"
                language={language}
                value={code}
                onChange={(value) => setCode(value || '')}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  padding: { top: 16 },
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  lineNumbers: 'on',
                }}
              />
            </div>
          </div>

          <ReviewPanel issues={issues} isLoading={isAnalyzing} />
        </div>
      </main>

      <style jsx>{`
        .mode-toggle-container {
          margin-bottom: 1rem;
        }
        .mode-toggle {
          display: flex;
          gap: 0.5rem;
          padding: 0.25rem;
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          width: fit-content;
        }
        .mode-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1rem;
          background: transparent;
          border: none;
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .mode-btn:hover {
          color: var(--text-primary);
        }
        .mode-btn.active {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }
        .mode-badge {
          font-size: 0.6875rem;
          padding: 0.125rem 0.375rem;
          border-radius: 4px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .mode-badge.free {
          background: rgba(34, 197, 94, 0.15);
          color: var(--color-low);
        }
        .mode-badge.pro {
          background: rgba(139, 92, 246, 0.15);
          color: var(--accent-secondary);
        }
        .api-notice {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-top: 0.75rem;
          padding: 0.75rem 1rem;
          background: rgba(234, 179, 8, 0.1);
          border: 1px solid rgba(234, 179, 8, 0.2);
          border-radius: var(--radius-md);
          color: #eab308;
          font-size: 0.875rem;
        }
        .settings-link {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: var(--text-primary);
          text-decoration: none;
          font-weight: 500;
          font-size: 0.8125rem;
          background: rgba(0,0,0,0.2);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
        }
        .settings-link:hover {
          background: rgba(0,0,0,0.4);
        }
      `}</style>
    </>
  );
}
