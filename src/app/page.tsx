'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Sparkles, FileText, Target, Zap, ChevronRight, CheckCircle2, Upload, Briefcase, GraduationCap, Code } from 'lucide-react';

export default function LandingPage() {
  const { status } = useSession();

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={16} /> <span>ResumeAI v4 Unleashed</span>
          </div>
          <h1 className="hero-title">
            Land Your Dream Job with an <br />
            <span className="text-gradient">AI-Powered Resume</span>
          </h1>
          <p className="hero-subtitle">
            Instantly score against the ATS, rewrite bullets for maximum impact, and generate professional cover letters. Start scaling your career today.
          </p>
          <div className="hero-actions">
            <Link 
              href={status === 'authenticated' ? '/builder' : '/auth/signin'} 
              className="btn-primary hero-btn"
            >
              {status === 'authenticated' ? 'Go to Builder' : 'Start Building for Free'} <ChevronRight size={18} />
            </Link>
            {!status || status === 'unauthenticated' ? (
              <p className="hero-subtext">Includes 10 free AI credits. No credit card required.</p>
            ) : null}
          </div>
        </div>
        
        {/* Abstract shape / mock image area */}
        <div className="hero-visual glass-panel">
            <div className="visual-code-mock">
                <div className="mock-dot red"></div>
                <div className="mock-dot yellow"></div>
                <div className="mock-dot green"></div>
            </div>
            <div className="visual-content">
                <div className="mock-line title"></div>
                <div className="mock-line"></div>
                <div className="mock-line short"></div>
                <br />
                <div className="mock-line"></div>
                <div className="mock-line highlight"></div>
                <div className="mock-line"></div>
            </div>
            <div className="visual-badge"><Target size={14} /> ATS Score: 98/100</div>
        </div>
      </section>

      {/* The 8-Step Process */}
      <section className="process-section">
        <div className="features-header">
          <h2>The 8-Step Intelligent Builder</h2>
          <p>We break down the complex resume building process into 8 simple, manageable steps.</p>
        </div>
        <div className="process-grid">
            <div className="process-step glass-panel">
                <Upload size={20} className="step-icon" />
                <h4>1. Smart Parsing</h4>
                <p>Upload your old PDF/Word doc and our AI instantly extracts your data.</p>
            </div>
            <div className="process-step glass-panel">
                <Target size={20} className="step-icon" />
                <h4>2. Target JD</h4>
                <p>Paste the exact job description you want to apply for to guide the AI.</p>
            </div>
            <div className="process-step glass-panel">
                <Code size={20} className="step-icon" />
                <h4>3. Tailored Skills</h4>
                <p>AI suggests the exact keywords missing from your profile based on the JD.</p>
            </div>
            <div className="process-step glass-panel">
                <Briefcase size={20} className="step-icon" />
                <h4>4. XYZ Experience</h4>
                <p>Rewrite weak bullets into high-impact Google XYZ formula achievements.</p>
            </div>
            <div className="process-step glass-panel">
                <GraduationCap size={20} className="step-icon" />
                <h4>5. Education & Projects</h4>
                <p>Highlight your degrees, certifications, and standout portfolio projects.</p>
            </div>
            <div className="process-step glass-panel">
                <FileText size={20} className="step-icon" />
                <h4>6. Auto Cover Letters</h4>
                <p>Generate a highly-persuasive cover letter tailored exactly to the target JD.</p>
            </div>
        </div>
      </section>

      {/* Templates Section */}
      <section className="templates-showcase">
        <div className="features-header">
          <h2>ATS-Optimized Templates</h2>
          <p>Ditch the graphic-heavy Canva templates that robots can't read. Choose from our 3 proven formats.</p>
        </div>
        <div className="templates-grid">
            <div className="template-mockup glass-panel">
                <div className="template-preview professional-preview"></div>
                <h4>Professional</h4>
                <p>Clean, traditional corporate layout perfect for finance, law, and corporate roles.</p>
            </div>
            <div className="template-mockup glass-panel">
                <div className="template-preview modern-preview"></div>
                <h4>Modern</h4>
                <p>Contemporary look with accent sections. Ideal for tech and marketing.</p>
            </div>
            <div className="template-mockup glass-panel">
                <div className="template-preview minimal-preview"></div>
                <h4>Minimal</h4>
                <p>Simple, highly ATS-parseable layout focused strictly on content.</p>
            </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing-section" style={{ display: 'flex', flexDirection: 'column', gap: '3rem', marginTop: '2rem' }}>
        <div className="features-header">
          <h2>Simple, Pay-As-You-Go Pricing</h2>
          <p>We don't trap you in monthly subscriptions. Just buy AI tokens when you need them.</p>
        </div>
        <div className="templates-grid" style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
            {/* Free Tier */}
            <div className="template-mockup glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', padding: '2.5rem' }}>
                <h4 style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Trial</h4>
                <div style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--foreground)' }}>$0</div>
                <p style={{ opacity: 0.7, marginBottom: '2rem' }}>Perfect for testing the AI.</p>
                
                <ul className="trust-list" style={{ marginBottom: '2.5rem', flex: 1 }}>
                  <li style={{ fontSize: '0.95rem' }}><CheckCircle2 size={16} color="var(--success)" /> 10 Free AI Credits</li>
                  <li style={{ fontSize: '0.95rem' }}><CheckCircle2 size={16} color="var(--success)" /> 5 Standard Resume PDF Exports</li>
                  <li style={{ fontSize: '0.95rem' }}><CheckCircle2 size={16} color="var(--success)" /> 1 ATS Score Analysis</li>
                  <li style={{ fontSize: '0.95rem' }}><CheckCircle2 size={16} color="var(--success)" /> Basic Templates</li>
                </ul>
                <Link href="/auth/register" className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>Create Free Account</Link>
            </div>
            
            {/* Pro Tier */}
            <div className="template-mockup" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', padding: '2.5rem', background: 'var(--surface)', border: '2px solid var(--primary)', borderRadius: 'var(--radius-xl)', position: 'relative', boxShadow: '0 20px 40px -10px rgba(79, 70, 229, 0.2)' }}>
                <div style={{ position: 'absolute', top: '-14px', right: '2rem', background: 'var(--primary)', color: 'white', padding: '0.25rem 1rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Most Popular</div>
                <h4 style={{ color: 'var(--primary)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Pro Tokens</h4>
                <div style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--foreground)' }}>$5 <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ one-time</span></div>
                <p style={{ opacity: 0.7, marginBottom: '2rem' }}>Build exactly what you need.</p>
                
                <ul className="trust-list" style={{ marginBottom: '2.5rem', flex: 1 }}>
                  <li style={{ fontSize: '0.95rem' }}><CheckCircle2 size={16} color="var(--success)" /> 50 AI Credits</li>
                  <li style={{ fontSize: '0.95rem' }}><CheckCircle2 size={16} color="var(--success)" /> Lifetime Access to Generated Resumes</li>
                  <li style={{ fontSize: '0.95rem' }}><CheckCircle2 size={16} color="var(--success)" /> Advanced XYZ Bullet Rewrites</li>
                  <li style={{ fontSize: '0.95rem' }}><CheckCircle2 size={16} color="var(--success)" /> Target JD Keyword Matching</li>
                  <li style={{ fontSize: '0.95rem' }}><CheckCircle2 size={16} color="var(--success)" /> Premium ATS-Optimized Templates</li>
                </ul>
                <Link href={status === 'authenticated' ? '/dashboard' : '/auth/signin'} className="btn-primary" style={{ width: '100%' }}>Buy Tokens</Link>
            </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="trust-section">
        <div className="trust-content" style={{maxWidth: '800px', textAlign: 'center'}}>
          <h2>Ready to beat the algorithms?</h2>
          <p style={{fontSize: '1.1rem', opacity: 0.8, marginBottom: '2rem'}}>
             Join professionals optimizing their resumes with data-backed AI. No subscription required, just flexible pay-as-you-go tokens.
          </p>
          <Link 
              href={status === 'authenticated' ? '/builder' : '/auth/signin'} 
              className="btn-primary hero-btn"
              style={{margin: '0 auto'}}
            >
              Start Building Now
          </Link>
        </div>
      </section>
    </div>
  );
}
