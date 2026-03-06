'use client';

import React, { useState, useCallback, useRef } from 'react';
import {
  Send, Upload, Sparkles, ChevronRight, ChevronLeft, Check, Loader2, RefreshCcw,
  User, Target, Code, Briefcase, Globe, GraduationCap, X, Plus, Award, Languages, FileText,
  BarChart3, AlertTriangle, CheckCircle2, Shield, Zap, ChevronDown, ChevronUp
} from 'lucide-react';
import { ResumeData, ResumeTemplate, WorkEntry } from '@/types/resume';
import { useResumeStore } from '@/store/useResumeStore';
import { DebouncedInput } from '@/components/DebouncedInput';
import { PersonalSection } from '@/components/form/PersonalSection';
import { TargetAndSkillsSection } from '@/components/form/TargetAndJDSection';
import { ExperienceSection } from '@/components/form/ExperienceSection';
import { ProjectsSection } from '@/components/form/ProjectsSection';
import { EducationSection } from '@/components/form/EducationSection';
import { resumeSchema } from '@/lib/validations/resume';

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
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Resume readiness review
  const [reviewResult, setReviewResult] = useState<any>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [fixingType, setFixingType] = useState<string | null>(null);
  const [showBulletDetails, setShowBulletDetails] = useState(false);

  // Upload
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Skill input local states
  const [skillInput, setSkillInput] = useState('');
  const [certInput, setCertInput] = useState('');
  const [langInput, setLangInput] = useState('');

  // Image upload
  const profileImageRef = useRef<HTMLInputElement>(null);

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
  
  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      const res = await fetch('/api/resumes', {
        method: store.currentResumeId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: store.currentResumeId, 
          title: `${data.targetRole || 'Untitled'} Resume`, 
          data: data,
          markdown: '# Generated' // Placeholder since we now use structured JSON
        }),
      });
      const result = await res.json();
      if (result.resume?.id) {
        store.setCurrentResumeId(result.resume.id);
        alert('Resume draft saved successfully!');
      }
    } catch (err) {
      console.error('Failed to save draft:', err);
      alert('Failed to save draft.');
    } finally {
      setIsSavingDraft(false);
    }
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

  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be smaller than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      store.updatePersonal('profileImage', reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    const result = resumeSchema.safeParse(data);
    if (!result.success) {
      const formattedErrors = result.error.format();
      const newErrors: Record<string, string[]> = {};
      
      // Personal
      if (formattedErrors.personal) {
        newErrors['Personal Details'] = [];
        if (formattedErrors.personal.fullName) newErrors['Personal Details'].push(...formattedErrors.personal.fullName._errors);
        if (formattedErrors.personal.email) newErrors['Personal Details'].push(...formattedErrors.personal.email._errors);
      }
      // Target Role
      if (formattedErrors.targetRole) {
         newErrors['Target & JD'] = newErrors['Target & JD'] || [];
         newErrors['Target & JD'].push(...formattedErrors.targetRole._errors);
      }
      // Experience
      if (formattedErrors.experience) {
        newErrors['Experience'] = ['Some work entries are missing required fields (Company, Title, Dates) or bullets are too short.'];
      }
      // Education
      if (formattedErrors.education) {
        newErrors['Education'] = ['Some education entries are missing required fields (Institution, Degree, Year).'];
      }
      // Projects
      if (formattedErrors.projects) {
        newErrors['Projects'] = ['Some projects are missing required fields (Name, Tech Stack, Description).'];
      }

      if (Object.keys(newErrors).length > 0) {
        setValidationErrors(newErrors);
        alert('Please fix the validation errors before generating.');
        return;
      }
    }

    onSubmit(data);
  };

  const handleReviewReadiness = async () => {
    setReviewLoading(true);
    setReviewResult(null);
    try {
      const res = await fetch('/api/resume-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok) {
        setReviewResult(result);
      }
    } catch { /* silent */ }
    setReviewLoading(false);
  };

  const handleAutoFix = async (fixType: string) => {
    setFixingType(fixType);
    try {
      const res = await fetch('/api/resume-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fixType, data }),
      });
      const result = await res.json();
      if (!res.ok) { setFixingType(null); return; }

      if (fixType === 'bullets' && result.fixedExperience) {
        const fixedList = result.fixedExperience;
        for (let i = 0; i < fixedList.length; i++) {
          const fixed = fixedList[i];
          if (!Array.isArray(fixed.bullets) || fixed.bullets.length === 0) continue;
          // Try by ID first, fall back to index matching
          const byId = data.experience.find((e: any) => e.id === fixed.id);
          const target = byId || data.experience[i];
          if (target) {
            store.updateWork(target.id, 'bullets', fixed.bullets);
          }
        }
      }
      if (fixType === 'summary' && result.summary) {
        store.updateField('summary', result.summary);
      }
      if (fixType === 'projects' && result.fixedProjects) {
        const fixedList = result.fixedProjects;
        for (let i = 0; i < fixedList.length; i++) {
          const fixed = fixedList[i];
          if (!fixed.description) continue;
          const byId = data.projects.find((p: any) => p.id === fixed.id);
          const target = byId || data.projects[i];
          if (target) {
            store.updateProject(target.id, 'description', fixed.description);
          }
        }
      }

      // Re-run readiness check after fix (delay for store updates)
      setTimeout(() => handleReviewReadiness(), 800);
    } catch { /* silent */ }
    setFixingType(null);
  };

  const handleApplyAllFixes = async () => {
    setFixingType('all');
    const fixTypes: string[] = [];
    if (reviewResult?.sectionChecks) {
      for (const s of reviewResult.sectionChecks) {
        if (s.fixable && s.fixType && !fixTypes.includes(s.fixType)) {
          fixTypes.push(s.fixType);
        }
      }
    }
    if (reviewResult?.bulletIssues?.length > 0 && !fixTypes.includes('bullets')) {
      fixTypes.push('bullets');
    }
    for (const ft of fixTypes) {
      setFixingType(ft);
      await handleAutoFix(ft);
    }
    setFixingType(null);
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
    <div className="p-6 bg-card text-card-foreground shadow-lg rounded-xl border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border shadow-sm rounded-xl animate-fade-in">
      {step > 0 && (
        <div className="relative h-1.5 w-full bg-muted rounded-full mb-6 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 rounded-full" style={{ width: `${progress}%` }} />
          <span className="absolute right-0 -top-5 text-xs font-bold text-primary opacity-80">{progress}%</span>
        </div>
      )}

      <div className="flex gap-1 mb-8 overflow-x-auto pb-1 hide-scrollbar">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <button key={s.id} className={`flex flex-col flex-1 min-w-[56px] items-center gap-1.5 p-2 rounded-md transition-all cursor-pointer hover:bg-muted/50 ${step === i ? "bg-primary/10" : ""}`} onClick={() => setStep(i)} type="button">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all shadow-sm ${step === i ? "bg-primary text-primary-foreground border-primary shadow-md" : step > i ? "bg-emerald-500 text-white border-emerald-500" : "bg-background text-muted-foreground border-input"}`}>{step > i ? <Check size={12} /> : <Icon size={12} />}</div>
              <span className={`text-[0.7rem] font-medium whitespace-nowrap transition-colors ${step === i ? "text-primary font-bold" : "text-muted-foreground"}`}>{s.title}</span>
            </button>
          );
        })}
      </div>

      <div className="mb-6 mt-2">
        <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight mb-2">{React.createElement(STEPS[step].icon, { size: 20, color: 'var(--primary)' })} {STEPS[step].title}</h2>
        <p className="text-sm text-muted-foreground">{STEPS[step].desc}</p>
      </div>

      <form onSubmit={handleSubmit}>

        {/* === STEP 0: Upload === */}
        {step === 0 && (
          <div className="animate-fade-in">
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer transition-colors bg-muted/30 hover:bg-muted/50 hover:border-primary flex flex-col items-center gap-3" onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
              onDragLeave={e => e.currentTarget.classList.remove('drag-over')}
              onDrop={handleDrop}>
              {isUploading ? <Loader2 size={36} className="spin-icon" color="var(--primary)" /> : <div className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer transition-colors bg-muted/30 hover:bg-muted/50 hover:border-primary flex flex-col items-center gap-3-icon-wrap"><Upload size={28} /></div>}
              <p className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer transition-colors bg-muted/30 hover:bg-muted/50 hover:border-primary flex flex-col items-center gap-3-title">{isUploading ? 'Parsing...' : 'Drop your resume here'}</p>
              <p className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer transition-colors bg-muted/30 hover:bg-muted/50 hover:border-primary flex flex-col items-center gap-3-sub">PDF, DOCX, TXT, or MD</p>
              {uploadedFile && !isUploading && <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-sm font-medium mt-2"><FileText size={12} /> {uploadedFile}</div>}
              <input ref={fileRef} type="file" accept=".txt,.md,.pdf,.docx" onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); }} style={{ display: 'none' }} />
            </div>
            {uploadMsg && <div className={`upload-message animate-fade-in ${uploadMsg.startsWith('✅') ? 'success' : 'error'}`}>{uploadMsg}</div>}
            <div className="flex items-center gap-4 my-6 text-sm text-muted-foreground uppercase tracking-widest before:flex-1 before:h-px before:bg-border after:flex-1 after:h-px after:bg-border"><span>OR</span></div>
            <button type="button" onClick={nextStep} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 full-width"><FileText size={16} /> Start from Scratch</button>
          </div>
        )}

        {/* === STEP 1: Personal === */}
        {step === 1 && <PersonalSection />}

        {/* === STEP 2: Target & JD === */}
        {step === 2 && (
          <div className="flex flex-col gap-6 animate-in fade-in-50 duration-500 animate-fade-in">
            <TargetAndSkillsSection
              loadingSuggestion={loadingSuggestion}
              fetchSuggestion={fetchSuggestion}
              handleAddChip={handleAddChip}
              onSkillsChange={onSkillsChange}
              SuggestionBubble={SuggestionBubble}
              skillInput={skillInput}
              setSkillInput={setSkillInput}
            />
          </div>
        )}

        {/* === STEP 3: Skills === */}
        {step === 3 && (
          <div className="flex flex-col gap-6 animate-in fade-in-50 duration-500 animate-fade-in">
            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"><Code size={14} /> Skills {loadingSuggestion === 'skills' && <Loader2 size={13} className="spin-icon inline-loader" />}</label>
                <button type="button" onClick={() => fetchSuggestion('skills', data.targetRole || data.skills.join(', ') || 'general')} disabled={loadingSuggestion === 'skills'} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-accent text-accent hover:bg-accent/10 h-8 px-3 gap-1.5" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                  {loadingSuggestion === 'skills' ? <><Loader2 size={12} className="spin-icon" /> Suggesting...</> : <><Sparkles size={12} /> AI Suggest Skills</>}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <DebouncedInput type="text" value={skillInput} onChangeValue={val => setSkillInput(val)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); handleAddChip('skills', skillInput, setSkillInput); onSkillsChange(); } }}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="Type a skill and press Enter" delay={10} />
                <button type="button" onClick={() => { handleAddChip('skills', skillInput, setSkillInput); onSkillsChange(); }} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10 shrink-0"><Plus size={16} /></button>
              </div>
              {data.skills.length > 0 && (
                <div className="skill-chips">
                  {data.skills.map((s, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20">{s}<button type="button" onClick={() => store.removeChip('skills', i)} className="opacity-50 hover:opacity-100 transition-opacity focus:outline-none"><X size={11} /></button></span>
                  ))}
                </div>
              )}
              <SuggestionBubble field="skills" />
              {data.jobDescription && (
                <button type="button" onClick={() => fetchSuggestion('skills', `Extract the most important technical skills and keywords from this JD: ${data.jobDescription.substring(0, 500)}`)} disabled={loadingSuggestion === 'skills'} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-accent text-accent hover:bg-accent/10 h-8 px-3 gap-1.5" style={{ marginTop: '0.5rem', borderColor: 'var(--secondary)', color: 'var(--secondary)' }}>
                  <Target size={13} /> Extract Skills from JD
                </button>
              )}
            </div>
          </div>
        )}

        {/* === STEP 4: Experience === */}
        {step === 4 && (
          <ExperienceSection 
             handleRewriteBullets={handleRewriteBullets} 
             handleGenerateRoleBullets={handleGenerateRoleBullets} 
             bulletLoading={bulletLoading} 
          />
        )}

        {/* === STEP 5: Projects === */}
        {step === 5 && (
          <ProjectsSection 
            handleRewriteProjectDesc={handleRewriteProjectDesc}
            loadingSuggestion={loadingSuggestion}
          />
        )}

        {/* === STEP 6: Education === */}
        {step === 6 && <EducationSection />}

        {/* === STEP 7: Review & Generate === */}
        {step === 7 && (
          <div className="flex flex-col gap-6 animate-in fade-in-50 duration-500 animate-fade-in">
            {/* Summary */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"><Sparkles size={14} /> Professional Summary</label>
                <button type="button" onClick={generateSummary} disabled={summaryLoading} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-accent text-accent hover:bg-accent/10 h-8 px-3 gap-1.5">
                  {summaryLoading ? <><Loader2 size={13} className="spin-icon" /> Generating...</> : <><Sparkles size={13} /> AI Auto-fill</>}
                </button>
              </div>
              <textarea value={data.summary} onChange={e => store.updateField('summary', e.target.value)} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" rows={3} placeholder="A results-driven software engineer with 5+ years..." />
              <p className="text-[0.85rem] text-muted-foreground italic">Click &quot;AI Auto-fill&quot; to generate from your data, or write your own.</p>
            </div>

            {/* Template Selector */}
            <div className="grid gap-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"><FileText size={14} /> Resume Template</label>
              <p className="text-[0.85rem] text-muted-foreground italic" style={{ marginBottom: '0.6rem' }}>Choose a layout for your resume. The preview updates instantly.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                {([
                  {
                    id: 'professional' as const,
                    name: 'Professional',
                    desc: 'Classic ATS-friendly layout',
                    color: '#334155',
                    preview: (
                      <div style={{ padding: '6px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div style={{ height: '6px', width: '60%', margin: '0 auto', background: '#334155', borderRadius: '1px' }} />
                        <div style={{ height: '2px', width: '80%', margin: '0 auto', background: '#94a3b8' }} />
                        <div style={{ height: '1px', background: '#cbd5e1', margin: '3px 0' }} />
                        <div style={{ height: '3px', width: '40%', background: '#334155', borderRadius: '1px' }} />
                        <div style={{ height: '2px', width: '90%', background: '#e2e8f0' }} />
                        <div style={{ height: '2px', width: '85%', background: '#e2e8f0' }} />
                        <div style={{ height: '2px', width: '88%', background: '#e2e8f0' }} />
                        <div style={{ height: '1px', background: '#cbd5e1', margin: '2px 0' }} />
                        <div style={{ height: '3px', width: '35%', background: '#334155', borderRadius: '1px' }} />
                        <div style={{ height: '2px', width: '92%', background: '#e2e8f0' }} />
                        <div style={{ height: '2px', width: '80%', background: '#e2e8f0' }} />
                      </div>
                    ),
                  },
                  {
                    id: 'modern' as const,
                    name: 'Modern',
                    desc: 'Two-column with accent colors',
                    color: '#7c3aed',
                    preview: (
                      <div style={{ padding: '6px', display: 'flex', gap: '4px' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <div style={{ height: '6px', width: '80%', background: '#7c3aed', borderRadius: '1px' }} />
                          <div style={{ height: '2px', width: '60%', background: '#94a3b8' }} />
                          <div style={{ height: '2px', background: '#7c3aed', margin: '2px 0', opacity: 0.3 }} />
                          <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-start' }}>
                            <div style={{ width: '2px', height: '20px', background: '#e2e8f0', flexShrink: 0, marginTop: '1px' }} />
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <div style={{ height: '2px', width: '70%', background: '#334155' }} />
                              <div style={{ height: '2px', width: '90%', background: '#e2e8f0' }} />
                              <div style={{ height: '2px', width: '80%', background: '#e2e8f0' }} />
                            </div>
                          </div>
                        </div>
                        <div style={{ width: '30%', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <div style={{ height: '3px', width: '80%', background: '#7c3aed', borderRadius: '1px' }} />
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                            <div style={{ height: '4px', width: '45%', background: '#f1f5f9', borderRadius: '1px' }} />
                            <div style={{ height: '4px', width: '35%', background: '#f1f5f9', borderRadius: '1px' }} />
                            <div style={{ height: '4px', width: '50%', background: '#f1f5f9', borderRadius: '1px' }} />
                          </div>
                        </div>
                      </div>
                    ),
                  },
                  {
                    id: 'minimal' as const,
                    name: 'Minimal',
                    desc: 'Clean monospace, no-frills',
                    color: '#0f172a',
                    preview: (
                      <div style={{ padding: '6px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div style={{ height: '5px', width: '50%', background: '#0f172a', borderRadius: '0' }} />
                        <div style={{ height: '2px', background: '#0f172a', marginBottom: '2px' }} />
                        <div style={{ height: '2px', width: '70%', background: '#94a3b8' }} />
                        <div style={{ height: '8px', width: '30%', background: '#0f172a', marginTop: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '4px', color: 'white', fontWeight: 700 }}>SKILLS</span>
                        </div>
                        <div style={{ height: '2px', width: '85%', background: '#e2e8f0' }} />
                        <div style={{ height: '8px', width: '35%', background: '#0f172a', marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '4px', color: 'white', fontWeight: 700 }}>EXP</span>
                        </div>
                        <div style={{ height: '2px', width: '90%', background: '#e2e8f0' }} />
                        <div style={{ height: '2px', width: '75%', background: '#e2e8f0' }} />
                      </div>
                    ),
                  },
                ] as const).map(tmpl => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => store.updateField('template', tmpl.id)}
                    style={{
                      position: 'relative',
                      border: data.template === tmpl.id ? `2px solid ${tmpl.color}` : '2px solid var(--surface-border)',
                      borderRadius: 'var(--radius-md)',
                      background: data.template === tmpl.id ? `${tmpl.color}08` : 'var(--surface)',
                      padding: '0',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      transition: 'all 0.2s ease',
                      textAlign: 'left',
                    }}
                  >
                    {/* Mini preview illustration */}
                    <div style={{
                      background: 'white',
                      borderBottom: '1px solid var(--surface-border)',
                      minHeight: '65px',
                    }}>
                      {tmpl.preview}
                    </div>
                    {/* Label */}
                    <div style={{ padding: '0.5rem 0.6rem' }}>
                      <p style={{
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: data.template === tmpl.id ? tmpl.color : 'var(--foreground)',
                        marginBottom: '0.1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}>
                        {data.template === tmpl.id && <Check size={13} style={{ color: tmpl.color }} />}
                        {tmpl.name}
                      </p>
                      <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{tmpl.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Certifications */}
            <div className="grid gap-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"><Award size={14} /> Certifications</label>
              <div className="flex items-center gap-2">
                <input type="text" value={certInput} onChange={e => setCertInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddChip('certifications', certInput, setCertInput); } }}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="AWS Certified Solutions Architect" />
                <button type="button" onClick={() => handleAddChip('certifications', certInput, setCertInput)} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10 shrink-0"><Plus size={16} /></button>
              </div>
              {data.certifications.length > 0 && (
                <div className="skill-chips">{data.certifications.map((c, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-accent/10 text-accent hover:bg-accent/20">{c}<button type="button" onClick={() => store.removeChip('certifications', i)} className="opacity-50 hover:opacity-100 transition-opacity focus:outline-none"><X size={11} /></button></span>
                ))}</div>
              )}
            </div>

            {/* Languages */}
            <div className="grid gap-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"><Languages size={14} /> Languages</label>
              <div className="flex items-center gap-2">
                <input type="text" value={langInput} onChange={e => setLangInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddChip('languages', langInput, setLangInput); } }}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="English (Native), Hindi (Fluent)" />
                <button type="button" onClick={() => handleAddChip('languages', langInput, setLangInput)} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10 shrink-0"><Plus size={16} /></button>
              </div>
              {data.languages.length > 0 && (
                <div className="skill-chips">{data.languages.map((l, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary/10 text-secondary hover:bg-secondary/20">{l}<button type="button" onClick={() => store.removeChip('languages', i)} className="opacity-50 hover:opacity-100 transition-opacity focus:outline-none"><X size={11} /></button></span>
                ))}</div>
              )}
            </div>

            {/* Resume Readiness Check */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"><BarChart3 size={14} /> Resume Readiness Check</label>
                <button type="button" onClick={handleReviewReadiness} disabled={reviewLoading} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-accent text-accent hover:bg-accent/10 h-8 px-3 gap-1.5">
                  {reviewLoading ? <><Loader2 size={13} className="spin-icon" /> Analyzing...</> : <><Shield size={13} /> Check Readiness</>}
                </button>
              </div>
              <p className="text-[0.85rem] text-muted-foreground italic">Free ATS analysis with detailed breakdown. No credits charged.</p>

              {reviewResult && (
                <div className="animate-fade-in" style={{ marginTop: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', overflow: 'hidden' }}>

                  {/* Score Header */}
                  <div style={{ padding: '1rem 1.25rem', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--surface-border)' }}>
                    <div style={{
                      width: '60px', height: '60px', borderRadius: '50%',
                      background: `conic-gradient(${reviewResult.projectedScore >= 70 ? '#10b981' : reviewResult.projectedScore >= 50 ? '#f59e0b' : '#ef4444'} ${reviewResult.projectedScore * 3.6}deg, var(--surface-border) 0deg)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '1.05rem', color: reviewResult.projectedScore >= 70 ? '#10b981' : reviewResult.projectedScore >= 50 ? '#f59e0b' : '#ef4444' }}>{reviewResult.projectedScore}%</span>
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--foreground)', marginBottom: '0.15rem' }}>Projected ATS Score</p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {reviewResult.projectedScore >= 70 ? 'Strong resume! Ready to generate.' : reviewResult.projectedScore >= 50 ? 'Good start — apply fixes below to boost your score.' : 'Needs improvement — fix the issues below.'}
                      </p>
                    </div>
                    {reviewResult.canAutoFix && (
                      <button type="button" onClick={handleApplyAllFixes} disabled={!!fixingType} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2" style={{ fontSize: '0.78rem', padding: '0.5rem 0.85rem', whiteSpace: 'nowrap' }}>
                        {fixingType ? <><Loader2 size={13} className="spin-icon" /> Fixing...</> : <><Zap size={13} /> Apply All Fixes</>}
                      </button>
                    )}
                  </div>

                  {/* Component Score Bars */}
                  <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--surface-border)' }}>
                    <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Score Breakdown</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                      {[
                        { label: 'Keywords', score: reviewResult.keywordScore, w: '35%' },
                        { label: 'Sections', score: reviewResult.sectionScore, w: '20%' },
                        { label: 'Bullets', score: reviewResult.bulletScore, w: '15%' },
                        { label: 'Readability', score: reviewResult.readabilityScore, w: '15%' },
                        { label: 'Format', score: reviewResult.formatScore, w: '15%' },
                      ].map(c => (
                        <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
                          <span style={{ width: '75px', color: 'var(--text-muted)', flexShrink: 0 }}>{c.label} <span style={{ opacity: 0.6 }}>({c.w})</span></span>
                          <div style={{ flex: 1, height: '5px', borderRadius: '3px', background: 'var(--surface-border)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${c.score}%`, background: c.score >= 70 ? '#10b981' : c.score >= 50 ? '#f59e0b' : '#ef4444', borderRadius: '3px', transition: 'width 0.5s ease' }} />
                          </div>
                          <span style={{ fontWeight: 700, width: '28px', textAlign: 'right', fontSize: '0.73rem', color: c.score >= 70 ? '#10b981' : c.score >= 50 ? '#f59e0b' : '#ef4444' }}>{c.score}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section-by-Section Audit */}
                  {reviewResult.sectionChecks && (
                    <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--surface-border)' }}>
                      <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Section Audit</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        {reviewResult.sectionChecks.map((s: any, i: number) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', padding: '0.3rem 0' }}>
                            <span style={{ flexShrink: 0 }}>
                              {s.status === 'pass' ? <CheckCircle2 size={14} style={{ color: '#10b981' }} /> : s.status === 'warn' ? <AlertTriangle size={14} style={{ color: '#f59e0b' }} /> : <AlertTriangle size={14} style={{ color: '#ef4444' }} />}
                            </span>
                            <span style={{ width: '120px', fontWeight: 500, color: 'var(--foreground)', flexShrink: 0 }}>{s.name}</span>
                            <span style={{ flex: 1, color: 'var(--text-muted)', fontSize: '0.73rem' }}>{s.detail}</span>
                            {s.fixable && s.fixType && (
                              <button type="button" onClick={() => handleAutoFix(s.fixType)} disabled={!!fixingType}
                                style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', border: '1px solid var(--primary)', borderRadius: '4px', background: 'transparent', color: 'var(--primary)', cursor: 'pointer', whiteSpace: 'nowrap', opacity: fixingType ? 0.5 : 1 }}
                              >
                                {fixingType === s.fixType ? <Loader2 size={11} className="spin-icon" /> : <><Zap size={11} /> Fix</>}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bullet Quality Stats */}
                  {reviewResult.bulletStats && reviewResult.bulletStats.total > 0 && (
                    <div style={{ padding: '0.75rem 1.25rem', borderBottom: reviewResult.bulletIssues?.length > 0 ? '1px solid var(--surface-border)' : 'none' }}>
                      <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Bullet Quality</p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                        {[
                          { label: 'Total', value: reviewResult.bulletStats.total, color: 'var(--foreground)' },
                          { label: 'Action Verb', value: `${reviewResult.bulletStats.withActionVerb}/${reviewResult.bulletStats.total}`, color: reviewResult.bulletStats.withActionVerb >= reviewResult.bulletStats.total * 0.8 ? '#10b981' : '#f59e0b' },
                          { label: 'With Metrics', value: `${reviewResult.bulletStats.withMetrics}/${reviewResult.bulletStats.total}`, color: reviewResult.bulletStats.withMetrics >= reviewResult.bulletStats.total * 0.5 ? '#10b981' : '#ef4444' },
                          { label: 'Avg Length', value: `${reviewResult.bulletStats.avgLength}ch`, color: reviewResult.bulletStats.avgLength >= 50 && reviewResult.bulletStats.avgLength <= 150 ? '#10b981' : '#f59e0b' },
                        ].map(s => (
                          <div key={s.label} style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '1rem', fontWeight: 700, color: s.color }}>{s.value}</p>
                            <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{s.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Per-Bullet Issues */}
                  {reviewResult.bulletIssues && reviewResult.bulletIssues.length > 0 && (
                    <div style={{ padding: '0.75rem 1.25rem' }}>
                      <button type="button" onClick={() => setShowBulletDetails(!showBulletDetails)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: 600, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        {showBulletDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        {reviewResult.bulletIssues.length} Bullet Issue{reviewResult.bulletIssues.length !== 1 ? 's' : ''} Found
                      </button>
                      {showBulletDetails && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          {reviewResult.bulletIssues.map((bi: any, i: number) => (
                            <div key={i} style={{ padding: '0.5rem 0.6rem', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
                              <p style={{ fontSize: '0.75rem', color: 'var(--foreground)', marginBottom: '0.25rem', fontStyle: 'italic' }}>"{bi.bullet}"</p>
                              {bi.issues.map((issue: string, j: number) => (
                                <p key={j} style={{ fontSize: '0.72rem', color: '#f59e0b', paddingLeft: '0.5rem' }}>→ {issue}</p>
                              ))}
                            </div>
                          ))}
                          <button type="button" onClick={() => handleAutoFix('bullets')} disabled={!!fixingType}
                            style={{ alignSelf: 'flex-start', fontSize: '0.75rem', padding: '0.35rem 0.7rem', border: '1px solid var(--primary)', borderRadius: '6px', background: 'transparent', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.25rem' }}
                          >
                            {fixingType === 'bullets' ? <><Loader2 size={12} className="spin-icon" /> Rewriting...</> : <><Zap size={12} /> Fix All Bullets with AI</>}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* All Good */}
                  {(!reviewResult.bulletIssues || reviewResult.bulletIssues.length === 0) && reviewResult.sectionChecks?.every((s: any) => s.status === 'pass') && (
                    <div style={{ padding: '0.75rem 1.25rem' }}>
                      <p style={{ fontSize: '0.82rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <CheckCircle2 size={14} /> Your resume looks great! Ready to generate.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Template Selector */}
            <div className="grid gap-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">Resume Template</label>
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
          {step > 0 && <button type="button" onClick={prevStep} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"><ChevronLeft size={16} /> Back</button>}
          
          <div style={{ flex: 1 }} />
          
          {step > 0 && (
            <button 
              type="button" 
              onClick={() => setShowConfirmReset(true)}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2" 
              title="Clear all text and start over"
              style={{ color: 'var(--error)', borderColor: 'rgba(239,68,68,0.3)', marginRight: '1rem', padding: '0.6rem 0.75rem' }}
            >
              <RefreshCcw size={16} /> <span className="hide-on-mobile">Start Fresh</span>
            </button>
          )}
          {step > 0 && !isLastStep && <button type="button" onClick={nextStep} disabled={!canProceed(step)} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">Next <ChevronRight size={16} /></button>}
          
          {isLastStep && (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" onClick={handleGenerateCoverLetter} disabled={coverLetterLoading || !canProceed(1)} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 generate-btn" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
                {coverLetterLoading ? <><Loader2 size={16} className="spin-icon" /> Generating...</> : <><Sparkles size={16} /> Cover Letter</>}
              </button>
              <button type="button" onClick={handleSaveDraft} disabled={isSavingDraft || !canProceed(1) || !canProceed(2)} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 generate-btn" style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}>
                {isSavingDraft ? <><Loader2 size={16} className="spin-icon" /> Saving...</> : <><Check size={16} /> Save Draft</>}
              </button>
              <button type="submit" disabled={isLoading || !canProceed(1) || !canProceed(2)} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 generate-btn">
                {isLoading ? <><Loader2 size={16} className="spin-icon" /> Generating...</> : <><Send size={16} /> Generate Resume</>}
              </button>
            </div>
          )}
        </div>

        {Object.keys(validationErrors).length > 0 && (
          <div className="animate-fade-in" style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--error)', fontSize: '0.95rem', fontWeight: 600 }}>
              <AlertTriangle size={16} /> Validation Errors
            </h3>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--error)', fontSize: '0.85rem' }}>
              {Object.entries(validationErrors).map(([section, errors]) => (
                <li key={section} style={{ marginBottom: '0.25rem' }}>
                  <strong>{section}:</strong> {errors.join(' ')}
                </li>
              ))}
            </ul>
          </div>
        )}

        {coverLetter && (
          <div className="grid gap-2 animate-fade-in" style={{ marginTop: '1.5rem', padding: '1.5rem', background: 'rgba(139, 92, 246, 0.05)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--accent)', fontSize: '1.1rem' }}>
              <Sparkles size={18} /> Generated Cover Letter
            </h3>
            <textarea value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 jd-textarea" style={{ minHeight: '300px', cursor: 'text' }} />
            <p className="text-[0.85rem] text-muted-foreground italic" style={{ marginTop: '0.5rem' }}>You can directly edit this cover letter before copying.</p>
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
              <button type="button" onClick={() => setShowConfirmReset(false)} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                Cancel
              </button>
              <button 
                type="button" 
                onClick={() => {
                  store.resetForm();
                  setCoverLetter(null);
                  setShowConfirmReset(false);
                }} 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
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
