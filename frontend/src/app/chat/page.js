'use client';

import { useState, useRef, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { useSettings } from '@/context/SettingsContext';
import { API_URL } from '../../config';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  Send,
  Loader2,
  FileCode,
  AlertCircle,
  CheckCircle,
  FolderGit2,
  RotateCcw,
  MessageCircle
} from 'lucide-react';

export default function ChatPage() {
  const { openaiKey } = useSettings();
  const [repoPath, setRepoPath] = useState('');
  const [isIndexing, setIsIndexing] = useState(false);
  const [isIndexed, setIsIndexed] = useState(false);
  const [indexError, setIndexError] = useState('');

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleIndex = async () => {
    if (!repoPath.trim()) return;

    setIsIndexing(true);
    setIndexError('');
    setIsIndexed(false);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000);

    try {
      const response = await fetch(`${API_URL}/api/rag/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoPath: repoPath.trim(), openaiKey }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to index repository');
      }

      setIsIndexed(true);
      setMessages([{
        role: 'system',
        content: `Indexed **${data.filesProcessed}** files. Ask anything about the codebase.`
      }]);
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        setIndexError('Timeout. Try a smaller repository.');
      } else {
        setIndexError(err.message);
      }
    } finally {
      setIsIndexing(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setIsIndexed(false);
    setRepoPath('');
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/rag/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: input, openaiKey })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer,
        sources: data.context
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'error',
        content: err.message
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <Navigation />
      <main className="main-content">
        <div className="chat-page">
          {/* Header */}
          <header className="chat-header">
            <div>
              <h1>Chat with Repository</h1>
              <p>Semantic search powered by RAG</p>
            </div>
            {isIndexed && (
              <button className="btn-reset" onClick={clearChat}>
                <RotateCcw size={14} />
                New
              </button>
            )}
          </header>

          {/* Index Input */}
          {!isIndexed && (
            <div className="index-section">
              <div className="index-row">
                <input
                  type="text"
                  className="repo-input"
                  placeholder="https://github.com/owner/repo"
                  value={repoPath}
                  onChange={(e) => setRepoPath(e.target.value)}
                  disabled={isIndexing}
                />
                <button
                  className="btn-index"
                  onClick={handleIndex}
                  disabled={isIndexing || !repoPath.trim()}
                >
                  {isIndexing ? (
                    <>
                      <Loader2 size={16} className="spin" />
                      Indexing...
                    </>
                  ) : (
                    <>
                      <FolderGit2 size={16} />
                      Index
                    </>
                  )}
                </button>
              </div>
              {indexError && (
                <div className="error-alert">
                  <AlertCircle size={14} />
                  {indexError}
                </div>
              )}
            </div>
          )}

          {/* Indexed Badge */}
          {isIndexed && (
            <div className="indexed-badge">
              <CheckCircle size={14} />
              {repoPath.split('/').pop().replace('.git', '')}
            </div>
          )}

          {/* Chat Area */}
          <div className="chat-container">
            <div className="messages">
              {messages.length === 0 && !isIndexed && (
                <div className="empty-state">
                  <MessageCircle size={48} strokeWidth={1} />
                  <p>Paste a repository URL to get started</p>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div key={idx} className={`message-row ${msg.role}`}>
                  <div className={`bubble ${msg.role}`}>
                    {msg.role === 'user' ? (
                      <span>{msg.content}</span>
                    ) : (
                      <div className="markdown-body">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({node, inline, className, children, ...props}) {
                              const match = /language-(\w+)/.exec(className || '')
                              return !inline && match ? (
                                <SyntaxHighlighter
                                  style={vscDarkPlus}
                                  language={match[1]}
                                  PreTag="div"
                                  {...props}
                                >
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                              ) : (
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              )
                            }
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}

                    {msg.sources?.length > 0 && (
                      <div className="sources">
                        {msg.sources.map((src, i) => (
                          <span key={i} className="source-tag">
                            <FileCode size={10} />
                            {src.filename}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="message-row assistant">
                  <div className="bubble assistant loading">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="input-area">
              <textarea
                className="chat-input"
                placeholder={isIndexed ? "Ask about the codebase..." : "Index a repo first..."}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!isIndexed || isLoading}
                rows={1}
              />
              <button
                className="send-btn"
                onClick={handleSend}
                disabled={!isIndexed || isLoading || !input.trim()}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        .chat-page {
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          height: calc(100vh - 80px);
          padding-bottom: 1rem;
        }

        .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }

        .chat-header h1 {
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .chat-header p {
          color: var(--text-muted);
          font-size: 0.875rem;
        }

        .btn-reset {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          padding: 0.375rem 0.75rem;
          border-radius: var(--radius-md);
          font-size: 0.8125rem;
          cursor: pointer;
        }

        .btn-reset:hover {
          color: var(--text-primary);
          border-color: var(--accent-tertiary);
        }

        .index-section {
          margin-bottom: 1.5rem;
        }

        .index-row {
          display: flex;
          gap: 0.75rem;
        }

        .repo-input {
          flex: 1;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
          font-size: 0.9375rem;
        }

        .repo-input:focus {
          outline: none;
          border-color: var(--accent-tertiary);
        }

        .btn-index {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--text-primary);
          color: var(--bg-primary);
          border: none;
          padding: 0 1.25rem;
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
        }

        .btn-index:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .error-alert {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.75rem;
          padding: 0.625rem 0.875rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: var(--radius-md);
          color: #ef4444;
          font-size: 0.8125rem;
        }

        .indexed-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.375rem 0.75rem;
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.2);
          border-radius: 20px;
          color: #22c55e;
          font-size: 0.8125rem;
          margin-bottom: 1rem;
        }

        .chat-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }

        .messages {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .empty-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          gap: 0.75rem;
        }

        .empty-state p {
          font-size: 0.9375rem;
        }

        .message-row {
          display: flex;
        }

        .message-row.user {
          justify-content: flex-end;
        }

        .bubble {
          max-width: 80%;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          font-size: 0.9375rem;
          line-height: 1.5;
        }

        .bubble.user {
          background: var(--accent-primary);
          color: var(--bg-primary);
          border-bottom-right-radius: 4px;
        }

        .bubble.assistant,
        .bubble.system,
        .bubble.error {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-bottom-left-radius: 4px;
        }

        .bubble.error {
          border-color: rgba(239, 68, 68, 0.3);
          color: #ef4444;
        }

        .markdown-body :global(p) {
          margin: 0 0 0.75rem 0;
        }

        .markdown-body :global(p:last-child) {
          margin: 0;
        }

        .markdown-body :global(pre) {
          margin: 0.75rem 0;
          border-radius: 6px !important;
        }

        .markdown-body :global(code) {
          font-family: var(--font-mono);
          font-size: 0.85em;
        }

        .sources {
          margin-top: 0.75rem;
          padding-top: 0.5rem;
          border-top: 1px solid var(--border-color);
          display: flex;
          flex-wrap: wrap;
          gap: 0.375rem;
        }

        .source-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.125rem 0.5rem;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 4px;
          font-size: 0.6875rem;
          color: var(--text-muted);
        }

        .bubble.loading {
          display: flex;
          gap: 4px;
          padding: 1rem;
        }

        .dot {
          width: 6px;
          height: 6px;
          background: var(--text-muted);
          border-radius: 50%;
          animation: bounce 1.2s infinite ease-in-out;
        }

        .dot:nth-child(1) { animation-delay: -0.24s; }
        .dot:nth-child(2) { animation-delay: -0.12s; }

        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }

        .input-area {
          display: flex;
          gap: 0.75rem;
          padding: 1rem;
          border-top: 1px solid var(--border-color);
          background: var(--bg-secondary);
        }

        .chat-input {
          flex: 1;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
          resize: none;
          font-family: inherit;
          font-size: 0.9375rem;
        }

        .chat-input:focus {
          outline: none;
          border-color: var(--accent-tertiary);
        }

        .send-btn {
          background: var(--accent-primary);
          color: var(--bg-primary);
          border: none;
          width: 44px;
          height: 44px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: opacity var(--transition-fast);
        }

        .send-btn:hover:not(:disabled) {
          opacity: 0.85;
        }

        .send-btn:disabled {
          background: var(--text-muted);
          opacity: 0.4;
          cursor: not-allowed;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
