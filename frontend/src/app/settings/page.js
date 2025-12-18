'use client';

import { useSession, signIn, signOut } from "next-auth/react";
import { useSettings } from "@/context/SettingsContext";
import Navigation from '@/components/Navigation';
import { User, LogOut, Key, Palette, Github, Check } from 'lucide-react';

export default function SettingsPage() {
  const { data: session } = useSession();
  const { theme, updateTheme, openaiKey, updateApiKey } = useSettings();

  const themes = [
    { id: 'monochromatic', name: 'Prism', colors: ['#ffffff', '#525252'] },
    { id: 'neon', name: 'Neon', colors: ['#22d3ee', '#f472b6'] },
    { id: 'oceanic', name: 'Oceanic', colors: ['#38bdf8', '#3b82f6'] },
    { id: 'sunset', name: 'Sunset', colors: ['#fb923c', '#ef4444'] },
  ];

  return (
    <>
      <Navigation />
      <main className="main-content">
        <div className="settings-page">
          <header className="settings-header">
            <h1>Settings</h1>
            <p>Manage your profile, API keys, and appearance.</p>
          </header>

          <div className="settings-grid">
            {/* Profile Section */}
            <section className="settings-card">
              <div className="card-header">
                <User size={20} />
                <h2>Profile</h2>
              </div>

              {session ? (
                <div className="profile-content">
                  <div className="profile-info">
                    {session.user.image && (
                      <img
                        src={session.user.image}
                        alt={session.user.name}
                        className="profile-avatar"
                      />
                    )}
                    <div>
                      <h3>{session.user.name}</h3>
                      <p>{session.user.email}</p>
                    </div>
                  </div>
                  <button onClick={() => signOut()} className="btn-ghost">
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>
              ) : (
                <div className="profile-signin">
                  <p>Connect your GitHub account to save history.</p>
                  <button onClick={() => signIn('github')} className="btn-primary">
                    <Github size={16} />
                    Sign in with GitHub
                  </button>
                </div>
              )}
            </section>

            {/* API Key Section */}
            <section className="settings-card">
              <div className="card-header">
                <Key size={20} />
                <h2>API Key</h2>
              </div>

              <p className="card-description">
                Your OpenAI key for AI-powered analysis. Stored locally.
              </p>

              <div className="api-input-wrapper">
                <input
                  type="password"
                  placeholder="sk-..."
                  value={openaiKey}
                  onChange={(e) => updateApiKey(e.target.value)}
                  className="api-input"
                />
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="get-key-btn"
                >
                  Get key →
                </a>
              </div>
            </section>

            {/* Theme Section */}
            <section className="settings-card theme-section">
              <div className="card-header">
                <Palette size={20} />
                <h2>Theme</h2>
              </div>

              <div className="theme-grid">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    className={`theme-option ${theme === t.id ? 'active' : ''}`}
                    onClick={() => updateTheme(t.id)}
                  >
                    <div className="theme-colors">
                      {t.colors.map((color, i) => (
                        <div
                          key={i}
                          className="color-swatch"
                          style={{ background: color }}
                        />
                      ))}
                    </div>
                    <span className="theme-name">{t.name}</span>
                    {theme === t.id && <Check size={14} className="theme-check" />}
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      <style jsx>{`
        .settings-page {
          max-width: 720px;
          margin: 0 auto;
          padding: 3rem 0;
        }

        .settings-header {
          margin-bottom: 2.5rem;
        }

        .settings-header h1 {
          font-family: var(--font-display);
          font-size: 2rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .settings-header p {
          color: var(--text-muted);
          font-size: 0.9375rem;
        }

        .settings-grid {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .settings-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          margin-bottom: 1rem;
          color: var(--text-primary);
        }

        .card-header h2 {
          font-size: 1rem;
          font-weight: 500;
        }

        .card-description {
          color: var(--text-muted);
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }

        .profile-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .profile-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .profile-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 2px solid var(--border-color);
        }

        .profile-info h3 {
          font-size: 1rem;
          font-weight: 500;
          margin-bottom: 0.125rem;
        }

        .profile-info p {
          font-size: 0.875rem;
          color: var(--text-muted);
        }

        .profile-signin {
          text-align: center;
          padding: 1rem 0;
        }

        .profile-signin p {
          color: var(--text-muted);
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }

        .btn-ghost {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          padding: 0.5rem 1rem;
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-ghost:hover {
          color: var(--text-primary);
          border-color: var(--accent-tertiary);
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--text-primary);
          color: var(--bg-primary);
          border: none;
          padding: 0.625rem 1.25rem;
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: opacity var(--transition-fast);
        }

        .btn-primary:hover {
          opacity: 0.85;
        }

        .api-input-wrapper {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }

        .api-input {
          flex: 1;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 0.625rem 1rem;
          border-radius: var(--radius-md);
          font-size: 0.875rem;
        }

        .api-input:focus {
          outline: none;
          border-color: var(--accent-tertiary);
        }

        .get-key-btn {
          color: var(--text-muted);
          font-size: 0.8125rem;
          text-decoration: none;
          white-space: nowrap;
        }

        .get-key-btn:hover {
          color: var(--text-primary);
        }

        .theme-section {
          grid-column: 1 / -1;
        }

        .theme-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.75rem;
        }

        .theme-option {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 0.875rem;
          cursor: pointer;
          transition: all var(--transition-fast);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.625rem;
          position: relative;
        }

        .theme-option:hover {
          border-color: var(--accent-tertiary);
        }

        .theme-option.active {
          border-color: var(--accent-primary);
        }

        .theme-colors {
          display: flex;
          gap: 0.375rem;
        }

        .color-swatch {
          width: 20px;
          height: 20px;
          border-radius: 50%;
        }

        .theme-name {
          font-size: 0.8125rem;
          color: var(--text-secondary);
        }

        .theme-option.active .theme-name {
          color: var(--text-primary);
        }

        .theme-check {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          color: var(--accent-primary);
        }

        @media (max-width: 640px) {
          .theme-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .profile-content {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </>
  );
}
