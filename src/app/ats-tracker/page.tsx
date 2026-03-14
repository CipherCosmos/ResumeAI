'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  BarChart3, Target, Loader2, Plus, X, TrendingUp,
  CheckCircle2, AlertCircle, Lightbulb, FileText, Clock,
  Upload, File, Zap, Shield, Award, AlertTriangle, ThumbsUp
} from 'lucide-react';

interface AtsScoreItem {
  id: string;
  score: number;
  jdSnippet: string | null;
  matched: string[];
  missing: string[];
  suggestions: string[];
  fullResult?: any;
  createdAt: string;
  resume: { id: string; title: string };
}

interface KeywordDetail {
  keyword: string;
  found: boolean;
  frequency: number;
  category: string;
}

interface DetailedResult {
  // Deterministic component scores
  score: number;
  keywordScore: number;
  sectionScore: number;
  bulletScore: number;
  readabilityScore: number;
  formatScore: number;

  // Keyword analysis
  matched: string[];
  missing: string[];
  keywords?: KeywordDetail[];

  // Section analysis
  sections?: { name: string; detected: boolean; quality: string; feedback: string }[];

  // Bullet analysis
  bulletAnalysis?: {
    totalBullets: number;
    actionVerbBullets: number;
    quantifiedBullets: number;
    avgBulletLength: number;
    actionVerbs: string[];
    metrics: string[];
  };

  // Format & readability
  readabilityMetrics?: { avgSentenceLength: number; totalWords: number; hasSpecialChars: boolean; hasTablesOrImages: boolean };
  formatMetrics?: { hasDates: boolean; dateConsistency: boolean; hasProperLength: boolean; wordCount: number; estimatedPages: number };

  // AI qualitative
  overallVerdict?: string;
  suggestions?: string[];
  strengthAreas?: string[];
  formatIssues?: string[];
  sectionFeedback?: Record<string, string>;
}

interface ResumeOption {
  id: string;
  title: string;
}

export default function AtsTrackerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [scores, setScores] = useState<AtsScoreItem[]>([]);
  const [resumes, setResumes] = useState<ResumeOption[]>([]);
  const [loading, setLoading] = useState(true);

  // New analysis modal
  const [showModal, setShowModal] = useState(false);
  const [inputMode, setInputMode] = useState<'select' | 'upload'>('select');
  const [selectedResume, setSelectedResume] = useState('');
  const [uploadedText, setUploadedText] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [jd, setJd] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detail view
  const [viewingScore, setViewingScore] = useState<AtsScoreItem | null>(null);
  const [detailedResult, setDetailedResult] = useState<DetailedResult | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin');
    if (status === 'authenticated') fetchData();
  }, [status, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ats-tracker');
      if (res.ok) {
        const data = await res.json();
        setScores(data.scores || []);
        setResumes(data.resumes || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadedFileName(file.name);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/parse-resume', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.parsed) {
        // Convert parsed JSON to readable text
        setUploadedText(JSON.stringify(data.parsed));
      } else {
        // Try plain text read
        const text = await file.text();
        if (text.trim().length > 20) {
          setUploadedText(text);
        } else {
          alert(data.error || 'Could not parse file.');
          setUploadedFileName('');
        }
      }
    } catch {
      alert('Error uploading file.');
      setUploadedFileName('');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = async () => {
    const hasResume = inputMode === 'select' ? selectedResume : uploadedText.trim();
    if (!hasResume || !jd.trim()) return;
    setAnalyzing(true);
    setAnalysisStep('Initializing Neural Feed...');
    
    try {
      // Artificial delay for better UX
      await new Promise(r => setTimeout(r, 800));
      setAnalysisStep('AI Keyword Extraction...');

      const body: any = { jobDescription: jd };
      if (inputMode === 'select') {
        body.resumeId = selectedResume;
      } else {
        body.resumeText = uploadedText;
      }

      const res = await fetch('/api/ats-tracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      setAnalysisStep('Deterministic Analysis...');
      await new Promise(r => setTimeout(r, 600));
      setAnalysisStep('Qualitative Commentary...');

      const data = await res.json();
      if (res.ok && data.score) {
        setShowModal(false);
        setJd('');
        setSelectedResume('');
        setUploadedText('');
        setUploadedFileName('');
        fetchData();
        // Auto-open the result
        setViewingScore(data.score);
        setDetailedResult(data.result || null);
      } else {
        alert(data.error || 'Analysis failed.');
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setAnalyzing(false);
      setAnalysisStep('');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Work';
  };

  const getSectionIcon = (key: string) => {
    const icons: Record<string, React.ReactNode> = {
      contactInfo: <FileText size={14} />,
      summary: <Zap size={14} />,
      experience: <Award size={14} />,
      skills: <Shield size={14} />,
      education: <FileText size={14} />,
      projects: <Target size={14} />,
      formatting: <BarChart3 size={14} />,
    };
    return icons[key] || <FileText size={14} />;
  };

  const getSectionLabel = (key: string) => {
    const labels: Record<string, string> = {
      contactInfo: 'Contact Info',
      summary: 'Summary',
      experience: 'Experience',
      skills: 'Skills',
      education: 'Education',
      projects: 'Projects',
      formatting: 'Formatting',
    };
    return labels[key] || key;
  };

  const averageScore = scores.length > 0
    ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length)
    : 0;

  const bestScore = scores.length > 0 ? Math.max(...scores.map(s => s.score)) : 0;

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto flex items-center justify-center pt-24">
        <Loader2 size={36} className="spin-icon" style={{ color: 'var(--primary)' }} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12 md:py-16 max-w-7xl relative">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16 relative z-10">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-[2px] w-12 bg-primary" />
            <span className="text-[0.6rem] font-black uppercase tracking-[0.5em] text-primary/80">Structural Integrity Protocol</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-[-0.05em] uppercase italic leading-none flex items-center gap-4">
            <div className="p-3 bg-zinc-950 border border-primary/30 shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)] skew-x-[-12deg]">
              <Target size={40} className="text-primary skew-x-[12deg]" />
            </div>
            <span className="relative">
              ORBITAL
              <span className="block text-primary">AUDIT</span>
              <span className="absolute -inset-2 bg-primary/10 blur-2xl opacity-50 -z-10" />
            </span>
          </h1>
          <p className="max-w-xl text-zinc-500 font-medium leading-relaxed">
            High-precision algorithmic auditing for structural resume integrity. 
            Cross-referencing neural patterns against target deployment parameters.
          </p>
        </div>

        <div className="flex flex-col items-end gap-4">
          <div className="flex items-center gap-6 px-6 py-3 bg-zinc-950/50 border border-white/5 backdrop-blur-md rounded-sm skew-x-[-12deg]">
            <div className="skew-x-[12deg] flex items-center gap-8">
              <div className="flex flex-col">
                <span className="text-[0.5rem] font-black text-zinc-500 uppercase tracking-widest">System Load</span>
                <span className="text-xs font-mono text-zinc-300">0.02ms</span>
              </div>
              <div className="h-8 w-[1px] bg-white/10" />
              <div className="flex flex-col">
                <span className="text-[0.5rem] font-black text-zinc-500 uppercase tracking-widest">Protocol</span>
                <span className="text-xs font-mono text-primary">v4.0.2_BETA</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => setShowModal(true)} 
            className="group relative h-14 px-10 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.2em] text-[0.7rem] skew-x-[-12deg] transition-all shadow-[0_0_40px_rgba(var(--primary-rgb),0.3)] hover:shadow-primary/50 overflow-hidden border-none"
          >
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%] group-hover:animate-[shimmer_2s_infinite] pointer-events-none" />
            <div className="relative z-10 skew-x-[12deg] flex items-center gap-3">
              <Plus size={16} /> 
              Initialize Audit
            </div>
          </button>
        </div>
      </div>

      {/* Tactical Data Modules (Stats) */}
      {scores.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="group relative bg-zinc-950/40 border border-white/5 p-8 overflow-hidden transition-all hover:border-primary/20">
            <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-20 transition-opacity">
              <FileText size={80} />
            </div>
            <div className="relative z-10 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 bg-primary animate-pulse" />
                <span className="text-[0.6rem] font-black text-zinc-500 uppercase tracking-widest">Total Deployments</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black italic tracking-tighter text-white">{scores.length}</span>
                <span className="text-[0.6rem] font-bold text-zinc-600 uppercase">Analyses</span>
              </div>
              <div className="h-[1px] w-full bg-gradient-to-r from-white/10 to-transparent" />
            </div>
          </div>

          <div className="group relative bg-zinc-950/40 border border-white/5 p-8 overflow-hidden transition-all hover:border-primary/20">
            <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-20 transition-opacity">
              <TrendingUp size={80} />
            </div>
            <div className="relative z-10 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 bg-primary animate-pulse" />
                <span className="text-[0.6rem] font-black text-zinc-500 uppercase tracking-widest">Mean Integrity</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black italic tracking-tighter" style={{ color: getScoreColor(averageScore) }}>
                  {averageScore}
                  <small className="text-2xl ml-1">%</small>
                </span>
                <span className="text-[0.6rem] font-bold text-zinc-600 uppercase">Aggregate</span>
              </div>
              <div className="h-[1px] w-full bg-gradient-to-r from-white/10 to-transparent" />
            </div>
          </div>

          <div className="group relative bg-zinc-950/40 border border-white/5 p-8 overflow-hidden transition-all hover:border-primary/20">
            <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-20 transition-opacity">
              <Award size={80} />
            </div>
            <div className="relative z-10 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 bg-primary animate-pulse" />
                <span className="text-[0.6rem] font-black text-zinc-500 uppercase tracking-widest">Peak Alignment</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black italic tracking-tighter" style={{ color: getScoreColor(bestScore) }}>
                  {bestScore}
                  <small className="text-2xl ml-1">%</small>
                </span>
                <span className="text-[0.6rem] font-bold text-zinc-600 uppercase">Maximum</span>
              </div>
              <div className="h-[1px] w-full bg-gradient-to-r from-white/10 to-transparent" />
            </div>
          </div>
        </div>
      )}

      {/* Score history */}
      <div className="space-y-6 relative z-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <h2 className="text-[0.65rem] font-black uppercase tracking-[0.4em] text-zinc-500 italic">Structural Deployment Logs</h2>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        {scores.length === 0 ? (
          <div className="relative group bg-zinc-950/20 border border-dashed border-white/5 rounded-sm p-20 text-center overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--primary-rgb),0.03)_0%,transparent_70%)] group-hover:scale-150 transition-transform duration-1000" />
            <Target size={64} className="mx-auto text-zinc-800 mb-6 group-hover:text-primary/20 transition-colors" />
            <h3 className="text-xl font-black uppercase italic tracking-wider text-zinc-400 mb-2">No Neural Patterns Detected</h3>
            <p className="text-zinc-600 max-w-md mx-auto mb-8 font-medium">
              Initialize a structural audit to begin cross-referencing resume architecture against target job parameters.
            </p>
            <button 
              onClick={() => setShowModal(true)} 
              className="px-8 py-3 bg-zinc-900 border border-white/10 text-white font-black uppercase tracking-widest text-[0.6rem] hover:bg-primary hover:border-primary transition-all skew-x-[-12deg]"
            >
              <span className="skew-x-[12deg] flex items-center gap-2">
                <Plus size={14} /> Start First Audit
              </span>
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {scores.map(score => (
              <div
                key={score.id}
                className="group relative bg-zinc-950/30 border border-white/5 p-6 cursor-pointer transition-all hover:bg-zinc-900/50 hover:border-primary/30"
                onClick={() => { setViewingScore(score); setDetailedResult(score.fullResult || null); }}
              >
                {/* Accent line */}
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary/0 group-hover:bg-primary transition-all" />
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                  <div className="flex items-center gap-6">
                    <div className="relative flex items-center justify-center h-16 w-16 group-hover:scale-110 transition-transform">
                      {/* Progress Ring */}
                      <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          className="text-white/5"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeDasharray={175.9}
                          strokeDashoffset={175.9 * (1 - score.score / 100)}
                          className="transition-all duration-1000 ease-out"
                          style={{ color: getScoreColor(score.score) }}
                        />
                      </svg>
                      <span className="text-xs font-black" style={{ color: getScoreColor(score.score) }}>
                        {score.score}%
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-[0.6rem] font-mono text-zinc-600 uppercase tracking-tighter">Log ID: {score.id.substring(0, 8)}</span>
                        <div className="h-[2px] w-4 bg-zinc-800" />
                        <span className="text-[0.55rem] font-black uppercase tracking-widest px-2 py-0.5 bg-zinc-900 border border-white/5" style={{ color: getScoreColor(score.score) }}>
                          {getScoreLabel(score.score)}
                        </span>
                      </div>
                      <h4 className="text-lg font-black uppercase italic tracking-tight text-white flex items-center gap-3">
                        {score.resume.title}
                        <div className="h-1 w-1 bg-primary rounded-full animate-pulse" />
                      </h4>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-[0.65rem] font-medium text-zinc-500 flex items-center gap-1.5">
                          <Clock size={12} className="text-primary/60" /> 
                          {new Date(score.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        {score.jdSnippet && (
                          <>
                            <div className="h-1 w-1 bg-zinc-800 rounded-full" />
                            <span className="text-[0.65rem] font-medium text-zinc-500 italic truncate max-w-[200px] md:max-w-[400px]">
                              Target: {score.jdSnippet.substring(0, 60)}...
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end gap-6 md:gap-2">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-end">
                        <span className="text-[0.5rem] font-black text-zinc-600 uppercase">Neural Matches</span>
                        <span className="text-sm font-black text-emerald-500 flex items-center gap-1.5">
                          <CheckCircle2 size={14} /> {(score.matched as string[])?.length || 0}
                        </span>
                      </div>
                      <div className="h-8 w-[1px] bg-white/5" />
                      <div className="flex flex-col items-end">
                        <span className="text-[0.5rem] font-black text-zinc-600 uppercase">Conflict Points</span>
                        <span className="text-sm font-black text-red-500 flex items-center gap-1.5">
                          <AlertCircle size={14} /> {(score.missing as string[])?.length || 0}
                        </span>
                      </div>
                    </div>
                    <button className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-primary group-hover:translate-x-1 transition-transform flex items-center gap-2">
                      View full report <BarChart3 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt,.md"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      {/* Run Analysis Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[120] bg-zinc-950/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-zinc-900 border border-white/10 shadow-[0_0_100px_rgba(0,0,0,1)] relative flex flex-col overflow-hidden">
            {/* Terminal Header Decor */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/50 to-transparent" />
            <div className="p-8 pb-0 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-zinc-950 border border-primary/30">
                  <Target size={20} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase italic tracking-wider text-white">Initialize Audit</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[0.5rem] font-black text-zinc-500 uppercase tracking-widest">Protocol: ATS_SCAN_V4</span>
                    <div className="h-1 w-1 bg-primary rounded-full animate-ping" />
                  </div>
                </div>
              </div>
              <button 
                className="p-2 text-zinc-500 hover:text-white transition-colors"
                onClick={() => setShowModal(false)}
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8">
              {/* Input mode tabs */}
              <div className="flex gap-2 mb-8">
                <button
                  onClick={() => setInputMode('select')}
                  className={`flex-1 h-12 flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[0.6rem] transition-all skew-x-[-12deg] ${inputMode === 'select' ? 'bg-primary text-white' : 'bg-zinc-950 border border-white/5 text-zinc-500 hover:text-zinc-300'}`}
                >
                  <span className="skew-x-[12deg] flex items-center gap-2">
                    <FileText size={14} /> Neural Repository
                  </span>
                </button>
                <button
                  onClick={() => setInputMode('upload')}
                  className={`flex-1 h-12 flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[0.6rem] transition-all skew-x-[-12deg] ${inputMode === 'upload' ? 'bg-primary text-white' : 'bg-zinc-950 border border-white/5 text-zinc-500 hover:text-zinc-300'}`}
                >
                  <span className="skew-x-[12deg] flex items-center gap-2">
                    <Upload size={14} /> External Feed
                  </span>
                </button>
              </div>

              {/* Resume input */}
              <div className="space-y-6 mb-8">
                {inputMode === 'select' ? (
                  <div className="space-y-2">
                    <label className="text-[0.6rem] font-black text-zinc-500 uppercase tracking-[0.2em]">Select Deployment Pattern</label>
                    <select
                      value={selectedResume}
                      onChange={e => setSelectedResume(e.target.value)}
                      className="w-full h-14 bg-zinc-950 border border-white/10 px-4 text-zinc-200 font-mono text-sm focus:border-primary outline-none transition-all"
                    >
                      <option value="">Pattern Select...</option>
                      {resumes.map(r => (
                        <option key={r.id} value={r.id}>{r.title}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[0.6rem] font-black text-zinc-500 uppercase tracking-[0.2em]">Pattern Upload (Structural Format)</label>
                    {uploadedFileName ? (
                      <div className="flex items-center gap-4 p-4 bg-zinc-950 border border-primary/20 rounded-sm">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <File size={16} className="text-primary" />
                        </div>
                        <span className="flex-1 text-sm font-mono text-zinc-300">{uploadedFileName}</span>
                        <button onClick={() => { setUploadedText(''); setUploadedFileName(''); }} className="text-zinc-600 hover:text-red-500 transition-colors">
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="w-full py-10 bg-zinc-950 border border-dashed border-white/5 hover:border-primary/30 transition-all flex flex-col items-center justify-center gap-4 text-zinc-500 hover:text-zinc-300"
                      >
                        {uploading ? (
                          <div className="flex flex-col items-center gap-3">
                            <Loader2 size={24} className="animate-spin text-primary" />
                            <span className="text-[0.6rem] font-black uppercase tracking-widest">Structural Parsing...</span>
                          </div>
                        ) : (
                          <>
                            <Upload size={32} className="opacity-20" />
                            <span className="text-[0.6rem] font-black uppercase tracking-widest">Drop Neural Fragment or Click</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[0.6rem] font-black text-zinc-500 uppercase tracking-[0.2em]">Deployment Parameters (Job Desc)</label>
                  <textarea
                    value={jd}
                    onChange={e => setJd(e.target.value)}
                    className="w-full h-40 bg-zinc-950 border border-white/10 p-4 text-zinc-200 font-mono text-sm focus:border-primary outline-none transition-all resize-none"
                    placeholder="Paste technical requirements..."
                  />
                </div>
              </div>

              <button
                onClick={handleAnalyze}
                disabled={analyzing || !(inputMode === 'select' ? selectedResume : uploadedText.trim()) || !jd.trim()}
                className="group relative w-full h-16 bg-primary hover:bg-primary/95 text-white font-black uppercase tracking-[0.3em] text-[0.75rem] transition-all skew-x-[-12deg] shadow-[0_0_40px_rgba(var(--primary-rgb),0.2)] disabled:opacity-50 disabled:grayscale overflow-hidden border-none"
              >
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%] group-hover:animate-[shimmer_2s_infinite] pointer-events-none" />
                <span className="relative z-10 skew-x-[12deg] flex items-center justify-center gap-4">
                  {analyzing ? (
                    <><Loader2 size={18} className="animate-spin" /> {analysisStep || 'Cross-Referencing patterns...'}</>
                  ) : (
                    <><Zap size={18} /> Initialize Structural Audit</>
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Score Detail Modal */}
      {viewingScore && (
        <div className="fixed inset-0 z-[120] bg-zinc-950/90 backdrop-blur-2xl flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-zinc-900 border border-white/10 shadow-[0_0_150px_rgba(0,0,0,1)] relative flex flex-col overflow-hidden max-h-[95vh]">
            {/* Report Header Decor */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/50 to-transparent" />
            
            <div className="p-8 pb-4 flex items-center justify-between border-b border-white/5 bg-zinc-950/50">
              <div className="flex items-center gap-6">
                <div className="relative flex items-center justify-center h-20 w-20">
                  <svg className="absolute inset-0 w-full h-full -rotate-90 scale-125">
                    <circle cx="40" cy="40" r="32" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/5" />
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeDasharray={201}
                      strokeDashoffset={201 * (1 - viewingScore.score / 100)}
                      className="transition-all duration-1000 ease-out"
                      style={{ color: getScoreColor(viewingScore.score) }}
                    />
                  </svg>
                  <div className="relative z-10 flex flex-col items-center">
                    <span className="text-2xl font-black italic leading-none" style={{ color: getScoreColor(viewingScore.score) }}>{viewingScore.score}%</span>
                    <span className="text-[0.5rem] font-black uppercase text-zinc-500 tracking-tighter mt-1">Integrity</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[0.6rem] font-black text-primary uppercase tracking-[0.3em]">Structural Audit Report</span>
                    <div className="h-1 w-1 bg-zinc-700 rounded-full" />
                    <span className="text-[0.6rem] font-mono text-zinc-500 uppercase tracking-widest">SEQ_{viewingScore.id.substring(0, 8)}</span>
                  </div>
                  <h3 className="text-2xl font-black uppercase italic tracking-tight text-white">{viewingScore.resume.title}</h3>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-zinc-900 border border-white/5 rounded-sm">
                      <Clock size={10} className="text-zinc-500" />
                      <span className="text-[0.6rem] font-bold text-zinc-400 uppercase tracking-widest">{new Date(viewingScore.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <span className="text-[0.65rem] font-black uppercase tracking-widest" style={{ color: getScoreColor(viewingScore.score) }}>
                      Status: {getScoreLabel(viewingScore.score)}
                    </span>
                  </div>
                </div>
              </div>
              <button 
                className="p-3 bg-zinc-950 border border-white/10 hover:border-white/30 text-zinc-500 hover:text-white transition-all rounded-sm"
                onClick={() => { setViewingScore(null); setDetailedResult(null); }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-12">
              {/* Overall Assessment Terminal */}
              {detailedResult?.overallVerdict && (
                <div className="relative group bg-zinc-950 border border-primary/20 p-8 overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <Zap size={16} className="text-primary" />
                      <h4 className="text-[0.65rem] font-black uppercase tracking-[0.3em] text-zinc-400 italic">Algorithmic Verdict</h4>
                    </div>
                    <p className="text-lg font-medium leading-relaxed text-zinc-200">
                      {detailedResult.overallVerdict}
                    </p>
                  </div>
                  <div className="absolute bottom-2 right-4 flex items-center gap-2 opacity-10 font-mono text-[0.6rem] text-primary">
                    <span className="animate-pulse">SCANNING COMPLETE</span>
                    <span>10.02.44.X</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Score Breakdown Column */}
                <div className="space-y-8">
                  <div className="flex items-center gap-3">
                    <BarChart3 size={16} className="text-primary" />
                    <h4 className="text-[0.65rem] font-black uppercase tracking-[0.3em] text-zinc-500 italic">Component Alignment</h4>
                  </div>
                  
                  {detailedResult ? (
                    <div className="space-y-4">
                      {[
                        { label: 'Keyword Match', score: detailedResult.keywordScore, weight: '35%', icon: <Target size={14} /> },
                        { label: 'Neural Sections', score: detailedResult.sectionScore, weight: '20%', icon: <FileText size={14} /> },
                        { label: 'Impact Density', score: detailedResult.bulletScore, weight: '15%', icon: <Award size={14} /> },
                        { label: 'Neural Readability', score: detailedResult.readabilityScore, weight: '15%', icon: <Zap size={14} /> },
                        { label: 'Visual Format', score: detailedResult.formatScore, weight: '15%', icon: <Shield size={14} /> },
                      ].map(item => (
                        <div key={item.label} className="bg-zinc-950/50 border border-white/5 p-4 group hover:border-primary/20 transition-all">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="text-primary opacity-50 group-hover:opacity-100 transition-opacity">{item.icon}</div>
                              <span className="text-[0.7rem] font-black uppercase tracking-widest text-zinc-400">{item.label}</span>
                            </div>
                            <span className="text-sm font-black italic pr-1" style={{ color: getScoreColor(item.score) }}>{item.score}%</span>
                          </div>
                          <div className="h-1 bg-white/5 overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all duration-[1500ms] ease-out shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" 
                              style={{ width: `${item.score}%`, backgroundColor: getScoreColor(item.score) }} 
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 bg-zinc-950/50 border border-dashed border-white/10 text-center">
                      <span className="text-[0.6rem] font-black uppercase tracking-widest text-zinc-600">No Breakdown Data Available</span>
                    </div>
                  )}
                </div>

                {/* Tactical Stats Column */}
                <div className="space-y-8">
                  <div className="flex items-center gap-3">
                    <Award size={16} className="text-primary" />
                    <h4 className="text-[0.65rem] font-black uppercase tracking-[0.3em] text-zinc-500 italic">Structural Metrics</h4>
                  </div>

                  {detailedResult?.bulletAnalysis ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-zinc-950/50 border border-white/5 p-6 hover:border-primary/20 transition-all">
                        <span className="text-[0.5rem] font-black text-zinc-600 uppercase tracking-widest block mb-2">Total Bullets</span>
                        <div className="text-3xl font-black italic text-white leading-none">{detailedResult.bulletAnalysis.totalBullets}</div>
                        <div className="h-[1px] w-8 bg-primary/40 mt-3" />
                      </div>
                      <div className="bg-zinc-950/50 border border-white/5 p-6 hover:border-primary/20 transition-all">
                        <span className="text-[0.5rem] font-black text-zinc-600 uppercase tracking-widest block mb-2">Active Verbs</span>
                        <div className="text-3xl font-black italic text-emerald-500 leading-none">{detailedResult.bulletAnalysis.actionVerbBullets}</div>
                        <div className="h-[1px] w-8 bg-emerald-500/40 mt-3" />
                      </div>
                      <div className="bg-zinc-950/50 border border-white/5 p-6 hover:border-primary/20 transition-all">
                        <span className="text-[0.5rem] font-black text-zinc-600 uppercase tracking-widest block mb-2">Quantified Impact</span>
                        <div className="text-3xl font-black italic text-amber-500 leading-none">{detailedResult.bulletAnalysis.quantifiedBullets}</div>
                        <div className="h-[1px] w-8 bg-amber-500/40 mt-3" />
                      </div>
                      <div className="bg-zinc-950/50 border border-white/5 p-6 hover:border-primary/20 transition-all">
                        <span className="text-[0.5rem] font-black text-zinc-600 uppercase tracking-widest block mb-2">Words/Node</span>
                        <div className="text-3xl font-black italic text-zinc-400 leading-none">{detailedResult.bulletAnalysis.avgBulletLength}</div>
                        <div className="h-[1px] w-8 bg-zinc-700 mt-3" />
                      </div>
                    </div>
                  ) : (
                    <div className="px-6 py-12 bg-zinc-950/50 border border-dashed border-white/10 text-center">
                      <span className="text-[0.6rem] font-black uppercase tracking-widest text-zinc-600 italic">Initializing structural calculation...</span>
                    </div>
                  )}

                  {detailedResult?.bulletAnalysis && (
                    <div className="p-4 bg-zinc-950/30 border border-white/5 space-y-4">
                      <div>
                        <span className="text-[0.5rem] font-black text-zinc-600 uppercase tracking-[0.2em] block mb-2">Tactical Action Tokens</span>
                        <div className="flex flex-wrap gap-1.5">
                          {detailedResult.bulletAnalysis.actionVerbs.map((v, i) => (
                            <span key={i} className="text-[0.55rem] font-mono font-bold px-2 py-0.5 bg-emerald-500/5 text-emerald-500 border border-emerald-500/20 uppercase">{v}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-[0.5rem] font-black text-zinc-600 uppercase tracking-[0.2em] block mb-2">Detected Performance Metrics</span>
                        <div className="flex flex-wrap gap-1.5">
                          {detailedResult.bulletAnalysis.metrics.map((m, i) => (
                            <span key={i} className="text-[0.55rem] font-mono font-bold px-2 py-0.5 bg-amber-500/5 text-amber-500 border border-amber-500/20 uppercase">{m}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Keyword Analysis Terminal */}
              <div className="space-y-8">
                <div className="flex items-center gap-3">
                  <Target size={16} className="text-primary" />
                  <h4 className="text-[0.65rem] font-black uppercase tracking-[0.3em] text-zinc-500 italic">Structural Alignment Matrix</h4>
                </div>

                <div className="bg-zinc-950 border border-white/5 overflow-hidden">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-zinc-900/50">
                        <th className="px-6 py-4 text-left text-[0.5rem] font-black uppercase tracking-[0.3em] text-zinc-500 border-b border-white/5">Keyword Fragment</th>
                        <th className="px-6 py-4 text-center text-[0.5rem] font-black uppercase tracking-[0.3em] text-zinc-500 border-b border-white/5">Sector</th>
                        <th className="px-6 py-4 text-center text-[0.5rem] font-black uppercase tracking-[0.3em] text-zinc-500 border-b border-white/5">Integrity</th>
                        <th className="px-6 py-4 text-right text-[0.5rem] font-black uppercase tracking-[0.3em] text-zinc-500 border-b border-white/5">Density</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(detailedResult?.keywords || []).map((kw, i) => (
                        <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-6 py-3 font-mono text-xs text-zinc-300">{kw.keyword}</td>
                          <td className="px-6 py-3 text-center">
                            <span className="text-[0.55rem] font-black px-2 py-0.5 border border-white/10 uppercase tracking-widest text-zinc-500">{kw.category}</span>
                          </td>
                          <td className="px-6 py-3 text-center">
                            {kw.found ? <CheckCircle2 size={14} className="text-emerald-500 mx-auto" /> : <AlertCircle size={14} className="text-red-500 mx-auto" />}
                          </td>
                          <td className="px-6 py-3 text-right font-mono text-xs font-bold" style={{ color: kw.found ? '#10b981' : '#ef4444' }}>{kw.frequency}X</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(!detailedResult?.keywords || detailedResult.keywords.length === 0) && (
                    <div className="p-12 text-center">
                      <span className="text-[0.6rem] font-black uppercase tracking-[0.3em] text-zinc-700 italic pr-2">Neural Pattern Extraction in Progress...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actionable Directives */}
              {(detailedResult?.suggestions?.length || 0) > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Lightbulb size={16} className="text-amber-500" />
                    <h4 className="text-[0.65rem] font-black uppercase tracking-[0.3em] text-zinc-500 italic">Optimization Directives</h4>
                  </div>
                  <div className="grid gap-4">
                    {detailedResult?.suggestions?.map((s, i) => (
                      <div key={i} className="flex gap-6 p-6 bg-zinc-950/30 border border-white/5 group hover:border-amber-500/30 transition-all">
                        <span className="text-sm font-black italic text-amber-500 opacity-30 group-hover:opacity-100 transition-opacity">0{i+1}</span>
                        <p className="text-zinc-300 font-medium leading-relaxed">{s}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Footer Metrics Overlay */}
            <div className="p-4 bg-zinc-950 border-t border-white/5 flex items-center justify-between text-[0.55rem] font-black uppercase tracking-[0.2em] text-zinc-600">
              <div className="flex gap-8">
                <span>AUDIT_NODE: ORBITAL_LA_01</span>
                <span>LATENCY: 0.042MS</span>
              </div>
              <div className="flex gap-8">
                <span className="text-zinc-400">Wordcount: {detailedResult?.formatMetrics?.wordCount || 0}</span>
                <span className="text-zinc-400">Pages: {detailedResult?.formatMetrics?.estimatedPages || 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
