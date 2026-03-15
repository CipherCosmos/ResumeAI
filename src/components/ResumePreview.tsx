'use client';

import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, FileText, Printer, Loader2, Target, ChevronDown, ChevronUp, Check, Sparkles } from 'lucide-react';
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
            <button className="ats-badge group" onClick={() => setAtsExpanded(!atsExpanded)} type="button" style={{ borderColor: `${getScoreColor(atsResult.score)}44`, background: `${getScoreColor(atsResult.score)}11` }}>
               <Target size={12} className="opacity-70 group-hover:scale-110 transition-transform" />
               <span style={{ color: getScoreColor(atsResult.score), fontWeight: 900, fontSize: '0.7rem' }} className="italic">{atsResult.score}%</span>
               <span className="text-[0.6rem] font-black uppercase tracking-tighter opacity-70">Neural Match</span>
               {atsExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
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
        <div className="ats-details animate-in slide-in-from-top-2 fade-in duration-300 bg-background/80 backdrop-blur-md border border-accent/20 rounded-2xl p-4 mb-4 shadow-xl">
          <div className="flex items-center gap-6">
            <div className="ats-score-ring shrink-0 scale-75 origin-left">
              <svg viewBox="0 0 36 36" className="ats-ring-svg w-16 h-16">
                <path className="ats-ring-bg opacity-10" d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                <path className="ats-ring-fill transition-all duration-1000" d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="4"
                  style={{ stroke: getScoreColor(atsResult.score), strokeDasharray: `${atsResult.score}, 100` }} />
              </svg>
              <span className="ats-ring-text text-xl italic font-black" style={{ color: getScoreColor(atsResult.score) }}>{atsResult.score}</span>
            </div>
            
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="ats-keywords space-y-3">
                {atsResult.matchedKeywords.length > 0 && (
                  <div className="ats-kw-section">
                    <span className="text-[0.55rem] font-black uppercase tracking-[0.2em] text-emerald-500 flex items-center gap-1 mb-1.5"><Check size={10} /> Sync Points</span>
                    <div className="flex flex-wrap gap-1">
                      {atsResult.matchedKeywords.slice(0, 15).map((k, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[0.6rem] font-bold border border-emerald-500/20 italic">{k}</span>
                      ))}
                      {atsResult.matchedKeywords.length > 15 && <span className="text-[0.6rem] font-bold text-muted-foreground self-center">+{atsResult.matchedKeywords.length - 15} more</span>}
                    </div>
                  </div>
                )}
                {atsResult.missingKeywords.length > 0 && (
                  <div className="ats-kw-section">
                    <span className="text-[0.55rem] font-black uppercase tracking-[0.2em] text-amber-500 flex items-center gap-1 mb-1.5"><Target size={10} /> Delta Nodes</span>
                    <div className="flex flex-wrap gap-1">
                      {atsResult.missingKeywords.slice(0, 15).map((k, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500 text-[0.6rem] font-bold border border-amber-500/20 italic">{k}</span>
                      ))}
                      {atsResult.missingKeywords.length > 15 && <span className="text-[0.6rem] font-bold text-muted-foreground self-center">+{atsResult.missingKeywords.length - 15} more</span>}
                    </div>
                  </div>
                )}
              </div>

              <div className="ats-suggestions space-y-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
                <span className="text-[0.55rem] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-1 mb-1"><Sparkles size={10} /> AI Refinement</span>
                {atsResult.suggestions.slice(0, 3).map((s, i) => (
                  <p key={i} className="text-[0.65rem] font-medium leading-tight opacity-90 relative pl-3 flex items-start">
                    <span className="absolute left-0 top-1.5 w-1 h-1 rounded-full bg-primary" />
                    {s}
                  </p>
                ))}
              </div>
            </div>
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
