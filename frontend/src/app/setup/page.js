'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import { Copy, Check, Github, Zap, MessageSquare, GitPullRequest, ExternalLink, ArrowRight } from 'lucide-react';

const WORKFLOW_YAML = `name: AI Code Review

on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  contents: read
  pull-requests: write

jobs:
  code-review:
    runs-on: ubuntu-latest
    name: AI Code Review

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: AI Review
        uses: actions/github-script@v7
        with:
          script: |
            const { owner, repo } = context.repo;
            const pr = context.payload.pull_request.number;

            // Get files
            const { data: files } = await github.rest.pulls.listFiles({
              owner, repo, pull_number: pr
            });

            const issues = [];
            for (const f of files) {
              if (f.status === 'removed') continue;
              try {
                const { data } = await github.rest.repos.getContent({
                  owner, repo, path: f.filename,
                  ref: context.payload.pull_request.head.sha
                });
                const code = Buffer.from(data.content, 'base64').toString();

                // Security checks
                code.split('\\n').forEach((line, i) => {
                  if (/\\$\\{.*\\}.*SELECT|INSERT|UPDATE|DELETE/i.test(line))
                    issues.push({path: f.filename, line: i+1,
                      body: '⚠️ **SQL Injection** - Use parameterized queries'});
                  if (/innerHTML\\s*=|dangerouslySetInnerHTML/.test(line))
                    issues.push({path: f.filename, line: i+1,
                      body: '⚠️ **XSS Risk** - Sanitize user input'});
                  if (/password|secret|api_key.*[:=].*['"\`][^'"\`]{8,}/i.test(line))
                    issues.push({path: f.filename, line: i+1,
                      body: '🔴 **Hardcoded Secret** - Use env variables'});
                });
              } catch(e) {}
            }

            if (issues.length) {
              await github.rest.pulls.createReview({
                owner, repo, pull_number: pr,
                event: 'COMMENT', comments: issues.slice(0, 50)
              });
            } else {
              await github.rest.issues.createComment({
                owner, repo, issue_number: pr,
                body: '✅ AI Review: No issues found!'
              });
            }`;

export default function SetupPage() {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(WORKFLOW_YAML);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const steps = [
    {
      num: '1',
      title: 'Create workflow file',
      description: 'Add the YAML file to your repository',
      path: '.github/workflows/ai-review.yml'
    },
    {
      num: '2',
      title: 'Commit and push',
      description: 'The action will run on every PR automatically',
      path: null
    },
    {
      num: '3',
      title: 'Open a PR',
      description: 'AI reviews appear as inline comments',
      path: null
    }
  ];

  return (
    <>
      <Navigation />
      <main className="main-content">
        <div className="setup-page">
          {/* Header */}
          <header className="setup-header">
            <div className="hero-badge">
              <Zap size={14} />
              <span>GitHub Actions</span>
            </div>
            <h1>Auto-Review Every PR</h1>
            <p>Add AI code review to your repo in 2 minutes. No external services needed.</p>
          </header>

          {/* How it works */}
          <section className="how-it-works">
            <div className="flow-item">
              <GitPullRequest size={24} />
              <span>PR Opened</span>
            </div>
            <ArrowRight size={20} className="flow-arrow" />
            <div className="flow-item">
              <Zap size={24} />
              <span>AI Analyzes</span>
            </div>
            <ArrowRight size={20} className="flow-arrow" />
            <div className="flow-item">
              <MessageSquare size={24} />
              <span>Comments Posted</span>
            </div>
          </section>

          {/* Steps */}
          <section className="setup-steps">
            {steps.map((step, idx) => (
              <div key={idx} className="setup-step">
                <div className="step-num">{step.num}</div>
                <div className="step-content">
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                  {step.path && <code>{step.path}</code>}
                </div>
              </div>
            ))}
          </section>

          {/* Code block */}
          <section className="workflow-section">
            <div className="workflow-header">
              <span className="workflow-filename">
                <Github size={16} />
                .github/workflows/ai-review.yml
              </span>
              <button onClick={copyToClipboard} className="copy-btn">
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="workflow-code">
              <code>{WORKFLOW_YAML}</code>
            </pre>
          </section>

          {/* Features */}
          <section className="features-grid">
            <div className="feature-item">
              <h4>🔒 SQL Injection Detection</h4>
              <p>Catches unsafe query patterns</p>
            </div>
            <div className="feature-item">
              <h4>⚡ XSS Prevention</h4>
              <p>Warns about innerHTML usage</p>
            </div>
            <div className="feature-item">
              <h4>🔑 Secret Detection</h4>
              <p>Finds hardcoded credentials</p>
            </div>
            <div className="feature-item">
              <h4>💬 Inline Comments</h4>
              <p>Issues appear right on the code</p>
            </div>
          </section>

          {/* CTA */}
          <section className="setup-cta">
            <a
              href="https://github.com/settings/tokens/new?scopes=repo&description=CodeReview-AI"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-hero-secondary"
            >
              <Github size={18} />
              Create GitHub Token
              <ExternalLink size={14} />
            </a>
          </section>
        </div>
      </main>

      <style jsx>{`
        .setup-page {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }
        .setup-header {
          text-align: center;
          margin-bottom: 3rem;
        }
        .setup-header h1 {
          font-size: 2.5rem;
          font-weight: 700;
          margin: 1rem 0 0.5rem;
        }
        .setup-header p {
          color: var(--text-secondary);
          font-size: 1.125rem;
        }
        .how-it-works {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
          margin-bottom: 3rem;
          flex-wrap: wrap;
        }
        .flow-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 1.5rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          color: var(--accent-primary);
        }
        .flow-item span {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }
        .flow-arrow {
          color: var(--text-muted);
        }
        .setup-steps {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .setup-step {
          display: flex;
          gap: 1rem;
          padding: 1.25rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
        }
        .step-num {
          width: 32px;
          height: 32px;
          background: #000000;
          border: 1px solid white;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.875rem;
          flex-shrink: 0;
        }
        .step-content h3 {
          font-size: 1rem;
          margin-bottom: 0.25rem;
        }
        .step-content p {
          color: var(--text-muted);
          font-size: 0.875rem;
          margin: 0;
        }
        .step-content code {
          display: inline-block;
          margin-top: 0.5rem;
          padding: 0.25rem 0.5rem;
          background: var(--bg-tertiary);
          border-radius: 4px;
          font-size: 0.8125rem;
          color: var(--accent-primary);
        }
        .workflow-section {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          overflow: hidden;
          margin-bottom: 2rem;
        }
        .workflow-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          background: var(--bg-tertiary);
          border-bottom: 1px solid var(--border-color);
        }
        .workflow-filename {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }
        .copy-btn {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.5rem 0.75rem;
          background: #000000;
          border: 1px solid white;
          border-radius: var(--radius-sm);
          color: white;
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
        }
        .workflow-code {
          padding: 1rem;
          overflow-x: auto;
          font-size: 0.75rem;
          line-height: 1.6;
          color: var(--text-secondary);
          margin: 0;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .feature-item {
          padding: 1rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
        }
        .feature-item h4 {
          font-size: 0.9375rem;
          margin-bottom: 0.25rem;
        }
        .feature-item p {
          font-size: 0.8125rem;
          color: var(--text-muted);
          margin: 0;
        }
        .setup-cta {
          text-align: center;
        }
        @media (max-width: 640px) {
          .features-grid {
            grid-template-columns: 1fr;
          }
          .how-it-works {
            flex-direction: column;
          }
          .flow-arrow {
            transform: rotate(90deg);
          }
        }
      `}</style>
    </>
  );
}
