'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import ReviewPanel from '@/components/ReviewPanel';
import { useSettings } from '@/context/SettingsContext';
import { Github, GitPullRequest, FolderGit2, Search, Loader2, ExternalLink, FileCode, AlertTriangle, Sparkles, Cpu, Settings as SettingsIcon, AlertCircle } from 'lucide-react';
import { API_URL } from '../../config';
import Link from 'next/link';

export default function GitHubPage() {
  const [mode, setMode] = useState('repo'); // 'repo' or 'pr'
  const [analysisMode, setAnalysisMode] = useState('pattern'); // 'pattern' or 'llm'
  const { openaiKey } = useSettings();
  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [repoInfo, setRepoInfo] = useState(null);
  const [prInfo, setPrInfo] = useState(null);
  const [issues, setIssues] = useState([]);
  const [fileResults, setFileResults] = useState([]);
  const [summary, setSummary] = useState(null);

  const analyzeRepo = async () => {
    if (!url) {
      setError('Please enter a repository URL');
      return;
    }

    if (analysisMode === 'llm' && !openaiKey) {
      setError('OpenAI API key is required for AI mode. Please configure it in Settings.');
      return;
    }

    setIsLoading(true);
    setError('');
    setRepoInfo(null);
    setIssues([]);

    try {
      const response = await fetch(`${API_URL}/api/github/analyze-repo`, {
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
        throw new Error(data.message || 'Failed to analyze repository');
      }

      const data = await response.json();
      setRepoInfo({
        name: data.repository,
        filesAnalyzed: data.filesAnalyzed,
        totalFiles: data.totalFilesInRepo
      });
      setIssues(data.issues);
      setFileResults(data.fileResults);
      setSummary(data.summary);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzePR = async () => {
    if (!url) {
      setError('Please enter a Pull Request URL');
      return;
    }

    if (analysisMode === 'llm' && !openaiKey) {
      setError('OpenAI API key is required for AI mode. Please configure it in Settings.');
      return;
    }

    setIsLoading(true);
    setError('');
    setPrInfo(null);
    setIssues([]);

    try {
      const response = await fetch('http://localhost:3005/api/github/analyze-pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          token: token || undefined,
          mode: analysisMode,
          openaiKey
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to analyze pull request');
      }

      const data = await response.json();
      setPrInfo(data.pr);
      setIssues(data.issues);
      setFileResults(data.fileAnalysis);
      setSummary(data.summary);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = () => {
    if (mode === 'repo') {
      analyzeRepo();
    } else {
      analyzePR();
    }
  };

  return (
    <>
      <Navigation />
      <main className="main-content">
        <div className="dashboard">
          <header className="dashboard-header" style={{ paddingBottom: '1rem' }}>
            <h1 className="dashboard-title" style={{ fontSize: '2.5rem' }}>
              <Github style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} size={40} />
              GitHub Integration
            </h1>
            <p className="dashboard-subtitle">
              Analyze entire repositories or review Pull Requests for security vulnerabilities and code quality issues.
            </p>
          </header>

          {/* Mode Tabs */}
          <div className="tabs" style={{ maxWidth: '400px', margin: '0 auto 2rem' }}>
            <button
              className={`tab ${mode === 'repo' ? 'active' : ''}`}
              onClick={() => { setMode('repo'); setUrl(''); setError(''); setRepoInfo(null); setPrInfo(null); setIssues([]); }}
            >
              <FolderGit2 size={16} style={{ marginRight: '0.5rem' }} />
              Repository
            </button>
            <button
              className={`tab ${mode === 'pr' ? 'active' : ''}`}
              onClick={() => { setMode('pr'); setUrl(''); setError(''); setRepoInfo(null); setPrInfo(null); setIssues([]); }}
            >
              <GitPullRequest size={16} style={{ marginRight: '0.5rem' }} />
              Pull Request
            </button>
          </div>

          {/* Input Section */}
          <div className="glass-card" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto 2rem' }}>

            {/* Analysis Mode Toggle */}
            <div className="mode-toggle-container" style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Analysis Engine</label>
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
                <div className="api-notice" style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.2)', borderRadius: 'var(--radius-md)', color: '#eab308', fontSize: '0.875rem' }}>
                  <AlertCircle size={16} />
                  <span>API Key required for AI mode.</span>
                  <Link href="/settings" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500, fontSize: '0.8125rem', background: 'rgba(0,0,0,0.2)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                    Configure <SettingsIcon size={12} />
                  </Link>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                {mode === 'repo' ? 'Repository URL or owner/repo' : 'Pull Request URL'}
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={mode === 'repo'
                  ? 'e.g., facebook/react or https://github.com/facebook/react'
                  : 'e.g., https://github.com/owner/repo/pull/123'
                }
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                GitHub Token (optional, for private repos)
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxx"
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9375rem'
                }}
              />
            </div>

            {error && (
              <div style={{
                padding: '1rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-critical)',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertTriangle size={18} />
                {error}
              </div>
            )}

            <button
              className="btn btn-primary"
              onClick={handleAnalyze}
              disabled={isLoading || !url}
              style={{ width: '100%', padding: '1rem' }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="loading-spinner" style={{ marginBottom: 0 }} />
                  Analyzing... (this may take a moment)
                </>
              ) : (
                <>
                  <Search size={20} />
                  Analyze {mode === 'repo' ? 'Repository' : 'Pull Request'}
                </>
              )}
            </button>
          </div>

          {/* Results */}
          {(repoInfo || prInfo) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '1.5rem' }}>
              {/* Info & File Results */}
              <div>
                {/* Repo/PR Info Card */}
                <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                  {repoInfo && (
                    <>
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <FolderGit2 size={20} />
                        {repoInfo.name}
                        <a
                          href={`https://github.com/${repoInfo.name}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--text-muted)', marginLeft: 'auto' }}
                        >
                          <ExternalLink size={16} />
                        </a>
                      </h3>
                      <div style={{ display: 'flex', gap: '2rem', color: 'var(--text-secondary)' }}>
                        <span><strong>{repoInfo.filesAnalyzed}</strong> files analyzed</span>
                        <span><strong>{repoInfo.totalFiles}</strong> total code files</span>
                      </div>
                    </>
                  )}

                  {prInfo && (
                    <>
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <GitPullRequest size={20} />
                        #{prInfo.number}: {prInfo.title}
                      </h3>
                      <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        by {prInfo.author} • {prInfo.baseBranch} ← {prInfo.headBranch}
                      </p>
                      <div style={{ display: 'flex', gap: '2rem', color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--color-low)' }}>+{prInfo.additions}</span>
                        <span style={{ color: 'var(--color-critical)' }}>-{prInfo.deletions}</span>
                        <span>{prInfo.changedFiles} files changed</span>
                      </div>
                    </>
                  )}
                </div>

                {/* File Results */}
                {fileResults.length > 0 && (
                  <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileCode size={18} />
                      Files with Issues
                    </h3>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {fileResults.filter(f => f.issues?.length > 0 || f.issueCount > 0).map((file, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '0.75rem',
                            background: 'var(--bg-tertiary)',
                            borderRadius: 'var(--radius-sm)',
                            marginBottom: '0.5rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>
                            {file.path || file.filename}
                          </span>
                          <span style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: 'var(--color-critical)',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}>
                            {file.issueCount || file.issues?.length} issues
                          </span>
                        </div>
                      ))}
                      {fileResults.filter(f => f.issues?.length > 0 || f.issueCount > 0).length === 0 && (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                          🎉 No issues found in analyzed files!
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Issues Panel */}
              <ReviewPanel issues={issues} isLoading={false} />
            </div>
          )}

          {/* Empty State */}
          {!repoInfo && !prInfo && !isLoading && (
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem'
              }}>
                <Github size={40} color="var(--text-muted)" />
              </div>
              <h3 style={{ marginBottom: '0.5rem' }}>Connect to GitHub</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Enter a repository URL to analyze the entire codebase, or a PR URL to review just the changes.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <div style={{
                  padding: '1rem',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  flex: '1',
                  minWidth: '200px'
                }}>
                  <FolderGit2 size={24} style={{ marginBottom: '0.5rem', color: 'var(--accent-primary)' }} />
                  <h4>Repository</h4>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Scan up to 50 files for vulnerabilities
                  </p>
                </div>
                <div style={{
                  padding: '1rem',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  flex: '1',
                  minWidth: '200px'
                }}>
                  <GitPullRequest size={24} style={{ marginBottom: '0.5rem', color: 'var(--accent-secondary)' }} />
                  <h4>Pull Request</h4>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Review only the changed code in a PR
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <style jsx>{`
        .mode-toggle {
          display: flex;
          gap: 0.5rem;
          padding: 0.25rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
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
        .api-key-input {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-top: 0.75rem;
          padding: 0.75rem 1rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
        }
        .api-key-input input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 0.875rem;
          outline: none;
        }
        .api-key-input svg {
          color: var(--text-muted);
        }
        .get-key-link {
          font-size: 0.75rem;
          color: var(--accent-primary);
          text-decoration: none;
          white-space: nowrap;
        }
      `}</style>
    </>
  );
}
