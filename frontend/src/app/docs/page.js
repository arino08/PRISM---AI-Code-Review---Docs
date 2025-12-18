'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Navigation from '@/components/Navigation';
import { useSettings } from '@/context/SettingsContext';
import { API_URL } from '../../config';
import { FileText, Play, Copy, Check, Sparkles, Cpu, Settings, AlertCircle } from 'lucide-react';
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

const SAMPLE_CODE = `// Paste your code here to generate documentation

function calc(u, p, d) {
  const s = p.reduce((t, i) => t + (i.p * i.q), 0);
  const dc = d.v && d.e > Date.now() ? s * d.p : 0;
  const tx = u.t === 'business' ? s * 0.1 : 0;
  return s - dc + tx;
}

async function fetchData(url, opts) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error('Failed');
  return res.json();
}

class UserService {
  constructor(db) {
    this.db = db;
  }

  async findById(id) {
    return this.db.users.find(u => u.id === id);
  }

  async create(data) {
    const user = { id: Date.now(), ...data };
    this.db.users.push(user);
    return user;
  }
}
`;

export default function DocsPage() {
  const [code, setCode] = useState(SAMPLE_CODE);
  const [language, setLanguage] = useState('javascript');
  const [docs, setDocs] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('jsdoc');
  const [mode, setMode] = useState('pattern');
  const { openaiKey } = useSettings();
  const [error, setError] = useState('');

  const generateDocs = useCallback(async () => {
    setError('');

    if (mode === 'llm' && !openaiKey) {
      setError('API key required for AI mode');
      return;
    }

    setIsGenerating(true);

    try {
      const body = { code, language, mode };
      if (mode === 'llm') body.openaiKey = openaiKey;

      const response = await fetch(`${API_URL}/api/generate-docs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Generation failed');
      setDocs(data);
    } catch (err) {
      if (mode === 'llm') {
        setError(err.message);
      } else {
        const clientDocs = generateClientDocs(code);
        setDocs(clientDocs);
      }
    } finally {
      setIsGenerating(false);
    }
  }, [code, language, mode, openaiKey]);

  const copyToClipboard = async () => {
    const content = activeTab === 'jsdoc' ? docs.jsdoc : docs.readme;
    const text = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getDisplayContent = () => {
    const content = activeTab === 'jsdoc' ? docs?.jsdoc : docs?.readme;
    if (!content) return '';
    return typeof content === 'string' ? content : JSON.stringify(content, null, 2);
  };

  return (
    <>
      <Navigation />
      <main className="main-content">
        <div className="docs-page">
          {/* Header */}
          <header className="page-header">
            <div>
              <h1>Generate Docs</h1>
              <p>Create JSDoc and README from your code</p>
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
              </select>
              <button
                className="btn-generate"
                onClick={generateDocs}
                disabled={isGenerating}
              >
                <Play size={16} />
                {isGenerating ? 'Generating...' : 'Generate'}
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

            {error && (
              <div className="error-msg">
                <AlertCircle size={14} />
                {error}
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
                }}
              />
            </div>

            {/* Output Panel */}
            <div className="output-pane">
              <div className="output-header">
                <div className="tabs">
                  <button
                    className={`tab ${activeTab === 'jsdoc' ? 'active' : ''}`}
                    onClick={() => setActiveTab('jsdoc')}
                  >
                    JSDoc
                  </button>
                  <button
                    className={`tab ${activeTab === 'readme' ? 'active' : ''}`}
                    onClick={() => setActiveTab('readme')}
                  >
                    README
                  </button>
                </div>
                {docs && (
                  <button className="copy-btn" onClick={copyToClipboard}>
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                )}
              </div>

              <div className="output-content">
                {isGenerating ? (
                  <div className="empty-state">
                    <div className="spinner"></div>
                    <span>Generating...</span>
                  </div>
                ) : !docs ? (
                  <div className="empty-state">
                    <FileText size={32} strokeWidth={1} />
                    <span>Click Generate to create documentation</span>
                  </div>
                ) : (
                  <pre className="docs-output">{getDisplayContent()}</pre>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        .docs-page {
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

        .btn-generate {
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

        .btn-generate:hover:not(:disabled) {
          opacity: 0.85;
        }

        .btn-generate:disabled {
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

        .error-msg {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.75rem;
          margin-left: 1rem;
          padding: 0.5rem 0.75rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: var(--radius-md);
          color: #ef4444;
          font-size: 0.8125rem;
        }

        .editor-layout {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          min-height: 0;
        }

        .editor-pane {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }

        .output-pane {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .output-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--border-color);
        }

        .tabs {
          display: flex;
          gap: 0.25rem;
        }

        .tab {
          padding: 0.375rem 0.75rem;
          background: transparent;
          border: none;
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          font-size: 0.8125rem;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .tab:hover {
          color: var(--text-secondary);
        }

        .tab.active {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .copy-btn {
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-muted);
          width: 32px;
          height: 32px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .copy-btn:hover {
          color: var(--text-primary);
          border-color: var(--accent-tertiary);
        }

        .output-content {
          flex: 1;
          overflow: auto;
          padding: 1rem;
        }

        .empty-state {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          color: var(--text-muted);
          font-size: 0.875rem;
        }

        .docs-output {
          font-family: var(--font-mono);
          font-size: 0.8125rem;
          line-height: 1.6;
          color: var(--text-secondary);
          white-space: pre-wrap;
          word-break: break-word;
          margin: 0;
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
            grid-template-rows: 1fr 1fr;
          }
        }
      `}</style>
    </>
  );
}

// Client-side documentation generation (unchanged logic)
function generateClientDocs(code) {
  const functions = extractFunctions(code);
  let jsdoc = '';
  functions.forEach(func => {
    jsdoc += generateJSDoc(func) + '\n\n';
  });
  const readme = generateReadme(functions);
  return { jsdoc, readme };
}

function extractFunctions(code) {
  const functions = [];
  const lines = code.split('\n');
  const funcPattern = /(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/;
  const arrowPattern = /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(([^)]*)\)\s*=>/;
  const methodPattern = /(?:async\s+)?(\w+)\s*\(([^)]*)\)\s*\{/;

  let inClass = false;
  let className = '';
  let braceCount = 0;

  lines.forEach((line, index) => {
    const classMatch = line.match(/class\s+(\w+)/);
    if (classMatch) {
      inClass = true;
      className = classMatch[1];
    }

    braceCount += (line.match(/\{/g) || []).length;
    braceCount -= (line.match(/\}/g) || []).length;

    if (braceCount === 0) {
      inClass = false;
      className = '';
    }

    let match = line.match(funcPattern) || line.match(arrowPattern);
    if (!match && inClass) {
      match = line.match(methodPattern);
    }

    if (match && !match[1].match(/^(if|for|while|switch|catch)$/)) {
      functions.push({
        name: match[1],
        params: match[2].split(',').map(p => p.trim()).filter(Boolean),
        line: index + 1,
        isAsync: line.includes('async'),
        isMethod: inClass,
        className: inClass ? className : null,
      });
    }
  });

  return functions;
}

function generateJSDoc(func) {
  const { name, params, isAsync } = func;
  const purpose = inferPurpose(name);
  let doc = '/**\n';
  doc += ` * ${purpose}\n *\n`;

  params.forEach(param => {
    const clean = param.replace(/[=:].*/g, '').trim();
    if (clean) {
      doc += ` * @param {${inferType(clean)}} ${clean} - ${inferParamDesc(clean)}\n`;
    }
  });

  if (isAsync) {
    doc += ` * @returns {Promise<${inferReturnType(name)}>}\n`;
  } else if (!name.startsWith('set') && name !== 'constructor') {
    doc += ` * @returns {${inferReturnType(name)}}\n`;
  }

  doc += ' */';
  return doc;
}

function inferPurpose(name) {
  const prefixes = {
    'get': 'Retrieves', 'set': 'Sets', 'fetch': 'Fetches', 'find': 'Finds',
    'create': 'Creates', 'update': 'Updates', 'delete': 'Deletes',
    'calc': 'Calculates', 'is': 'Checks if', 'has': 'Checks if has'
  };
  for (const [prefix, verb] of Object.entries(prefixes)) {
    if (name.toLowerCase().startsWith(prefix)) {
      const rest = name.slice(prefix.length).replace(/([A-Z])/g, ' $1').toLowerCase().trim();
      return `${verb} ${rest || 'value'}`;
    }
  }
  return `Performs ${name.replace(/([A-Z])/g, ' $1').toLowerCase().trim()}`;
}

function inferType(param) {
  const types = { id: 'string|number', url: 'string', data: 'Object', opts: 'Object', db: 'Object', u: 'Object', p: 'Array', d: 'Object' };
  return types[param.toLowerCase()] || 'any';
}

function inferParamDesc(param) {
  const descs = { id: 'Unique identifier', url: 'Target URL', data: 'Data payload', opts: 'Options', db: 'Database', u: 'User', p: 'Products', d: 'Discount' };
  return descs[param.toLowerCase()] || `The ${param} parameter`;
}

function inferReturnType(name) {
  if (name.startsWith('is') || name.startsWith('has')) return 'boolean';
  if (name.startsWith('find') || name.startsWith('get')) return 'Object|null';
  if (name.startsWith('calc')) return 'number';
  return 'any';
}

function generateReadme(functions) {
  let readme = '# API Reference\n\n';
  functions.forEach(func => {
    readme += `## ${func.className ? `${func.className}.` : ''}${func.name}()\n\n`;
    readme += `${inferPurpose(func.name)}.\n\n`;
    if (func.params.length) {
      readme += '**Parameters:**\n';
      func.params.forEach(p => {
        const clean = p.replace(/[=:].*/g, '').trim();
        if (clean) readme += `- \`${clean}\` - ${inferParamDesc(clean)}\n`;
      });
      readme += '\n';
    }
    readme += `**Returns:** \`${inferReturnType(func.name)}\`\n\n---\n\n`;
  });
  return readme;
}
