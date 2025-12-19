'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import ReviewPanel from '@/components/ReviewPanel';
import { useSettings } from '@/context/SettingsContext';
import { Github, GitPullRequest, FolderGit2, Search, Loader2, ExternalLink, FileCode, AlertTriangle, Sparkles, Cpu, Settings, AlertCircle } from 'lucide-react';
import { API_URL } from '../../config';
import Link from 'next/link';

export default function GitHubPage() {
  const [mode, setMode] = useState('repo');
  const [analysisMode, setAnalysisMode] = useState('pattern');
  const { openaiKey } = useSettings();
  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [repoInfo, setRepoInfo] = useState(null);
  const [prInfo, setPrInfo] = useState(null);
  const [issues, setIssues] = useState([]);
  const [fileResults, setFileResults] = useState([]);

  const reset = () => {
    setUrl('');
    setError('');
    setRepoInfo(null);
    setPrInfo(null);
    setIssues([]);
    setFileResults([]);
  };

  const handleAnalyze = async () => {
    if (!url) {
      setError('Please enter a URL');
      return;
    }

    if (analysisMode === 'llm' && !openaiKey) {
      setError('API key required for AI mode');
      return;
    }

    setIsLoading(true);
    setError('');
    setRepoInfo(null);
    setPrInfo(null);
    setIssues([]);

    try {
      const endpoint = mode === 'repo' ? '/api/github/analyze-repo' : '/api/github/analyze-pr';
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          token: token || undefined,
          maxFiles: 30,
          mode: analysisMode,
          openaiKey
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Analysis failed');
      }

      const data = await response.json();

      if (mode === 'repo') {
        setRepoInfo({
          name: data.repository,
          filesAnalyzed: data.filesAnalyzed,
          totalFiles: data.totalFilesInRepo
        });
      } else {
        setPrInfo(data.pr);
      }

      setIssues(data.issues);
      setFileResults(data.fileResults || data.fileAnalysis || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filesWithIssues = fileResults.filter(f => (f.issues?.length || f.issueCount) > 0);

  return (
    <>
      <Navigation />
      <main className="main-content">
        <div className="github-page">
          {/* Header */}
          <header className="page-header">
            <div>
              <h1>GitHub Analysis</h1>
              <p>Scan repositories or review pull requests</p>
            </div>
          </header>

          {/* Mode Tabs */}
          <div className="mode-tabs">
            <button
              className={`mode-tab ${mode === 'repo' ? 'active' : ''}`}
              onClick={() => { setMode('repo'); reset(); }}
            >
              <FolderGit2 size={16} />
              Repository
            </button>
            <button
              className={`mode-tab ${mode === 'pr' ? 'active' : ''}`}
              onClick={() => { setMode('pr'); reset(); }}
            >
              <GitPullRequest size={16} />
              Pull Request
            </button>
          </div>

          {/* GitHub Actions Guide */}
          <details className="actions-guide">
            <summary className="actions-guide-header">
              <span className="guide-icon">🤖</span>
              <span className="guide-title">Automate PR Reviews with GitHub Actions</span>
              <span className="guide-badge">NEW</span>
            </summary>
            <div className="actions-guide-content">
              <p className="guide-intro">
                Set up PRISM to automatically review every PR in your repository.
                When a PR is opened, PRISM will analyze the code and post a comment with:
              </p>
              <ul className="guide-features">
                <li>📋 AI-generated summary of what the PR does</li>
                <li>🛡️ Security vulnerability detection</li>
                <li>📊 Code quality analysis</li>
                <li>💡 Suggested fixes</li>
              </ul>

              <div className="guide-steps">
                <div className="guide-step">
                  <span className="step-number">1</span>
                  <div className="step-content">
                    <h4>Add the workflow file</h4>
                    <p>Create <code>.github/workflows/prism-review.yml</code> in your repo:</p>
                    <pre className="code-block">{`name: PRISM Code Review
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
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          OPENAI_API_KEY: \${{ secrets.OPENAI_API_KEY }}
        run: |
          curl -X POST "https://prism-ai-code-review-docs.onrender.com/api/github/webhook" \\
            -H "Content-Type: application/json" \\
            -d '{
              "owner": "\${{ github.repository_owner }}",
              "repo": "\${{ github.event.repository.name }}",
              "prNumber": \${{ github.event.pull_request.number }},
              "token": "'"$GITHUB_TOKEN"'",
              "openaiKey": "'"$OPENAI_API_KEY"'"
            }'`}</pre>
                  </div>
                </div>

                <div className="guide-step">
                  <span className="step-number">2</span>
                  <div className="step-content">
                    <h4>Add your OpenAI API key (optional)</h4>
                    <p>For AI-powered summaries, go to your repo → <strong>Settings</strong> → <strong>Secrets</strong> → <strong>Actions</strong></p>
                    <ul className="secrets-list">
                      <li><code>OPENAI_API_KEY</code> — Enables AI summaries & deep analysis</li>
                    </ul>
                    <p className="note">Without an API key, PRISM uses pattern-based analysis (still catches security issues!)</p>
                  </div>
                </div>

                <div className="guide-step">
                  <span className="step-number">3</span>
                  <div className="step-content">
                    <h4>Open a PR</h4>
                    <p>That's it! Open a PR and PRISM will automatically post a review comment.</p>
                  </div>
                </div>
              </div>

            </div>
          </details>

          {/* Input Card */}

          <div className="input-card">
            {/* Analysis Mode */}
            <div className="form-group">
              <label>Analysis Engine</label>
              <div className="engine-toggle">
                <button
                  className={`engine-btn ${analysisMode === 'pattern' ? 'active' : ''}`}
                  onClick={() => setAnalysisMode('pattern')}
                >
                  <Cpu size={14} />
                  Pattern
                  <span className="badge free">Free</span>
                </button>
                <button
                  className={`engine-btn ${analysisMode === 'llm' ? 'active' : ''}`}
                  onClick={() => setAnalysisMode('llm')}
                >
                  <Sparkles size={14} />
                  AI
                  <span className="badge ai">GPT-4</span>
                </button>
              </div>

              {analysisMode === 'llm' && !openaiKey && (
                <div className="api-warning">
                  <AlertCircle size={14} />
                  <span>API key required</span>
                  <Link href="/settings" className="config-link">
                    <Settings size={12} /> Configure
                  </Link>
                </div>
              )}
            </div>

            {/* URL Input */}
            <div className="form-group">
              <label>{mode === 'repo' ? 'Repository URL' : 'Pull Request URL'}</label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={mode === 'repo' ? 'owner/repo or full URL' : 'https://github.com/owner/repo/pull/123'}
                className="url-input"
              />
            </div>

            {/* Token */}
            <div className="form-group">
              <label className="optional">GitHub Token (for private repos)</label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_..."
                className="token-input"
              />
            </div>

            {error && (
              <div className="error-msg">
                <AlertTriangle size={14} />
                {error}
              </div>
            )}

            <button
              className="btn-analyze"
              onClick={handleAnalyze}
              disabled={isLoading || !url}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search size={16} />
                  Analyze {mode === 'repo' ? 'Repository' : 'PR'}
                </>
              )}
            </button>
          </div>

          {/* Results */}
          {(repoInfo || prInfo) && (
            <div className="results-grid">
              <div className="results-left">
                {/* Info Card */}
                <div className="info-card">
                  {repoInfo && (
                    <>
                      <div className="info-header">
                        <FolderGit2 size={18} />
                        <span>{repoInfo.name}</span>
                        <a
                          href={`https://github.com/${repoInfo.name}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ext-link"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                      <div className="info-stats">
                        <span><strong>{repoInfo.filesAnalyzed}</strong> analyzed</span>
                        <span><strong>{repoInfo.totalFiles}</strong> total files</span>
                      </div>
                    </>
                  )}

                  {prInfo && (
                    <>
                      <div className="info-header">
                        <GitPullRequest size={18} />
                        <span>#{prInfo.number}: {prInfo.title}</span>
                      </div>
                      <div className="pr-meta">
                        by {prInfo.author} • {prInfo.baseBranch} ← {prInfo.headBranch}
                      </div>
                      <div className="info-stats">
                        <span className="additions">+{prInfo.additions}</span>
                        <span className="deletions">-{prInfo.deletions}</span>
                        <span>{prInfo.changedFiles} files</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Files */}
                {filesWithIssues.length > 0 && (
                  <div className="files-card">
                    <div className="files-header">
                      <FileCode size={16} />
                      <span>Files with Issues</span>
                    </div>
                    <div className="files-list">
                      {filesWithIssues.map((file, idx) => (
                        <div key={idx} className="file-item">
                          <span className="file-name">{file.path || file.filename}</span>
                          <span className="file-count">{file.issueCount || file.issues?.length}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {filesWithIssues.length === 0 && issues.length === 0 && (
                  <div className="no-issues">
                    🎉 No issues found!
                  </div>
                )}
              </div>

              <ReviewPanel issues={issues} isLoading={false} />
            </div>
          )}

          {/* Empty State */}
          {!repoInfo && !prInfo && !isLoading && (
            <div className="empty-state">
              <Github size={48} strokeWidth={1} />
              <p>Enter a URL above to analyze</p>
            </div>
          )}
        </div>
      </main>

      <style jsx>{`
        .github-page {
          max-width: 1200px;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: 1.5rem;
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

        .mode-tabs {
          display: inline-flex;
          gap: 0.25rem;
          padding: 0.25rem;
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          margin-bottom: 1.5rem;
        }

        .mode-tab {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: transparent;
          border: none;
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          font-size: 0.875rem;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .mode-tab:hover {
          color: var(--text-secondary);
        }

        .mode-tab.active {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .input-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          max-width: 600px;
        }

        .form-group {
          margin-bottom: 1.25rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .form-group label.optional {
          color: var(--text-muted);
        }

        .engine-toggle {
          display: inline-flex;
          gap: 0.25rem;
          padding: 0.25rem;
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
        }

        .engine-btn {
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

        .engine-btn:hover {
          color: var(--text-secondary);
        }

        .engine-btn.active {
          background: var(--bg-secondary);
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

        .url-input,
        .token-input {
          width: 100%;
          padding: 0.75rem 1rem;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-size: 0.9375rem;
        }

        .url-input:focus,
        .token-input:focus {
          outline: none;
          border-color: var(--accent-tertiary);
        }

        .error-msg {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
          padding: 0.75rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: var(--radius-md);
          color: #ef4444;
          font-size: 0.875rem;
        }

        .btn-analyze {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.75rem;
          background: var(--accent-primary);
          color: var(--bg-primary);
          border: none;
          border-radius: var(--radius-md);
          font-size: 0.9375rem;
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

        .results-grid {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 1.5rem;
        }

        .results-left {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .info-card,
        .files-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 1.25rem;
        }

        .info-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
          margin-bottom: 0.75rem;
        }

        .ext-link {
          margin-left: auto;
          color: var(--text-muted);
        }

        .ext-link:hover {
          color: var(--text-primary);
        }

        .info-stats {
          display: flex;
          gap: 1.5rem;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .additions {
          color: #22c55e;
        }

        .deletions {
          color: #ef4444;
        }

        .pr-meta {
          color: var(--text-muted);
          font-size: 0.8125rem;
          margin-bottom: 0.75rem;
        }

        .files-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 0.75rem;
        }

        .files-list {
          max-height: 300px;
          overflow-y: auto;
        }

        .file-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0.75rem;
          background: var(--bg-tertiary);
          border-radius: var(--radius-sm);
          margin-bottom: 0.375rem;
        }

        .file-name {
          font-family: var(--font-mono);
          font-size: 0.8125rem;
          color: var(--text-secondary);
        }

        .file-count {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          padding: 0.125rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.6875rem;
          font-weight: 600;
        }

        .no-issues {
          text-align: center;
          padding: 2rem;
          color: var(--text-muted);
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          padding: 4rem;
          color: var(--text-muted);
          text-align: center;
        }

        .spin {
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 1024px) {
          .results-grid {
            grid-template-columns: 1fr;
          }
        }

        /* GitHub Actions Guide Styles */
        .actions-guide {
          margin-bottom: 1.5rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }

        .actions-guide[open] {
          border-color: rgba(139, 92, 246, 0.3);
        }

        .actions-guide-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          cursor: pointer;
          list-style: none;
          user-select: none;
        }

        .actions-guide-header::-webkit-details-marker {
          display: none;
        }

        .actions-guide-header:hover {
          background: var(--bg-tertiary);
        }

        .guide-icon {
          font-size: 1.25rem;
        }

        .guide-title {
          font-weight: 500;
          font-size: 0.9375rem;
        }

        .guide-badge {
          font-size: 0.625rem;
          padding: 0.125rem 0.5rem;
          background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
          color: white;
          border-radius: 9999px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .actions-guide-content {
          padding: 0 1.25rem 1.25rem;
          border-top: 1px solid var(--border-color);
        }

        .guide-intro {
          margin: 1rem 0;
          color: var(--text-secondary);
          font-size: 0.875rem;
          line-height: 1.6;
        }

        .guide-features {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
          margin: 1rem 0;
          padding: 0;
          list-style: none;
        }

        .guide-features li {
          font-size: 0.8125rem;
          color: var(--text-secondary);
        }

        .guide-steps {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          margin-top: 1.5rem;
        }

        .guide-step {
          display: flex;
          gap: 1rem;
        }

        .step-number {
          flex-shrink: 0;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: 50%;
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .step-content {
          flex: 1;
        }

        .step-content h4 {
          font-size: 0.9375rem;
          font-weight: 600;
          margin-bottom: 0.375rem;
        }

        .step-content p {
          font-size: 0.8125rem;
          color: var(--text-secondary);
          margin-bottom: 0.75rem;
        }

        .step-content code {
          background: var(--bg-tertiary);
          padding: 0.125rem 0.375rem;
          border-radius: 4px;
          font-family: var(--font-mono);
          font-size: 0.75rem;
        }

        .code-block {
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 1rem;
          overflow-x: auto;
          font-family: var(--font-mono);
          font-size: 0.75rem;
          line-height: 1.6;
          color: var(--text-secondary);
          white-space: pre;
          margin: 0;
        }

        .secrets-list {
          padding-left: 1.25rem;
          margin: 0.5rem 0;
        }

        .secrets-list li {
          font-size: 0.8125rem;
          color: var(--text-secondary);
          margin-bottom: 0.375rem;
        }

        .note {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-style: italic;
          margin-top: 0.5rem;
        }

        @media (max-width: 640px) {
          .guide-features {
            grid-template-columns: 1fr;
          }
        }

      `}</style>

    </>
  );
}
