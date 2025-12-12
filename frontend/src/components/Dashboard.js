'use client';

import Link from 'next/link';
import { Shield, FileText, Github, ArrowRight, Sparkles, Zap, Lock, Code2 } from 'lucide-react';

export default function Dashboard() {
  const features = [
    {
      href: '/review',
      icon: Shield,
      title: 'Code Review',
      description: 'Detect vulnerabilities and quality issues',
      gradient: 'linear-gradient(135deg, #ffffff 0%, #a1a1aa 100%)',
    },
    {
      href: '/github',
      icon: Github,
      title: 'GitHub',
      description: 'Analyze repos and pull requests',
      gradient: 'linear-gradient(135deg, #e4e4e7 0%, #71717a 100%)',
    },
    {
      href: '/docs',
      icon: FileText,
      title: 'Documentation',
      description: 'Auto-generate docs from code',
      gradient: 'linear-gradient(135deg, #f4f4f5 0%, #a1a1aa 100%)',
    },
  ];

  const capabilities = [
    { icon: Lock, label: 'SQL Injection' },
    { icon: Zap, label: 'XSS Detection' },
    { icon: Code2, label: 'N+1 Queries' },
    { icon: Sparkles, label: 'Auto Docs' },
  ];

  return (
    <div className="dashboard-modern">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-badge">
          <Sparkles size={14} />
          <span>AI-Powered Analysis</span>
        </div>
        <h1 className="hero-title">
          Code Review,<br />
          <span className="gradient-text">Automated.</span>
        </h1>
        <p className="hero-subtitle">
          Security vulnerabilities. Code quality. Performance issues.<br />
          Detected in seconds, not days.
        </p>
        <div className="hero-actions">
          <Link href="/review" className="btn-hero-primary">
            Start Reviewing
            <ArrowRight size={18} />
          </Link>
          <Link href="/github" className="btn-hero-secondary">
            Connect GitHub
          </Link>
        </div>
      </section>

      {/* Capabilities */}
      <section className="capabilities">
        {capabilities.map(({ icon: Icon, label }, idx) => (
          <div key={idx} className="capability-item">
            <Icon size={16} />
            <span>{label}</span>
          </div>
        ))}
      </section>

      {/* Feature Cards */}
      <section className="features">
        {features.map(({ href, icon: Icon, title, description, gradient }, idx) => (
          <Link key={idx} href={href} className="feature-card">
            <div className="feature-icon" style={{ background: gradient }}>
              <Icon size={22} color="black" />
            </div>
            <div className="feature-content">
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
            <ArrowRight size={18} className="feature-arrow" />
          </Link>
        ))}
      </section>

      {/* Stats */}
      <section className="stats-minimal">
        <div className="stat-item">
          <span className="stat-number">50+</span>
          <span className="stat-label">Security Patterns</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-number">&lt;30s</span>
          <span className="stat-label">Analysis Time</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-number">∞</span>
          <span className="stat-label">Files Supported</span>
        </div>
      </section>
    </div>
  );
}
