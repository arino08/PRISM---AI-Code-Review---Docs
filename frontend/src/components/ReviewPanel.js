'use client';

import { useState } from 'react';
import { Shield, ChevronDown, AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';

export default function ReviewPanel({ issues = [], isLoading = false }) {
  const [expanded, setExpanded] = useState(new Set());

  const toggle = (id) => {
    const next = new Set(expanded);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpanded(next);
  };

  const count = (sev) => issues.filter(i => i.severity === sev).length;

  return (
    <div className="review-panel">
      <div className="panel-header">
        <div className="header-left">
          <Shield size={16} />
          <span>Results</span>
        </div>
        {issues.length > 0 && (
          <span className="issue-count">{issues.length}</span>
        )}
      </div>

      <div className="panel-content">
        {isLoading ? (
          <div className="empty-state">
            <div className="spinner"></div>
            <span>Analyzing...</span>
          </div>
        ) : issues.length === 0 ? (
          <div className="empty-state">
            <Shield size={32} strokeWidth={1} />
            <span>Click Analyze to scan code</span>
          </div>
        ) : (
          <>
            {/* Summary badges */}
            <div className="summary">
              {count('critical') > 0 && (
                <span className="badge critical">
                  <AlertTriangle size={12} /> {count('critical')}
                </span>
              )}
              {count('high') > 0 && (
                <span className="badge high">
                  <AlertCircle size={12} /> {count('high')}
                </span>
              )}
              {count('moderate') > 0 && (
                <span className="badge moderate">
                  <Info size={12} /> {count('moderate')}
                </span>
              )}
              {count('low') > 0 && (
                <span className="badge low">
                  <CheckCircle size={12} /> {count('low')}
                </span>
              )}
            </div>

            {/* Issues list */}
            <div className="issues-list">
              {issues.map((issue) => (
                <div key={issue.id} className="issue-item">
                  <div className="issue-header" onClick={() => toggle(issue.id)}>
                    <div className={`severity-dot ${issue.severity}`}></div>
                    <div className="issue-info">
                      <span className="issue-title">{issue.title}</span>
                      <span className="issue-line">Line {issue.line}</span>
                    </div>
                    <ChevronDown
                      size={16}
                      className={`chevron ${expanded.has(issue.id) ? 'open' : ''}`}
                    />
                  </div>

                  {expanded.has(issue.id) && (
                    <div className="issue-body">
                      <p className="description">{issue.description}</p>
                      {issue.code && (
                        <div className="code-block">
                          <div className="code-bad">{issue.code}</div>
                          {issue.fix && <div className="code-fix">{issue.fix}</div>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .review-panel {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--border-color);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-primary);
          font-size: 0.875rem;
          font-weight: 500;
        }

        .issue-count {
          background: var(--bg-tertiary);
          color: var(--text-muted);
          padding: 0.125rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.75rem;
        }

        .panel-content {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
        }

        .empty-state {
          height: 100%;
          min-height: 200px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          color: var(--text-muted);
          font-size: 0.875rem;
        }

        .summary {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .badge.critical {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }

        .badge.high {
          background: rgba(249, 115, 22, 0.15);
          color: #f97316;
        }

        .badge.moderate {
          background: rgba(234, 179, 8, 0.15);
          color: #eab308;
        }

        .badge.low {
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
        }

        .issues-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .issue-item {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .issue-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          cursor: pointer;
          transition: background var(--transition-fast);
        }

        .issue-header:hover {
          background: var(--bg-secondary);
        }

        .severity-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .severity-dot.critical { background: #ef4444; }
        .severity-dot.high { background: #f97316; }
        .severity-dot.moderate { background: #eab308; }
        .severity-dot.low { background: #22c55e; }

        .issue-info {
          flex: 1;
          min-width: 0;
        }

        .issue-title {
          display: block;
          font-size: 0.8125rem;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .issue-line {
          font-size: 0.6875rem;
          color: var(--text-muted);
        }

        .chevron {
          color: var(--text-muted);
          transition: transform var(--transition-fast);
        }

        .chevron.open {
          transform: rotate(180deg);
        }

        .issue-body {
          padding: 0 0.75rem 0.75rem;
          border-top: 1px solid var(--border-color);
        }

        .description {
          font-size: 0.8125rem;
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0.75rem 0;
        }

        .code-block {
          background: var(--bg-primary);
          border-radius: var(--radius-sm);
          padding: 0.75rem;
          font-family: var(--font-mono);
          font-size: 0.75rem;
          overflow-x: auto;
        }

        .code-bad {
          color: #ef4444;
          margin-bottom: 0.5rem;
        }

        .code-fix {
          color: #22c55e;
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
      `}</style>
    </div>
  );
}
