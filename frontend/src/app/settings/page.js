'use client';

import { useSession, signIn, signOut } from "next-auth/react";
import { useSettings } from "@/context/SettingsContext";
import Navigation from '@/components/Navigation';
import { Settings, User, LogOut, Key, Palette, Shield, Sparkles } from 'lucide-react';

export default function SettingsPage() {
  const { data: session } = useSession();
  const { theme, updateTheme, openaiKey, updateApiKey } = useSettings();

  return (
    <>
      <Navigation />
      <main className="main-content">
        <div className="dashboard">
          <header className="dashboard-header" style={{ paddingBottom: '1rem' }}>
            <h1 className="dashboard-title" style={{ fontSize: '2.5rem' }}>
              <Settings style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} size={40} />
              Settings
            </h1>
            <p className="dashboard-subtitle">
              Manage your profile, preferences, and API configuration.
            </p>
          </header>

          <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* User Profile */}
            <section className="glass-card" style={{ padding: '2rem' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
                <User size={24} />
                User Profile
              </h2>

              {session ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                     {session.user.image && (
                       <img
                         src={session.user.image}
                         alt={session.user.name}
                         style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid var(--border-color)' }}
                       />
                     )}
                     <div>
                       <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{session.user.name}</h3>
                       <p style={{ color: 'var(--text-secondary)' }}>{session.user.email}</p>
                     </div>
                   </div>
                   <button
                     onClick={() => signOut()}
                     className="btn btn-secondary"
                     style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                   >
                     <LogOut size={18} />
                     Sign Out
                   </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                  <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                    Sign in with GitHub to save your history and access extended features.
                  </p>
                  <button
                    onClick={() => signIn('github')}
                    className="btn btn-primary"
                    style={{ padding: '0.875rem 2rem' }}
                  >
                    <Shield size={18} style={{ marginRight: '0.5rem' }} />
                    Sign in with GitHub
                  </button>
                </div>
              )}
            </section>

            {/* API Key Configuration */}
            <section className="glass-card" style={{ padding: '2rem' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', fontSize: '1.25rem' }}>
                 <Key size={24} />
                 Global API Key
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Set your OpenAI API key here to automatically use it across Code Review, GitHub Analysis, and Documentation Generation.
              </p>

              <div className="api-key-input" style={{ background: 'var(--bg-tertiary)' }}>
                  <Sparkles size={16} />
                  <input
                    type="password"
                    placeholder="sk-..."
                    value={openaiKey}
                    onChange={(e) => updateApiKey(e.target.value)}
                    style={{ background: 'transparent', border: 'none', flex: 1, color: 'var(--text-primary)' }}
                  />
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="get-key-link"
                  >
                    Get key
                  </a>
              </div>
              <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Your key is stored locally in your browser and never sent to our servers.
              </p>
            </section>

            {/* Appearance */}
            <section className="glass-card" style={{ padding: '2rem' }}>
               <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
                 <Palette size={24} />
                 Appearance
               </h2>

               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                 {/* Monochromatic */}
                 <button
                   className={`theme-card ${theme === 'monochromatic' ? 'active' : ''}`}
                   onClick={() => updateTheme('monochromatic')}
                 >
                   <div className="theme-preview" style={{ background: '#050505', borderColor: '#333' }}>
                      <div className="theme-accent" style={{ background: '#ffffff' }}></div>
                      <div className="theme-accent-2" style={{ background: '#333333' }}></div>
                   </div>
                   <h3>Prism</h3>
                   <p>Monochromatic</p>
                 </button>

                 {/* Neon */}
                 <button
                   className={`theme-card ${theme === 'neon' ? 'active' : ''}`}
                   onClick={() => updateTheme('neon')}
                 >
                   <div className="theme-preview" style={{ background: '#090014', borderColor: '#22d3ee' }}>
                      <div className="theme-accent" style={{ background: '#22d3ee' }}></div>
                      <div className="theme-accent-2" style={{ background: '#f472b6' }}></div>
                   </div>
                   <h3>Neon</h3>
                   <p>Cyberpunk Glow</p>
                 </button>

                 {/* Oceanic */}
                 <button
                   className={`theme-card ${theme === 'oceanic' ? 'active' : ''}`}
                   onClick={() => updateTheme('oceanic')}
                 >
                   <div className="theme-preview" style={{ background: '#020617', borderColor: '#38bdf8' }}>
                      <div className="theme-accent" style={{ background: '#38bdf8' }}></div>
                      <div className="theme-accent-2" style={{ background: '#3b82f6' }}></div>
                   </div>
                   <h3>Oceanic</h3>
                   <p>Deep Blue</p>
                 </button>

                 {/* Sunset */}
                 <button
                   className={`theme-card ${theme === 'sunset' ? 'active' : ''}`}
                   onClick={() => updateTheme('sunset')}
                 >
                   <div className="theme-preview" style={{ background: '#1c0505', borderColor: '#fb923c' }}>
                      <div className="theme-accent" style={{ background: '#fb923c' }}></div>
                      <div className="theme-accent-2" style={{ background: '#ef4444' }}></div>
                   </div>
                   <h3>Sunset</h3>
                   <p>Warm & Vibrant</p>
                 </button>
               </div>
            </section>

          </div>
        </div>
      </main>

      <style jsx>{`
        .api-key-input {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem 1rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
        }
        .theme-card {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 1rem;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
        }
        .theme-card:hover {
          transform: translateY(-2px);
          border-color: var(--accent-primary);
        }
        .theme-card.active {
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 2px var(--accent-primary);
        }
        .theme-card h3 {
          font-size: 1rem;
          margin-bottom: 0.25rem;
        }
        .theme-card p {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }
        .theme-preview {
          height: 100px;
          border-radius: var(--radius-md);
          margin-bottom: 0.75rem;
          border: 1px solid;
          position: relative;
          overflow: hidden;
        }
        .theme-accent {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          filter: blur(10px);
          opacity: 0.6;
        }
        .theme-accent-2 {
          position: absolute;
          bottom: 10px;
          right: 10px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          opacity: 0.8;
        }
      `}</style>
    </>
  );
}
