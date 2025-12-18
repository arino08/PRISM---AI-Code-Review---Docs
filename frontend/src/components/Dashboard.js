'use client';

import Link from 'next/link';
import { Shield, FileText, Github, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const features = [
    {
      href: '/review',
      icon: Shield,
      title: 'Code Review',
      description: 'Analyze code for vulnerabilities and quality issues',
    },
    {
      href: '/github',
      icon: Github,
      title: 'GitHub Integration',
      description: 'Connect repositories and review pull requests',
    },
    {
      href: '/docs',
      icon: FileText,
      title: 'Documentation',
      description: 'Generate documentation from your codebase',
    },
  ];

  return (
    <div className="dashboard-modern">
      {/* Hero Section */}
      <section className="hero">
        <h1 className="hero-title">
          Review code. <span className="gradient-text">Generate docs.</span>
        </h1>
        <p className="hero-subtitle">
          Automated code analysis for security vulnerabilities, quality issues, and instant documentation generation.
        </p>
        <div className="hero-actions">
          <Link href="/review" className="btn-hero-primary">
            Start Review
            <ArrowRight size={16} />
          </Link>
          <Link href="/docs" className="btn-hero-secondary">
            Generate Docs
          </Link>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="features">
        {features.map(({ href, icon: Icon, title, description }, idx) => (
          <Link key={idx} href={href} className="feature-card">
            <div className="feature-icon">
              <Icon size={20} />
            </div>
            <div className="feature-content">
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
            <ArrowRight size={16} className="feature-arrow" />
          </Link>
        ))}
      </section>

      {/* Stats */}
      <section className="stats-minimal">
        <div className="stat-item">
          <span className="stat-number">50+</span>
          <span className="stat-label">Security Patterns</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">&lt;30s</span>
          <span className="stat-label">Analysis Time</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">∞</span>
          <span className="stat-label">Files Supported</span>
        </div>
      </section>
    </div>
  );
}
