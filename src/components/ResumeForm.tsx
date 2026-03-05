'use client';

import React, { useState, useCallback, useRef } from 'react';
import {
  Briefcase, User, MapPin, GraduationCap, Code, FileText, Send, Upload,
  Sparkles, ChevronRight, ChevronLeft, X, Check, Loader2, Plus, Trash2,
  Globe, Mail, Phone, Linkedin, Github, Target, ClipboardList, Languages, Award, RefreshCcw
} from 'lucide-react';
import { ResumeData, ResumeTemplate, WorkEntry, ProjectEntry, EducationEntry } from '@/types/resume';
import { useResumeStore } from '@/store/useResumeStore';

interface ResumeFormProps {
  onSubmit: (data: ResumeData) => void;
  isLoading: boolean;
}

const STEPS = [
  { id: 0, title: 'Start',       icon: Upload,         desc: 'Upload existing resume or start fresh' },
  { id: 1, title: 'Personal',    icon: User,           desc: 'Contact details and online profiles' },
  { id: 2, title: 'Target & JD', icon: Target,         desc: 'Target role and optional job description for ATS' },
  { id: 3, title: 'Skills',      icon: Code,           desc: 'Technical and soft skills' },
  { id: 4, title: 'Experience',  icon: Briefcase,      desc: 'Work history with achievement bullets' },
  { id: 5, title: 'Projects',    icon: Globe,          desc: 'Notable projects and contributions' },
  { id: 6, title: 'Education',   icon: GraduationCap,  desc: 'Degrees, certifications, and courses' },
  { id: 7, title: 'Review',      icon: Send,           desc: 'Summary, extras, template, and generate' },
];

const TEMPLATES: { id: ResumeTemplate; name: string; desc: string }[] = [
  { id: 'professional', name: 'Professional', desc: 'Clean, traditional corporate layout' },
  { id: 'modern',       name: 'Modern',       desc: 'Contemporary with accent sections' },
  { id: 'minimal',      name: 'Minimal',      desc: 'Simple, highly ATS-parseable' },
];

export default function ResumeForm({ onSubmit, isLoading }: ResumeFormProps) {
  const store = useResumeStore();
  const data = store.data;
  const step = store.step;
  const setStep = store.setStep;

  // AI suggestions
  const [suggestions, setSuggestions] = useState<Record<string, string>>({});
  const [loadingSuggestion, setLoadingSuggestion] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  // Cover letter state
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [coverLetterLoading, setCoverLetterLoading] = useState(false);
  const [bulletLoading, setBulletLoading] = useState<string | null>(null);

  // Custom modal state
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  // Upload
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Skill input local states
  const [skillInput, setSkillInput] = useState('');
  const [certInput, setCertInput] = useState('');
  const [langInput, setLangInput] = useState('');

  // --- Helpers ---
  const handleAddChip = (field: 'skills' | 'certifications' | 'languages', input: string, setInput: (v: string) => void) => {
    store.addChip(field, input);
    setInput('');
  };

  // --- AI Suggestions ---
  const fetchSuggestion = async (field: string, value: string) => {
    setLoadingSuggestion(field);
    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, value, target_role: data.targetRole }),
      });
      const result = await res.json();
      if (result.suggestion) setSuggestions(p => ({ ...p, [field]: result.suggestion }));
    } catch { /* silent */ }
    setLoadingSuggestion(null);
  };

  const applySuggestion = (field: string) => {
    const s = suggestions[field];
    if (!s) return;
    if (field === 'skills') {
      const newSkills = s.split(',').map(sk => sk.trim()).filter(Boolean);
      newSkills.forEach(sk => store.addChip('skills', sk));
    } else if (field === 'summary') {
      store.updateField('summary', s);
    } else if (field === 'targetRoleIdeation') {
      applyTargetRoleSuggestion();
      return; // custom handler
    }
    dismissSuggestion(field);
  };

  const dismissSuggestion = (field: string) => {
    setSuggestions(p => { const c = { ...p }; delete c[field]; return c; });
  };

  const generateSummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field: 'summary',
          value: JSON.stringify({
            name: data.personal.fullName,
            role: data.targetRole,
            skills: data.skills.join(', '),
            experience: data.experience.map(e => `${e.jobTitle} at ${e.company}`).join('; '),
            education: data.education.map(e => `${e.degree} from ${e.institution}`).join('; '),
          }),
          target_role: data.targetRole,
        }),
      });
      const result = await res.json();
      if (result.suggestion) store.updateField('summary', result.suggestion);
    } catch { /* silent */ }
    setSummaryLoading(false);
  };

  // Debounced skill suggestion
  const onSkillsChange = () => {
    const val = data.skills.join(', ');
    if (val.length > 10) {
      if (debounceTimers.current['skills']) clearTimeout(debounceTimers.current['skills']);
      debounceTimers.current['skills'] = setTimeout(() => fetchSuggestion('skills', val), 2000);
    }
  };

  const handleRewriteBullets = async (entryId: string, entry: WorkEntry) => {
    if (!entry.bullets || entry.bullets.length === 0 || entry.bullets.every(b => b.trim() === '')) return;
    setBulletLoading(entryId);
    try {
      const res = await fetch('/api/rewrite-bullets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry, targetRole: data.targetRole }),
      });
      const result = await res.json();
      if (result.bullets) {
        // Clear existing bullets and add rewritten ones
        for (let i = entry.bullets.length - 1; i >= 0; i--) {
          store.removeBullet(entryId, i);
        }
        result.bullets.forEach((b: string, i: number) => {
          if (i === 0) {
             store.addBullet(entryId);
             store.updateBullet(entryId, 0, b);
          } else {
             store.addBullet(entryId);
             store.updateBullet(entryId, i, b);
          }
        });
        // cleanup if addBullet adds empty ones
        const updated = store.data.experience.find(e => e.id === entryId);
        if (updated) {
          updated.bullets.forEach((b, i) => {
            if (b.trim() === '' && i < result.bullets.length) {
              store.updateBullet(entryId, i, result.bullets[i]);
            }
          });
        }
      } else if (result.error) {
         alert(result.error);
      }
    } catch { 
       alert('Failed to rewrite bullets.');
    } finally {
      setBulletLoading(null);
    }
  };

  const handleGenerateRoleBullets = async (entryId: string, jobTitle: string) => {
    if (!jobTitle) return;
    setBulletLoading(entryId + '_generate');
    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: 'roleBullets', value: jobTitle, target_role: data.targetRole }),
      });
      const result = await res.json();
      if (result.suggestion) {
         const newBullets = result.suggestion.split('\n').map((b: string) => b.replace(/^[-*•▸]\s*/, '').trim()).filter(Boolean);
         
         // Only replace empty bullets or add new ones
         const entry = data.experience.find(e => e.id === entryId);
         if (entry) {
             let currentBulletIndex = 0;
             newBullets.forEach((bulletText: string) => {
                 // Try to fill in empty existing bullets first
                 while (currentBulletIndex < entry.bullets.length && entry.bullets[currentBulletIndex].trim() !== '') {
                     currentBulletIndex++;
                 }
                 if (currentBulletIndex < entry.bullets.length) {
                     store.updateBullet(entryId, currentBulletIndex, bulletText);
                     currentBulletIndex++;
                 } else {
                     // create new bullet
                     store.addBullet(entryId);
                     setTimeout(() => {
                        // slight hack because state needs to propagate before update
                         try { store.updateBullet(entryId, entry.bullets.length, bulletText); } catch {}
                     }, 50);
                 }
             });
         }
      }
    } catch { 
       alert('Failed to generate bullet ideas.');
    } finally {
      setBulletLoading(null);
    }
  };

  const handleRewriteProjectDesc = async (projId: string, desc: string) => {
    if (!desc) return;
    setLoadingSuggestion(projId);
    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: 'projectDesc', value: desc, target_role: data.targetRole }),
      });
      const result = await res.json();
      if (result.suggestion) {
         store.updateProject(projId, 'description', result.suggestion);
      }
    } catch { /* silent */ }
    setLoadingSuggestion(null);
  };

  const handleSuggestTargetRoles = async () => {
    setLoadingSuggestion('targetRoleIdeation');
    try {
      const expSum = data.experience.map(e => e.jobTitle).join(', ') + ' ' + data.skills.join(', ');
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: 'targetRoleIdeation', value: expSum || 'Entry Level' }),
      });
      const result = await res.json();
      if (result.suggestion) {
        setSuggestions(p => ({ ...p, targetRoleIdeation: result.suggestion }));
      }
    } catch { /* silent */ }
    setLoadingSuggestion(null);
  };
  
  const applyTargetRoleSuggestion = () => {
    const s = suggestions['targetRoleIdeation'];
    if (!s) return;
    // Just take the first suggested title for simplicity 
    const firstRole = s.split(',')[0].trim();
    store.updateField('targetRole', firstRole);
    dismissSuggestion('targetRoleIdeation');
  };

  const handleGenerateCoverLetter = async () => {
    setCoverLetterLoading(true);
    setCoverLetter(null);
    try {
      const res = await fetch('/api/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeData: data, jobDescription: data.jobDescription }),
      });
      const result = await res.json();
      if (result.coverLetter) {
        setCoverLetter(result.coverLetter);
      } else if (result.error) {
        alert(result.error);
      }
    } catch {
      alert('Failed to generate cover letter.');
    } finally {
      setCoverLetterLoading(false);
    }
  };

  // --- Upload ---
  const processFile = async (file: File) => {
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!['.txt', '.md', '.pdf', '.docx'].includes(ext)) {
      setUploadMsg('Unsupported format. Use PDF, DOCX, TXT, or MD.');
      return;
    }
    setIsUploading(true);
    setUploadMsg(null);
    setUploadedFile(file.name);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/parse-resume', { method: 'POST', body: fd });
      const result = await res.json();
      if (result.parsed) {
        const p = result.parsed;
        store.setResumeData({
          personal: {
            fullName: p.fullName || p.name || data.personal.fullName,
            email: p.email || data.personal.email,
            phone: p.phone || data.personal.phone,
            location: p.location || data.personal.location,
            linkedin: p.linkedin || data.personal.linkedin,
            github: p.github || data.personal.github,
            portfolio: p.portfolio || data.personal.portfolio,
          },
          summary: p.summary || data.summary,
          targetRole: p.targetRole || p.target_role || data.targetRole,
          skills: p.skills ? (Array.isArray(p.skills) ? p.skills : p.skills.split(',').map((s: string) => s.trim()).filter(Boolean)) : data.skills,
          experience: p.experience && Array.isArray(p.experience) && p.experience.length > 0
            ? p.experience.map((e: any) => ({
                id: crypto.randomUUID(),
                jobTitle: e.jobTitle || e.title || '',
                company: e.company || '',
                location: e.location || '',
                startDate: e.startDate || '',
                endDate: e.endDate || '',
                bullets: Array.isArray(e.bullets) ? e.bullets : (e.description ? [e.description] : ['']),
              }))
            : data.experience,
          projects: p.projects && Array.isArray(p.projects)
            ? p.projects.map((pr: any) => ({
                id: crypto.randomUUID(),
                name: pr.name || '',
                techStack: pr.techStack || pr.tech || '',
                description: pr.description || '',
                link: pr.link || '',
              }))
            : data.projects,
          education: p.education && Array.isArray(p.education) && p.education.length > 0
            ? p.education.map((ed: any) => ({
                id: crypto.randomUUID(),
                degree: ed.degree || '',
                institution: ed.institution || '',
                year: ed.year || '',
                gpa: ed.gpa || '',
              }))
            : data.education,
          certifications: p.certifications && Array.isArray(p.certifications) ? p.certifications : data.certifications,
          languages: p.languages && Array.isArray(p.languages) ? p.languages : data.languages,
        });
        setUploadMsg('✅ Resume parsed! Review each section below.');
        setStep(1);
      } else {
        setUploadMsg(result.error || 'Could not parse.');
        setUploadedFile(null);
      }
    } catch {
      setUploadMsg('Upload failed.');
      setUploadedFile(null);
    }
    setIsUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(data);
  };

  const nextStep = () => setStep(Math.min(step + 1, STEPS.length - 1));
  const prevStep = () => setStep(Math.max(step - 1, 0));

  const canProceed = useCallback((s: number): boolean => {
    switch (s) {
      case 1: return data.personal.fullName.trim().length > 0 && (data.personal.email.trim().length > 0 || data.personal.phone.trim().length > 0);
      case 2: return data.targetRole.trim().length > 0;
      default: return true;
    }
  }, [data]);

  const filledCount = [
    data.personal.fullName, data.personal.email || data.personal.phone,
    data.targetRole, data.skills.length > 0 ? 'y' : '',
    data.experience.some(e => e.jobTitle) ? 'y' : '',
    data.education.some(e => e.degree) ? 'y' : '',
  ].filter(Boolean).length;
  const progress = Math.round((filledCount / 6) * 100);
  const isLastStep = step === STEPS.length - 1;

  // --- Suggestion Bubble ---
  const SuggestionBubble = ({ field }: { field: string }) => {
    if (loadingSuggestion === field) {
      return <div className="ai-suggestion-bubble loading"><Loader2 size={14} className="spin-icon" /><span>AI is thinking...</span></div>;
    }
    if (!suggestions[field]) return null;
    return (
      <div className="ai-suggestion-bubble animate-fade-in">
        <div className="ai-suggestion-header"><Sparkles size={14} /><span>AI Suggestion</span><button onClick={() => dismissSuggestion(field)} className="suggestion-dismiss" type="button"><X size={12} /></button></div>
        <p className="ai-suggestion-text">{suggestions[field]}</p>
        <button onClick={() => applySuggestion(field)} className="suggestion-apply-btn" type="button"><Check size={14} /> Apply</button>
      </div>
    );
  };

  // We only show the UI after hydration is complete to avoid SSR mismatch with localStorage
  const [mounted, setMounted] = useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="form-panel glass-panel animate-fade-in">
      {step > 0 && (
        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          <span className="progress-bar-label">{progress}%</span>
        </div>
      )}

      <div className="stepper">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <button key={s.id} className={`stepper-item ${step === i ? 'active' : ''} ${step > i ? 'done' : ''}`} onClick={() => setStep(i)} type="button">
              <div className="stepper-icon">{step > i ? <Check size={12} /> : <Icon size={12} />}</div>
              <span className="stepper-label">{s.title}</span>
            </button>
          );
        })}
      </div>

      <div className="step-header">
        <h2 className="step-title">{React.createElement(STEPS[step].icon, { size: 20, color: 'var(--primary)' })} {STEPS[step].title}</h2>
        <p className="step-desc">{STEPS[step].desc}</p>
      </div>

      <form onSubmit={handleSubmit}>

        {/* === STEP 0: Upload === */}
        {step === 0 && (
          <div className="animate-fade-in">
            <div className="upload-zone" onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
              onDragLeave={e => e.currentTarget.classList.remove('drag-over')}
              onDrop={handleDrop}>
              {isUploading ? <Loader2 size={36} className="spin-icon" color="var(--primary)" /> : <div className="upload-zone-icon-wrap"><Upload size={28} /></div>}
              <p className="upload-zone-title">{isUploading ? 'Parsing...' : 'Drop your resume here'}</p>
              <p className="upload-zone-sub">PDF, DOCX, TXT, or MD</p>
              {uploadedFile && !isUploading && <div className="upload-file-badge"><FileText size={12} /> {uploadedFile}</div>}
              <input ref={fileRef} type="file" accept=".txt,.md,.pdf,.docx" onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); }} style={{ display: 'none' }} />
            </div>
            {uploadMsg && <div className={`upload-message animate-fade-in ${uploadMsg.startsWith('✅') ? 'success' : 'error'}`}>{uploadMsg}</div>}
            <div className="divider-or"><span>OR</span></div>
            <button type="button" onClick={nextStep} className="btn-primary full-width"><FileText size={16} /> Start from Scratch</button>
          </div>
        )}

        {/* === STEP 1: Personal === */}
        {step === 1 && (
          <div className="step-content animate-fade-in">
            <div className="form-grid">
              <div className="input-group">
                <label className="input-label"><User size={14} /> Full Name <span className="required">*</span></label>
                <input type="text" value={data.personal.fullName} onChange={e => store.updatePersonal('fullName', e.target.value)} className="input-field" placeholder="Jane Doe" required />
              </div>
              <div className="input-group">
                <label className="input-label"><Mail size={14} /> Email <span className="required">*</span></label>
                <input type="email" value={data.personal.email} onChange={e => store.updatePersonal('email', e.target.value)} className="input-field" placeholder="jane@example.com" />
              </div>
            </div>
            <div className="form-grid">
              <div className="input-group">
                <label className="input-label"><Phone size={14} /> Phone</label>
                <input type="tel" value={data.personal.phone} onChange={e => store.updatePersonal('phone', e.target.value)} className="input-field" placeholder="+1 234 567 8900" />
              </div>
              <div className="input-group">
                <label className="input-label"><MapPin size={14} /> Location</label>
                <input type="text" value={data.personal.location} onChange={e => store.updatePersonal('location', e.target.value)} className="input-field" placeholder="San Francisco, CA" />
              </div>
            </div>
            <div className="form-grid">
              <div className="input-group">
                <label className="input-label"><Linkedin size={14} /> LinkedIn</label>
                <input type="url" value={data.personal.linkedin} onChange={e => store.updatePersonal('linkedin', e.target.value)} className="input-field" placeholder="linkedin.com/in/janedoe" />
              </div>
              <div className="input-group">
                <label className="input-label"><Github size={14} /> GitHub</label>
                <input type="url" value={data.personal.github} onChange={e => store.updatePersonal('github', e.target.value)} className="input-field" placeholder="github.com/janedoe" />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label"><Globe size={14} /> Portfolio / Website</label>
              <input type="url" value={data.personal.portfolio} onChange={e => store.updatePersonal('portfolio', e.target.value)} className="input-field" placeholder="https://janedoe.dev" />
            </div>
          </div>
        )}

        {/* === STEP 2: Target & JD === */}
        {step === 2 && (
          <div className="step-content animate-fade-in">
            <div className="input-group">
              <div className="label-row">
                <label className="input-label"><Target size={14} /> Target Job Title <span className="required">*</span></label>
                <button type="button" onClick={handleSuggestTargetRoles} disabled={loadingSuggestion === 'targetRoleIdeation'} className="ai-autofill-btn" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                    {loadingSuggestion === 'targetRoleIdeation' ? <><Loader2 size={12} className="spin-icon" /> Analyzing...</> : <><Sparkles size={12} /> Suggest based on history</>}
                </button>
              </div>
              <input type="text" value={data.targetRole} onChange={e => store.updateField('targetRole', e.target.value)} className="input-field" placeholder="Senior Software Engineer" required />
              <SuggestionBubble field="targetRoleIdeation" />
              <p className="field-hint">AI uses this to tailor content and ATS keywords.</p>
            </div>
            <div className="input-group">
              <label className="input-label"><ClipboardList size={14} /> Job Description <span className="badge-optional">optional</span></label>
              <textarea value={data.jobDescription} onChange={e => store.updateField('jobDescription', e.target.value)} className="input-field jd-textarea" rows={10} placeholder="Paste the full job description here for maximum ATS optimization..." />
              <p className="field-hint">Pasting a JD lets AI extract keywords and score your resume against the role.</p>
            </div>
          </div>
        )}

        {/* === STEP 3: Skills === */}
        {step === 3 && (
          <div className="step-content animate-fade-in">
            <div className="input-group">
              <div className="label-row">
                <label className="input-label"><Code size={14} /> Skills {loadingSuggestion === 'skills' && <Loader2 size={13} className="spin-icon inline-loader" />}</label>
                <button type="button" onClick={() => fetchSuggestion('skills', data.targetRole || data.skills.join(', ') || 'general')} disabled={loadingSuggestion === 'skills'} className="ai-autofill-btn" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                  {loadingSuggestion === 'skills' ? <><Loader2 size={12} className="spin-icon" /> Suggesting...</> : <><Sparkles size={12} /> AI Suggest Skills</>}
                </button>
              </div>
              <div className="skill-input-row">
                <input type="text" value={skillInput} onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); handleAddChip('skills', skillInput, setSkillInput); onSkillsChange(); } }}
                  className="input-field" placeholder="Type a skill and press Enter" />
                <button type="button" onClick={() => { handleAddChip('skills', skillInput, setSkillInput); onSkillsChange(); }} className="btn-icon"><Plus size={16} /></button>
              </div>
              {data.skills.length > 0 && (
                <div className="skill-chips">
                  {data.skills.map((s, i) => (
                    <span key={i} className="skill-chip">{s}<button type="button" onClick={() => store.removeChip('skills', i)} className="chip-remove"><X size={11} /></button></span>
                  ))}
                </div>
              )}
              <SuggestionBubble field="skills" />
              {data.jobDescription && (
                <button type="button" onClick={() => fetchSuggestion('skills', `Extract the most important technical skills and keywords from this JD: ${data.jobDescription.substring(0, 500)}`)} disabled={loadingSuggestion === 'skills'} className="ai-autofill-btn" style={{ marginTop: '0.5rem', borderColor: 'var(--secondary)', color: 'var(--secondary)' }}>
                  <Target size={13} /> Extract Skills from JD
                </button>
              )}
            </div>
          </div>
        )}

        {/* === STEP 4: Experience === */}
        {step === 4 && (
          <div className="step-content animate-fade-in">
            {data.experience.map((entry, idx) => (
              <div key={entry.id} className="entry-card">
                <div className="entry-card-header">
                  <span className="entry-card-number">#{idx + 1}</span>
                  {data.experience.length > 1 && (
                    <button type="button" onClick={() => store.removeWorkEntry(entry.id)} className="entry-remove-btn"><Trash2 size={14} /></button>
                  )}
                </div>
                <div className="form-grid">
                  <div className="input-group">
                    <label className="input-label-sm">Job Title</label>
                    <input type="text" value={entry.jobTitle} onChange={e => store.updateWork(entry.id, 'jobTitle', e.target.value)} className="input-field" placeholder="Software Engineer" />
                  </div>
                  <div className="input-group">
                    <label className="input-label-sm">Company</label>
                    <input type="text" value={entry.company} onChange={e => store.updateWork(entry.id, 'company', e.target.value)} className="input-field" placeholder="Google" />
                  </div>
                </div>
                <div className="form-grid form-grid-3">
                  <div className="input-group">
                    <label className="input-label-sm">Location</label>
                    <input type="text" value={entry.location} onChange={e => store.updateWork(entry.id, 'location', e.target.value)} className="input-field" placeholder="Mountain View, CA" />
                  </div>
                  <div className="input-group">
                    <label className="input-label-sm">Start</label>
                    <input type="text" value={entry.startDate} onChange={e => store.updateWork(entry.id, 'startDate', e.target.value)} className="input-field" placeholder="Jan 2022" />
                  </div>
                  <div className="input-group">
                    <label className="input-label-sm">End</label>
                    <input type="text" value={entry.endDate} onChange={e => store.updateWork(entry.id, 'endDate', e.target.value)} className="input-field" placeholder="Present" />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label-sm">Achievement Bullets</label>
                  {entry.bullets.map((b, bi) => (
                    <div key={bi} className="bullet-row">
                      <span className="bullet-marker">▸</span>
                      <input type="text" value={b} onChange={e => store.updateBullet(entry.id, bi, e.target.value)} className="input-field bullet-input" placeholder="Accomplished X by doing Y, resulting in Z..." />
                      {entry.bullets.length > 1 && <button type="button" onClick={() => store.removeBullet(entry.id, bi)} className="bullet-remove"><X size={12} /></button>}
                    </div>
                  ))}
                  <button type="button" onClick={() => store.addBullet(entry.id)} className="add-inline-btn"><Plus size={14} /> Add bullet</button>
                  <button type="button" onClick={() => handleRewriteBullets(entry.id, entry)} disabled={bulletLoading === entry.id} className="ai-autofill-btn" style={{ marginLeft: '1rem', marginTop: '0.2rem' }}>
                    {bulletLoading === entry.id ? <><Loader2 size={13} className="spin-icon" /> Rewriting...</> : <><Sparkles size={13} /> AI Rewrite (XYZ)</>}
                  </button>
                  {entry.jobTitle && (
                    <button type="button" onClick={() => handleGenerateRoleBullets(entry.id, entry.jobTitle)} disabled={bulletLoading === entry.id + '_generate'} className="ai-autofill-btn" style={{ marginLeft: '0.5rem', marginTop: '0.2rem', borderColor: 'var(--secondary)', color: 'var(--secondary)' }}>
                      {bulletLoading === entry.id + '_generate' ? <><Loader2 size={13} className="spin-icon" /> Thinking...</> : <><Sparkles size={13} /> Generate Ideas</>}
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button type="button" onClick={store.addWorkEntry} className="btn-secondary full-width"><Plus size={16} /> Add Work Experience</button>
          </div>
        )}

        {/* === STEP 5: Projects === */}
        {step === 5 && (
          <div className="step-content animate-fade-in">
            {data.projects.length === 0 && (
              <div className="empty-section-hint">
                <Globe size={24} color="var(--primary)" style={{ opacity: 0.4 }} />
                <p>No projects yet. Add your notable projects to stand out.</p>
              </div>
            )}
            {data.projects.map((proj, idx) => (
              <div key={proj.id} className="entry-card">
                <div className="entry-card-header">
                  <span className="entry-card-number">#{idx + 1}</span>
                  <button type="button" onClick={() => store.removeProject(proj.id)} className="entry-remove-btn"><Trash2 size={14} /></button>
                </div>
                <div className="form-grid">
                  <div className="input-group">
                    <label className="input-label-sm">Project Name</label>
                    <input type="text" value={proj.name} onChange={e => store.updateProject(proj.id, 'name', e.target.value)} className="input-field" placeholder="AI Resume Builder" />
                  </div>
                  <div className="input-group">
                    <label className="input-label-sm">Tech Stack</label>
                    <input type="text" value={proj.techStack} onChange={e => store.updateProject(proj.id, 'techStack', e.target.value)} className="input-field" placeholder="React, Next.js, Python" />
                  </div>
                </div>
                <div className="input-group">
                  <div className="label-row">
                    <label className="input-label-sm">Description</label>
                    <button type="button" onClick={() => handleRewriteProjectDesc(proj.id, proj.description)} disabled={loadingSuggestion === proj.id || !proj.description} className="ai-autofill-btn" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                      {loadingSuggestion === proj.id ? <><Loader2 size={12} className="spin-icon" /> Rewriting...</> : <><Sparkles size={12} /> AI Rewrite</>}
                    </button>
                  </div>
                  <textarea value={proj.description} onChange={e => store.updateProject(proj.id, 'description', e.target.value)} className="input-field" rows={2} placeholder="Built a full-stack application that..." />
                </div>
                <div className="input-group">
                  <label className="input-label-sm">Link</label>
                  <input type="url" value={proj.link} onChange={e => store.updateProject(proj.id, 'link', e.target.value)} className="input-field" placeholder="https://github.com/..." />
                </div>
              </div>
            ))}
            <button type="button" onClick={store.addProject} className="btn-secondary full-width"><Plus size={16} /> Add Project</button>
          </div>
        )}

        {/* === STEP 6: Education === */}
        {step === 6 && (
          <div className="step-content animate-fade-in">
            {data.education.map((edu, idx) => (
              <div key={edu.id} className="entry-card">
                <div className="entry-card-header">
                  <span className="entry-card-number">#{idx + 1}</span>
                  {data.education.length > 1 && <button type="button" onClick={() => store.removeEducation(edu.id)} className="entry-remove-btn"><Trash2 size={14} /></button>}
                </div>
                <div className="form-grid">
                  <div className="input-group">
                    <label className="input-label-sm">Degree / Program</label>
                    <input type="text" value={edu.degree} onChange={e => store.updateEducation(edu.id, 'degree', e.target.value)} className="input-field" placeholder="B.S. Computer Science" />
                  </div>
                  <div className="input-group">
                    <label className="input-label-sm">Institution</label>
                    <input type="text" value={edu.institution} onChange={e => store.updateEducation(edu.id, 'institution', e.target.value)} className="input-field" placeholder="Stanford University" />
                  </div>
                </div>
                <div className="form-grid form-grid-3">
                  <div className="input-group">
                    <label className="input-label-sm">Year</label>
                    <input type="text" value={edu.year} onChange={e => store.updateEducation(edu.id, 'year', e.target.value)} className="input-field" placeholder="2020" />
                  </div>
                  <div className="input-group">
                    <label className="input-label-sm">GPA (optional)</label>
                    <input type="text" value={edu.gpa} onChange={e => store.updateEducation(edu.id, 'gpa', e.target.value)} className="input-field" placeholder="3.9/4.0" />
                  </div>
                  <div className="input-group">
                    <label className="input-label-sm">Coursework (optional)</label>
                    <input type="text" value={(edu as any).coursework || ''} onChange={e => store.updateEducation(edu.id, 'coursework' as any, e.target.value)} className="input-field" placeholder="Data Structures, ML, Databases" />
                  </div>
                </div>
              </div>
            ))}
            <button type="button" onClick={store.addEducation} className="btn-secondary full-width"><Plus size={16} /> Add Education</button>
          </div>
        )}

        {/* === STEP 7: Review & Generate === */}
        {step === 7 && (
          <div className="step-content animate-fade-in">
            {/* Summary */}
            <div className="input-group">
              <div className="label-row">
                <label className="input-label"><Sparkles size={14} /> Professional Summary</label>
                <button type="button" onClick={generateSummary} disabled={summaryLoading} className="ai-autofill-btn">
                  {summaryLoading ? <><Loader2 size={13} className="spin-icon" /> Generating...</> : <><Sparkles size={13} /> AI Auto-fill</>}
                </button>
              </div>
              <textarea value={data.summary} onChange={e => store.updateField('summary', e.target.value)} className="input-field" rows={3} placeholder="A results-driven software engineer with 5+ years..." />
              <p className="field-hint">Click &quot;AI Auto-fill&quot; to generate from your data, or write your own.</p>
            </div>

            {/* Certifications */}
            <div className="input-group">
              <label className="input-label"><Award size={14} /> Certifications</label>
              <div className="skill-input-row">
                <input type="text" value={certInput} onChange={e => setCertInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddChip('certifications', certInput, setCertInput); } }}
                  className="input-field" placeholder="AWS Certified Solutions Architect" />
                <button type="button" onClick={() => handleAddChip('certifications', certInput, setCertInput)} className="btn-icon"><Plus size={16} /></button>
              </div>
              {data.certifications.length > 0 && (
                <div className="skill-chips">{data.certifications.map((c, i) => (
                  <span key={i} className="skill-chip cert-chip">{c}<button type="button" onClick={() => store.removeChip('certifications', i)} className="chip-remove"><X size={11} /></button></span>
                ))}</div>
              )}
            </div>

            {/* Languages */}
            <div className="input-group">
              <label className="input-label"><Languages size={14} /> Languages</label>
              <div className="skill-input-row">
                <input type="text" value={langInput} onChange={e => setLangInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddChip('languages', langInput, setLangInput); } }}
                  className="input-field" placeholder="English (Native), Hindi (Fluent)" />
                <button type="button" onClick={() => handleAddChip('languages', langInput, setLangInput)} className="btn-icon"><Plus size={16} /></button>
              </div>
              {data.languages.length > 0 && (
                <div className="skill-chips">{data.languages.map((l, i) => (
                  <span key={i} className="skill-chip lang-chip">{l}<button type="button" onClick={() => store.removeChip('languages', i)} className="chip-remove"><X size={11} /></button></span>
                ))}</div>
              )}
            </div>

            {/* Template Selector */}
            <div className="input-group">
              <label className="input-label">Resume Template</label>
              <div className="template-grid">
                {TEMPLATES.map(t => (
                  <button key={t.id} type="button" className={`template-card ${data.template === t.id ? 'active' : ''}`} onClick={() => store.updateField('template', t.id)}>
                    <span className="template-card-name">{t.name}</span>
                    <span className="template-card-desc">{t.desc}</span>
                    {data.template === t.id && <Check size={16} className="template-check" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="step-nav" style={{ alignItems: 'center' }}>
          {step > 0 && <button type="button" onClick={prevStep} className="btn-secondary"><ChevronLeft size={16} /> Back</button>}
          
          <div style={{ flex: 1 }} />
          
          {step > 0 && (
            <button 
              type="button" 
              onClick={() => setShowConfirmReset(true)}
              className="btn-secondary" 
              title="Clear all text and start over"
              style={{ color: 'var(--error)', borderColor: 'rgba(239,68,68,0.3)', marginRight: '1rem', padding: '0.6rem 0.75rem' }}
            >
              <RefreshCcw size={16} /> <span className="hide-on-mobile">Start Fresh</span>
            </button>
          )}
          {step > 0 && !isLastStep && <button type="button" onClick={nextStep} disabled={!canProceed(step)} className="btn-primary">Next <ChevronRight size={16} /></button>}
          
          {isLastStep && (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" onClick={handleGenerateCoverLetter} disabled={coverLetterLoading || !canProceed(1)} className="btn-secondary generate-btn" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
                {coverLetterLoading ? <><Loader2 size={16} className="spin-icon" /> Generating...</> : <><Sparkles size={16} /> Cover Letter</>}
              </button>
              <button type="submit" disabled={isLoading || !canProceed(1) || !canProceed(2)} className="btn-primary generate-btn">
                {isLoading ? <><Loader2 size={16} className="spin-icon" /> Generating...</> : <><Send size={16} /> Generate Resume</>}
              </button>
            </div>
          )}
        </div>

        {coverLetter && (
          <div className="input-group animate-fade-in" style={{ marginTop: '1.5rem', padding: '1.5rem', background: 'rgba(139, 92, 246, 0.05)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--accent)', fontSize: '1.1rem' }}>
              <Sparkles size={18} /> Generated Cover Letter
            </h3>
            <textarea value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} className="input-field jd-textarea" style={{ minHeight: '300px', cursor: 'text' }} />
            <p className="field-hint" style={{ marginTop: '0.5rem' }}>You can directly edit this cover letter before copying.</p>
          </div>
        )}
      </form>

      {/* Custom Confirm Reset Modal */}
      {showConfirmReset && (
        <div className="resume-modal-overlay">
          <div className="resume-modal-content" style={{ maxWidth: '450px', padding: '2rem', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--error)' }}>Start Fresh?</h3>
            <p style={{ marginBottom: '2rem', color: 'var(--text-muted)' }}>
              Are you sure you want to clear all form data and start a new resume from scratch? This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button type="button" onClick={() => setShowConfirmReset(false)} className="btn-secondary">
                Cancel
              </button>
              <button 
                type="button" 
                onClick={() => {
                  store.resetForm();
                  setCoverLetter(null);
                  setShowConfirmReset(false);
                }} 
                className="btn-primary"
                style={{ background: 'var(--error)', borderColor: 'var(--error)' }}
              >
                Yes, Clear Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
