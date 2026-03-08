'use client';

import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, FileText, Printer, Loader2, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { useResumeStore } from '@/store/useResumeStore';
import { ResumeData } from '@/types/resume';
import dynamic from 'next/dynamic';

const ProfessionalTemplate = dynamic(() => import('./templates/ProfessionalTemplate').then(m => m.ProfessionalTemplate), { ssr: false, loading: () => <div className="p-10 text-center animate-pulse">Loading Template...</div> });
const ModernTemplate = dynamic(() => import('./templates/ModernTemplate').then(m => m.ModernTemplate), { ssr: false, loading: () => <div className="p-10 text-center animate-pulse">Loading Template...</div> });
const MinimalTemplate = dynamic(() => import('./templates/MinimalTemplate').then(m => m.MinimalTemplate), { ssr: false, loading: () => <div className="p-10 text-center animate-pulse">Loading Template...</div> });
const ExecutiveTemplate = dynamic(() => import('./templates/ExecutiveTemplate').then(m => m.ExecutiveTemplate), { ssr: false, loading: () => <div className="p-10 text-center animate-pulse">Loading Template...</div> });
const TechTemplate = dynamic(() => import('./templates/TechTemplate').then(m => m.TechTemplate), { ssr: false, loading: () => <div className="p-10 text-center animate-pulse">Loading Template...</div> });
const ClassicTemplate = dynamic(() => import('./templates/ClassicTemplate').then(m => m.ClassicTemplate), { ssr: false, loading: () => <div className="p-10 text-center animate-pulse">Loading Template...</div> });
const FinanceTemplate = dynamic(() => import('./templates/FinanceTemplate').then(m => m.FinanceTemplate), { ssr: false, loading: () => <div className="p-10 text-center animate-pulse">Loading Template...</div> });
const CreativeTemplate = dynamic(() => import('./templates/CreativeTemplate').then(m => m.CreativeTemplate), { ssr: false, loading: () => <div className="p-10 text-center animate-pulse">Loading Template...</div> });
const StartupTemplate = dynamic(() => import('./templates/StartupTemplate').then(m => m.StartupTemplate), { ssr: false, loading: () => <div className="p-10 text-center animate-pulse">Loading Template...</div> });
const BoldTemplate = dynamic(() => import('./templates/BoldTemplate').then(m => m.BoldTemplate), { ssr: false, loading: () => <div className="p-10 text-center animate-pulse">Loading Template...</div> });
const DesignerTemplate = dynamic(() => import('./templates/DesignerTemplate').then(m => m.DesignerTemplate), { ssr: false, loading: () => <div className="p-10 text-center animate-pulse">Loading Template...</div> });
const AcademicTemplate = dynamic(() => import('./templates/AcademicTemplate').then(m => m.AcademicTemplate), { ssr: false, loading: () => <div className="p-10 text-center animate-pulse">Loading Template...</div> });
const ElegantTemplate = dynamic(() => import('./templates/ElegantTemplate').then(m => m.ElegantTemplate), { ssr: false, loading: () => <div className="p-10 text-center animate-pulse">Loading Template...</div> });
const CompactTemplate = dynamic(() => import('./templates/CompactTemplate').then(m => m.CompactTemplate), { ssr: false, loading: () => <div className="p-10 text-center animate-pulse">Loading Template...</div> });
const DataScientistTemplate = dynamic(() => import('./templates/DataScientistTemplate').then(m => m.DataScientistTemplate), { ssr: false, loading: () => <div className="p-10 text-center animate-pulse">Loading Template...</div> });
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useReactToPrint } from 'react-to-print';

interface AtsResult {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
}

interface ResumePreviewProps {
  resumeMarkdown: string;
  resumeData?: Record<string, unknown> | null;
  onResumeChange?: (markdown: string) => void;
  onReset?: () => void;
  jobDescription?: string;
  className?: string;
}

export default function ResumePreview({ resumeMarkdown, resumeData, onReset, jobDescription, className }: ResumePreviewProps) {
  const store = useResumeStore();
  const activeData = (resumeData || store.data) as ResumeData;
  const [atsResult, setAtsResult] = useState<AtsResult | null>(null);
  const [atsLoading, setAtsLoading] = useState(false);
  const [atsExpanded, setAtsExpanded] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Auto-run ATS score when resume is generated and JD is available
  useEffect(() => {
    if (resumeMarkdown && jobDescription && jobDescription.length > 20 && !atsResult) {
      runAtsScore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeMarkdown]);

  // PDF generation utilizing react-to-print
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: activeData?.personal?.fullName ? `${activeData.personal.fullName.replace(/\s+/g, '_')}_Resume` : 'Resume',
  });

  const runAtsScore = async () => {
    if (!resumeMarkdown || !jobDescription) return;
    setAtsLoading(true);
    try {
      const res = await fetch('/api/ats-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume: JSON.stringify(activeData), jobDescription }),
      });
      const data = await res.json();
      if (data.score !== undefined) setAtsResult(data);
    } catch { /* silent */ }
    setAtsLoading(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--success)';
    if (score >= 60) return 'var(--warning)';
    return 'var(--error)';
  };

  const hasData = resumeMarkdown || (activeData && activeData.personal?.fullName);
  if (!hasData) {
    return (
      <div className="preview-empty">
        <div className="preview-empty-icon"><FileText size={48} strokeWidth={1.5} /></div>
        <h3>Your Resume Awaits</h3>
        <p>Fill out the form and generate. Our AI crafts an ATS-optimized layout tailored to your target role.</p>
        <div className="preview-empty-features">
          <div className="preview-feature-item"><Target size={14} /><span>ATS Score</span></div>
          <div className="preview-feature-item"><Printer size={14} /><span>Print-ready PDF</span></div>
        </div>
      </div>
    );
  }

  const renderTemplate = () => {
    // Backwards compatibility for old markdown resumes
    if (resumeMarkdown && resumeMarkdown !== '# Generated' && resumeMarkdown !== 'Loaded') {
      return (
        <div className="resume-paper" style={{ padding: '2.5rem', background: 'white', color: 'black' }}>
          <div className="resume-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {resumeMarkdown}
            </ReactMarkdown>
          </div>
        </div>
      );
    }
    
    switch (activeData?.template || 'professional') {
      case 'modern': return <ModernTemplate data={activeData} />;
      case 'minimal': return <MinimalTemplate data={activeData} />;
      case 'executive': return <ExecutiveTemplate data={activeData} />;
      case 'tech': return <TechTemplate data={activeData} />;
      case 'classic': return <ClassicTemplate data={activeData} />;
      case 'finance': return <FinanceTemplate data={activeData} />;
      case 'creative': return <CreativeTemplate data={activeData} />;
      case 'startup': return <StartupTemplate data={activeData} />;
      case 'bold': return <BoldTemplate data={activeData} />;
      case 'designer': return <DesignerTemplate data={activeData} />;
      case 'academic': return <AcademicTemplate data={activeData} />;
      case 'elegant': return <ElegantTemplate data={activeData} />;
      case 'compact': return <CompactTemplate data={activeData} />;
      case 'datascientist': return <DataScientistTemplate data={activeData} />;
      case 'professional':
      default: return <ProfessionalTemplate data={activeData} />;
    }
  };

  return (
    <div className={`preview-container animate-fade-in ${className || ''}`}>
      {/* Toolbar */}
      <div className="preview-toolbar">
        <div className="preview-toolbar-left">
          <div className="preview-mode-toggle" style={{ fontWeight: 600, color: 'var(--foreground)' }}>
             Live Preview
          </div>
          {/* ATS Score Badge */}
          {atsLoading && <div className="ats-badge loading"><Loader2 size={13} className="spin-icon" /> Scoring...</div>}
          {atsResult && !atsLoading && (
            <button className="ats-badge" onClick={() => setAtsExpanded(!atsExpanded)} type="button" style={{ borderColor: getScoreColor(atsResult.score) }}>
               <Target size={13} />
               <span style={{ color: getScoreColor(atsResult.score), fontWeight: 700 }}>{atsResult.score}</span>
               <span>ATS</span>
               {atsExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
        </div>
        <div className="preview-toolbar-right">
          <button onClick={onReset} className="toolbar-btn" title="Reset" type="button"><RefreshCw size={14} /> Reset</button>
          <button onClick={() => handlePrint()} className="toolbar-btn accent" title="Print / PDF" type="button"><Printer size={14} /> Print PDF</button>
        </div>
      </div>

      {/* ATS Details Panel */}
      {atsResult && atsExpanded && (
        <div className="ats-details animate-fade-in">
          <div className="ats-score-ring">
            <svg viewBox="0 0 36 36" className="ats-ring-svg">
              <path className="ats-ring-bg" d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="3" />
              <path className="ats-ring-fill" d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="3"
                style={{ stroke: getScoreColor(atsResult.score), strokeDasharray: `${atsResult.score}, 100` }} />
            </svg>
            <span className="ats-ring-text" style={{ color: getScoreColor(atsResult.score) }}>{atsResult.score}</span>
          </div>
          <div className="ats-keywords">
            {atsResult.matchedKeywords.length > 0 && (
              <div className="ats-kw-section">
                <span className="ats-kw-label matched">✓ Matched</span>
                <div className="skill-chips">{atsResult.matchedKeywords.map((k, i) => <span key={i} className="skill-chip ats-matched">{k}</span>)}</div>
              </div>
            )}
            {atsResult.missingKeywords.length > 0 && (
              <div className="ats-kw-section">
                <span className="ats-kw-label missing">✗ Missing</span>
                <div className="skill-chips">{atsResult.missingKeywords.map((k, i) => <span key={i} className="skill-chip ats-missing">{k}</span>)}</div>
              </div>
            )}
            {atsResult.suggestions.length > 0 && (
              <div className="ats-suggestions">
                {atsResult.suggestions.map((s, i) => <p key={i} className="ats-suggestion-item">💡 {s}</p>)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="preview-content-area">
        <div ref={printRef} id="resume-print-area">
           {renderTemplate()}
        </div>
      </div>
    </div>
  );
}
