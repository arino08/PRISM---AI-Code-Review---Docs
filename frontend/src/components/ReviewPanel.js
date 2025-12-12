'use client';

import { useState } from 'react';
import { Shield, ChevronDown, Sparkles, AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';

export default function ReviewPanel({ issues = [], isLoading = false }) {
  const [expandedIssues, setExpandedIssues] = useState(new Set());

  const toggleIssue = (id) => {
    const newExpanded = new Set(expandedIssues);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIssues(newExpanded);
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <AlertTriangle size={16} />;
      case 'high': return <AlertCircle size={16} />;
      case 'moderate': return <Info size={16} />;
      default: return <CheckCircle size={16} />;
    }
  };

  const countBySeverity = (severity) =>
    issues.filter(i => i.severity === severity).length;

  const criticalCount = countBySeverity('critical');
  const highCount = countBySeverity('high');
  const moderateCount = countBySeverity('moderate');
  const lowCount = countBySeverity('low');

  return (
    <div className="glass-card review-panel">
      <div className="review-header">
        <h3 className="review-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={18} />
          Review Results
        </h3>
        {issues.length > 0 && (
          <span style={{
            fontSize: '0.8125rem',
            color: 'var(--text-muted)',
            background: 'var(--bg-tertiary)',
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px'
          }}>
            {issues.length} issue{issues.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="review-content">
        {isLoading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
            <span>Analyzing code...</span>
          </div>
        ) : issues.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Sparkles size={28} />
            </div>
            <h4 className="empty-state-title">Ready to Analyze</h4>
            <p className="empty-state-description">
              Click "Analyze Code" to scan for security vulnerabilities, code quality issues, and best practices.
            </p>
          </div>
        ) : (
          <>
            <div className="review-summary">
              {criticalCount > 0 && (
                <span className="summary-badge critical">
                  <AlertTriangle size={14} />
                  {criticalCount} Critical
                </span>
              )}
              {highCount > 0 && (
                <span className="summary-badge high">
                  <AlertCircle size={14} />
                  {highCount} High
                </span>
              )}
              {moderateCount > 0 && (
                <span className="summary-badge moderate">
                  <Info size={14} />
                  {moderateCount} Moderate
                </span>
              )}
              {lowCount > 0 && (
                <span className="summary-badge low">
                  <CheckCircle size={14} />
                  {lowCount} Low
                </span>
              )}
            </div>

            <div className="issues-list">
              {issues.map((issue) => (
                <div key={issue.id} className="issue-card">
                  <div
                    className="issue-header"
                    onClick={() => toggleIssue(issue.id)}
                  >
                    <div className={`issue-severity ${issue.severity}`}></div>
                    <div className="issue-info">
                      <div className="issue-title">{issue.title}</div>
                      <div className="issue-location">Line {issue.line}</div>
                    </div>
                    <ChevronDown
                      size={18}
                      className={`issue-toggle ${expandedIssues.has(issue.id) ? 'expanded' : ''}`}
                    />
                  </div>

                  {expandedIssues.has(issue.id) && (
                    <div className="issue-details">
                      <p className="issue-description">{issue.description}</p>

                      <div className="issue-code">
                        <span className="line-comment">// ❌ Vulnerable code:</span>
                        <span className="line-bad">{issue.code}</span>
                        {issue.fix && (
                          <>
                            <br />
                            <span className="line-comment">// ✅ Recommended fix:</span>
                            <span className="line-good">{issue.fix}</span>
                          </>
                        )}
                      </div>

                      {issue.references && issue.references.length > 0 && (
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                          <strong>References:</strong>
                          <ul style={{ margin: '0.25rem 0 0 1rem', padding: 0 }}>
                            {issue.references.map((ref, idx) => (
                              <li key={idx}>
                                <a
                                  href={ref}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: 'var(--accent-primary)' }}
                                >
                                  {ref.replace('https://', '').split('/')[0]}
                                </a>
                              </li>
                            ))}
                          </ul>
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
    </div>
  );
}
