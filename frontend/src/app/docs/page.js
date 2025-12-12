'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Navigation from '@/components/Navigation';
import { useSettings } from '@/context/SettingsContext';
import { API_URL } from '../../config';
import { FileText, Play, Copy, Check, Code2, Sparkles, Cpu, Settings as SettingsIcon, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="loading">
      <div className="loading-spinner"></div>
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
  const [mode, setMode] = useState('pattern'); // 'pattern' or 'llm'
  const { openaiKey } = useSettings();
  const [error, setError] = useState('');

  const generateDocs = useCallback(async () => {
    setError('');

    if (mode === 'llm' && !openaiKey) {
      setError('OpenAI API key is required for AI mode. Please configure it in Settings.');
      return;
    }

    setIsGenerating(true);

    try {
      const body = { code, language, mode };
      if (mode === 'llm') {
        body.openaiKey = openaiKey;
      }

      const response = await fetch(`${API_URL}/api/generate-docs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Documentation generation failed');
      }

      setDocs(data);
    } catch (error) {
      console.error('Doc generation failed:', error);
      if (mode === 'llm') {
         setError(error.message);
      } else {
        // Fallback to client-side generation for pattern mode only
        const clientDocs = generateClientDocs(code);
        setDocs(clientDocs);
      }
    } finally {
      setIsGenerating(false);
    }
  }, [code, language, mode, openaiKey]);

  const copyToClipboard = async (text) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Navigation />
      <main className="main-content">
        <div className="editor-page">
          <div className="editor-section">
            <div className="section-header">
              <h2 className="section-title">
                <Code2 size={20} />
                Code Editor
              </h2>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
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
                  onClick={generateDocs}
                  disabled={isGenerating}
                >
                  <Play size={18} />
                  {isGenerating ? 'Generating...' : 'Generate Docs'}
                </button>
              </div>
            </div>

            {/* Mode Toggle */}
            <div className="mode-toggle-container">
              <div className="mode-toggle">
                <button
                  className={`mode-btn ${mode === 'pattern' ? 'active' : ''}`}
                  onClick={() => setMode('pattern')}
                >
                  <Cpu size={16} />
                  Pattern Matching
                  <span className="mode-badge free">Free</span>
                </button>
                <button
                  className={`mode-btn ${mode === 'llm' ? 'active' : ''}`}
                  onClick={() => setMode('llm')}
                >
                  <Sparkles size={16} />
                  AI (GPT-4)
                  <span className="mode-badge pro">Deep</span>
                </button>
              </div>

              {mode === 'llm' && !openaiKey && (
                <div className="api-notice" style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.2)', borderRadius: 'var(--radius-md)', color: '#eab308', fontSize: '0.875rem' }}>
                  <AlertCircle size={16} />
                  <span>API Key required for AI mode.</span>
                  <Link href="/settings" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500, fontSize: '0.8125rem', background: 'rgba(0,0,0,0.2)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                    Configure <SettingsIcon size={12} />
                  </Link>
                </div>
              )}

              {error && (
                <div className="error-message">
                  <AlertCircle size={16} />
                  {error}
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
                }}
              />
            </div>
          </div>

          <div className="glass-card review-panel">
            <div className="review-header">
              <h3 className="review-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} />
                Generated Documentation
              </h3>
              {docs && (
                <button
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem 0.75rem' }}
                  onClick={() => copyToClipboard(docs.jsdoc || docs.readme || '')}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              )}
            </div>

            <div className="review-content">
              {isGenerating ? (
                <div className="loading">
                  <div className="loading-spinner"></div>
                  <span>Generating documentation...</span>
                </div>
              ) : !docs ? (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <FileText size={28} />
                  </div>
                  <h4 className="empty-state-title">Ready to Generate</h4>
                  <p className="empty-state-description">
                    Click "Generate Docs" to create JSDoc comments, README sections, and API documentation.
                  </p>
                </div>
              ) : (
                <>
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

                  <div className="docs-content">
                    {activeTab === 'jsdoc' ? docs.jsdoc : docs.readme}
                  </div>
                </>
              )}
            </div>
          </div>
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
        .api-key-input svg {
          color: var(--text-muted);
          flex-shrink: 0;
        }
        .api-key-input input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 0.875rem;
          outline: none;
        }
        .api-key-input input::placeholder {
          color: var(--text-muted);
        }
        .get-key-link {
          font-size: 0.75rem;
          color: var(--accent-primary);
          text-decoration: none;
          white-space: nowrap;
        }
        .get-key-link:hover {
          text-decoration: underline;
        }
        .error-message {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.75rem;
          padding: 0.75rem 1rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: var(--radius-md);
          color: var(--color-critical);
          font-size: 0.875rem;
        }
      `}</style>
    </>
  );
}

// Client-side documentation generation
function generateClientDocs(code) {
  const functions = extractFunctions(code);

  // Generate JSDoc
  let jsdoc = '';
  functions.forEach(func => {
    jsdoc += generateJSDoc(func) + '\n\n';
  });

  // Generate README section
  const readme = generateReadme(functions);

  return { jsdoc, readme };
}

function extractFunctions(code) {
  const functions = [];
  const lines = code.split('\n');

  // Match function declarations
  const funcPattern = /(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/;
  const arrowPattern = /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(([^)]*)\)\s*=>/;
  const methodPattern = /(?:async\s+)?(\w+)\s*\(([^)]*)\)\s*\{/;

  let inClass = false;
  let className = '';
  let braceCount = 0;

  lines.forEach((line, index) => {
    // Track class context
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

    // Match functions
    let match = line.match(funcPattern) || line.match(arrowPattern);
    if (!match && inClass) {
      match = line.match(methodPattern);
    }

    if (match && !match[1].match(/^(if|for|while|switch|catch)$/)) {
      const name = match[1];
      const params = match[2].split(',').map(p => p.trim()).filter(Boolean);

      functions.push({
        name,
        params,
        line: index + 1,
        isAsync: line.includes('async'),
        isMethod: inClass,
        className: inClass ? className : null,
        raw: line.trim()
      });
    }
  });

  return functions;
}

function generateJSDoc(func) {
  const { name, params, isAsync, isMethod, className } = func;

  // Infer function purpose from name
  const purpose = inferPurpose(name);

  let doc = '/**\n';
  doc += ` * ${purpose}\n`;
  doc += ` *\n`;

  // Document parameters
  params.forEach(param => {
    const cleanParam = param.replace(/[=:].*/g, '').trim();
    if (cleanParam) {
      const paramType = inferType(cleanParam, name);
      const paramDesc = inferParamDescription(cleanParam, name);
      doc += ` * @param {${paramType}} ${cleanParam} - ${paramDesc}\n`;
    }
  });

  // Document return value
  if (isAsync) {
    doc += ` * @returns {Promise<${inferReturnType(name)}>} ${inferReturnDescription(name)}\n`;
  } else if (!name.startsWith('set') && name !== 'constructor') {
    doc += ` * @returns {${inferReturnType(name)}} ${inferReturnDescription(name)}\n`;
  }

  // Add example
  doc += ` *\n`;
  doc += ` * @example\n`;
  doc += ` * ${generateExample(func)}\n`;

  doc += ` */`;

  return doc;
}

function inferPurpose(name) {
  const prefixes = {
    'get': 'Retrieves',
    'set': 'Sets',
    'fetch': 'Fetches',
    'find': 'Finds',
    'create': 'Creates',
    'update': 'Updates',
    'delete': 'Deletes',
    'remove': 'Removes',
    'calc': 'Calculates',
    'compute': 'Computes',
    'is': 'Checks if',
    'has': 'Checks if has',
    'can': 'Checks if can',
    'validate': 'Validates',
    'parse': 'Parses',
    'format': 'Formats',
    'convert': 'Converts',
    'handle': 'Handles',
    'process': 'Processes',
  };

  for (const [prefix, verb] of Object.entries(prefixes)) {
    if (name.toLowerCase().startsWith(prefix)) {
      const rest = name.slice(prefix.length);
      const readable = rest.replace(/([A-Z])/g, ' $1').toLowerCase().trim();
      return `${verb} ${readable || 'the value'}`;
    }
  }

  // Default: convert camelCase to readable
  const readable = name.replace(/([A-Z])/g, ' $1').toLowerCase().trim();
  return `Performs ${readable} operation`;
}

function inferType(param, funcName) {
  const patterns = {
    'id': 'string|number',
    'ids': 'Array<string|number>',
    'name': 'string',
    'email': 'string',
    'url': 'string',
    'path': 'string',
    'data': 'Object',
    'opts': 'Object',
    'options': 'Object',
    'config': 'Object',
    'callback': 'Function',
    'fn': 'Function',
    'handler': 'Function',
    'count': 'number',
    'index': 'number',
    'num': 'number',
    'flag': 'boolean',
    'enabled': 'boolean',
    'items': 'Array',
    'list': 'Array',
    'arr': 'Array',
    'db': 'Object',
    'u': 'Object',
    'p': 'Array',
    'd': 'Object',
  };

  const paramLower = param.toLowerCase();
  return patterns[paramLower] || patterns[param] || 'any';
}

function inferParamDescription(param, funcName) {
  const descriptions = {
    'id': 'Unique identifier',
    'url': 'Target URL endpoint',
    'data': 'Data payload',
    'opts': 'Optional configuration',
    'options': 'Configuration options',
    'callback': 'Callback function',
    'db': 'Database connection instance',
    'u': 'User object',
    'p': 'Products array',
    'd': 'Discount configuration',
  };

  return descriptions[param] || descriptions[param.toLowerCase()] || `The ${param} parameter`;
}

function inferReturnType(name) {
  if (name.startsWith('is') || name.startsWith('has') || name.startsWith('can')) {
    return 'boolean';
  }
  if (name.startsWith('get') || name.startsWith('find')) {
    return 'Object|null';
  }
  if (name.startsWith('create')) {
    return 'Object';
  }
  if (name.startsWith('calc') || name.startsWith('compute')) {
    return 'number';
  }
  if (name.startsWith('fetch')) {
    return 'Object';
  }
  return 'any';
}

function inferReturnDescription(name) {
  if (name.startsWith('is') || name.startsWith('has')) {
    return 'True if condition is met, false otherwise';
  }
  if (name.startsWith('find')) {
    return 'Found item or null if not found';
  }
  if (name.startsWith('create')) {
    return 'Newly created object';
  }
  if (name.startsWith('calc')) {
    return 'Calculated result';
  }
  return 'Operation result';
}

function generateExample(func) {
  const { name, params, isAsync, isMethod, className } = func;

  const args = params.map(p => {
    const clean = p.replace(/[=:].*/g, '').trim();
    if (clean === 'id') return '"123"';
    if (clean === 'url') return '"https://api.example.com/data"';
    if (clean === 'data' || clean === 'opts') return '{ key: "value" }';
    if (clean === 'u') return '{ t: "business" }';
    if (clean === 'p') return '[{ p: 100, q: 2 }]';
    if (clean === 'd') return '{ v: true, e: Date.now() + 86400000, p: 0.1 }';
    return clean;
  }).join(', ');

  if (isMethod && className) {
    if (isAsync) {
      return `const result = await ${className.toLowerCase()}.${name}(${args});`;
    }
    return `const result = ${className.toLowerCase()}.${name}(${args});`;
  }

  if (isAsync) {
    return `const result = await ${name}(${args});`;
  }
  return `const result = ${name}(${args});`;
}

function generateReadme(functions) {
  let readme = '# API Reference\n\n';
  readme += 'Auto-generated documentation for this module.\n\n';
  readme += '## Functions\n\n';

  functions.forEach(func => {
    const { name, params, isAsync, isMethod, className } = func;
    const purpose = inferPurpose(name);

    readme += `### ${isMethod && className ? `${className}.` : ''}${name}()\n\n`;
    readme += `${purpose}.\n\n`;

    if (params.length > 0) {
      readme += '**Parameters:**\n';
      params.forEach(p => {
        const clean = p.replace(/[=:].*/g, '').trim();
        if (clean) {
          readme += `- \`${clean}\` - ${inferParamDescription(clean, name)}\n`;
        }
      });
      readme += '\n';
    }

    readme += `**Returns:** ${inferReturnType(name)}\n\n`;
    readme += '---\n\n';
  });

  return readme;
}
