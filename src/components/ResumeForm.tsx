'use client';

import React, { useState, useCallback, useRef } from 'react';
import {
  Send, Upload, Sparkles, ChevronRight, ChevronLeft, Check, Loader2, RefreshCcw,
  User, Target, Code, Briefcase, Globe, GraduationCap, X, Plus, Award, Languages, FileText,
  BarChart3, AlertTriangle, CheckCircle2, Shield, Zap, ChevronDown, ChevronUp, Lightbulb, Info
} from 'lucide-react';
import { ResumeData, ResumeTemplate, WorkEntry } from '@/types/resume';
import { useResumeStore } from '@/store/useResumeStore';
import { DebouncedInput, DebouncedTextarea } from '@/components/DebouncedInput';
import { PersonalSection } from '@/components/form/PersonalSection';
import { TargetAndSkillsSection } from '@/components/form/TargetAndJDSection';
import { ExperienceSection } from '@/components/form/ExperienceSection';
import { ProjectsSection } from '@/components/form/ProjectsSection';
import { EducationSection } from '@/components/form/EducationSection';
import { resumeSchema } from '@/lib/validations/resume';
import { toast } from 'sonner';
import { createPortal } from 'react-dom';

interface ResumeFormProps {
  onSubmit: (data: ResumeData) => void;
  isLoading: boolean;
}

const STEPS = [
  { id: 0, title: 'Start',             icon: Upload,         desc: 'Upload or start fresh' },
  { id: 1, title: 'Personal',          icon: User,           desc: 'Contact & appearance' },
  { id: 2, title: 'Target & Skills',   icon: Target,         desc: 'Role, JD & skills' },
  { id: 3, title: 'Experience',        icon: Briefcase,      desc: 'Work history' },
  { id: 4, title: 'Projects & Edu',    icon: GraduationCap,  desc: 'Projects & degrees' },
  { id: 5, title: 'Review',            icon: Send,           desc: 'Finalize & generate' },
];

// AI-powered contextual tips per step
const STEP_AI_TIPS: Record<number, { icon: React.ElementType; tip: string; action?: string }> = {
  1: { icon: Sparkles, tip: 'AI will auto-detect your profile from uploaded data. Add LinkedIn/GitHub to boost ATS score by 12%.', action: 'Pro tip' },
  2: { icon: Lightbulb, tip: 'Paste a job description and AI will extract the top keywords to supercharge your skills list.', action: 'AI-powered' },
  3: { icon: Zap, tip: 'Use "AI Rewrite" on each role to transform weak bullets into metric-driven impact statements.', action: 'Smart bullets' },
  4: { icon: Sparkles, tip: 'AI can suggest relevant coursework and tech stacks automatically. Click the sparkle icons!', action: 'Auto-suggest' },
  5: { icon: Shield, tip: 'Run the free Readiness Check to get an ATS score and auto-fix weak sections with one click.', action: 'Free analysis' },
};

const TEMPLATES: { id: ResumeTemplate; name: string; desc: string }[] = [
  { id: 'professional', name: 'Professional', desc: 'Clean, traditional corporate layout' },
  { id: 'modern',       name: 'Modern',       desc: 'Contemporary with accent sections' },
  { id: 'minimal',      name: 'Minimal',      desc: 'Simple, highly ATS-parseable' },
  { id: 'executive',    name: 'Executive',    desc: 'Bold branding for leadership roles' },
  { id: 'creative',     name: 'Creative',     desc: 'Unique structure for design fields' },
  { id: 'tech',         name: 'Tech',         desc: 'Optimized for developer skill grids' },
  { id: 'startup',      name: 'Startup',      desc: 'Dynamic, high-impact aesthetic' },
  { id: 'academic',     name: 'Academic',     desc: 'CV style for research and education' },
  { id: 'classic',      name: 'Classic',      desc: 'Tried-and-true serif typography' },
  { id: 'bold',         name: 'Bold',         desc: 'Striking headers with stark contrast' },
  { id: 'elegant',      name: 'Elegant',      desc: 'Sophisticated spacing and geometry' },
  { id: 'compact',      name: 'Compact',      desc: 'Dense data layout for 1-page limits' },
  { id: 'datascientist',name: 'Data Science', desc: 'Emphasis on tools & certifications' },
  { id: 'designer',     name: 'Designer',     desc: 'Showcase portfolios & visuals' },
  { id: 'finance',      name: 'Finance',      desc: 'Strictly formatted for banking roles' },
];

// Auto-trigger: extract skills from JD when user arrives at step 2 with no skills
function AutoTriggerSkillExtract({ jd, fetchSuggestion }: { jd: string; fetchSuggestion: (field: string, value: string) => void }) {
  const triggered = useRef(false);
  React.useEffect(() => {
    if (!triggered.current && jd.length > 30) {
      triggered.current = true;
      setTimeout(() => fetchSuggestion('skills', `Extract the most important technical skills and keywords from this JD: ${jd.substring(0, 500)}`), 600);
    }
  }, [jd, fetchSuggestion]);
  return null;
}

// Auto-trigger: readiness review when user arrives at Review step
function AutoTriggerReview({ handleReviewReadiness }: { handleReviewReadiness: () => void }) {
  const triggered = useRef(false);
  React.useEffect(() => {
    if (!triggered.current) {
      triggered.current = true;
      setTimeout(() => handleReviewReadiness(), 800);
    }
  }, [handleReviewReadiness]);
  return null;
}

// --- AI Expert Advisor Logic ---
const AI_ADVISOR_DATA: Record<number, string[]> = {
  1: ["Add a professional headshot to creative templates to increase engagement.", "Include a link to your portfolio, GitHub, or professional website if applicable.", "Pro-tip: Use a professional email like firstname.lastname@email.com."],
  2: ["ATS systems filter by mandatory skills first. Ensure yours are present.", "Use industry-standard job titles as they score higher than unconventional ones.", "If you have the JD, use 'AI Extract' to catch 100% of hidden keywords for your specific field."],
  3: ["Action verbs like 'Spearheaded' or 'Orchestrated' outperform 'Managed'.", "Numbers talk. 'Grew revenue by 20%' or 'Managed 50+ patients' is better than vague statements.", "Keep each bullet under 2 lines for maximum readability."],
  4: ["Highlight key projects, campaigns, or initiatives that show your direct impact.", "Include relevant coursework or certifications if you're a recent grad or switching fields.", "List the tools and methodologies for every project to double your keyword hits."],
  5: ["An 80+ score usually guarantees a human will read your resume.", "Try the 'Modern' template for tech/creative and 'Professional' for corporate/academic.", "Don't forget to generate a tailored cover letter for this specific role."],
  0: ["Upload your old resume to save 10+ minutes of manual entry.", "Starting from scratch? Use 'Magic Baseline' to get an AI-powered headstart tailored to your role.", "The better your starting data, the better AI can optimize your results for your specific industry."]
};

// --- Live ATS Score Logic (Simplified but deterministic) ---
const calculateLiveScore = (data: ResumeData) => {
  let score = 20; // Baseline
  if (data.personal.fullName) score += 5;
  if (data.personal.email && data.personal.phone) score += 5;
  if (data.personal.linkedin || data.personal.github) score += 5;
  if (data.targetRole) score += 10;
  if (data.skills.length > 5) score += 10;
  if (data.skills.length > 10) score += 5;
  if (data.experience.length > 0) score += 10;
  if (data.experience.some(e => e.bullets.length >= 3)) score += 10;
  if (data.projects.length > 0) score += 10;
  if (data.education.length > 0) score += 10;
  return Math.min(score, 100);
};

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
  const [showScoreDetails, setShowScoreDetails] = useState(false);

  // Upload
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

  // --- AI Expert Advisor ---
  const [advisorTipIdx, setAdvisorTipIdx] = useState(0);
  React.useEffect(() => {
    const interval = setInterval(() => {
      setAdvisorTipIdx(prev => (prev + 1) % (AI_ADVISOR_DATA[step]?.length || 1));
    }, 8000);
    return () => clearInterval(interval);
  }, [step]);

  const liveScore = calculateLiveScore(data);
  const scoreColor = `hsl(${liveScore * 1.2}, 70%, 45%)`;

  const handleMagicBaseline = async () => {
    if (!data.targetRole) {
      toast.error("Please enter a Target Role first!");
      return;
    }
    setLoadingSuggestion('magicBaseline');
    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: 'roleBullets', value: data.targetRole }),
      });
      const result = await res.json();
      if (result.suggestion) {
        const bullets = result.suggestion.split('\n').map((b: string) => b.replace(/^[•\-\*\s]+/, '').trim()).filter(Boolean);
        const newEntry = {
          id: crypto.randomUUID(),
          company: 'AI Generated Company',
          jobTitle: data.targetRole,
          location: 'Remote',
          startDate: '2022-01',
          endDate: 'Present',
          current: true,
          description: '',
          bullets: bullets.length > 0 ? bullets : ['Led key initiatives to drive 15% efficiency gains.']
        };
        store.setResumeData({ experience: [...data.experience, newEntry] });
        toast.success("Magic Baseline generated! Just edit the details.");
      }
    } catch { toast.error("Failed to generate magic baseline."); }
    setLoadingSuggestion(null);
  };

  // --- Auto-Save ---
  const lastSavedDataRef = useRef<string>('');
  
  React.useEffect(() => {
    if (!store.currentResumeId) return; // Don't auto-save before initial generation
    const timer = setTimeout(() => {
      const currentDataStr = JSON.stringify(data);
      if (currentDataStr === lastSavedDataRef.current) return; // Data hasn't uniquely changed

      lastSavedDataRef.current = currentDataStr;
      
      // Background save without blocking UI state
      fetch('/api/resumes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: store.currentResumeId, 
          data: data 
        }),
      }).catch(err => console.error('Silent auto-save failed:', err));
    }, 5000);
    return () => clearTimeout(timer);
  }, [data, store.currentResumeId]);

  const applySuggestion = (field: string) => {
    const s = suggestions[field];
    if (!s) return;
    if (field === 'skills') {
      const newSkills = s.split(',').map(sk => sk.trim()).filter(Boolean);
      newSkills.forEach(sk => store.addChip('skills', sk));
    } else if (field === 'summary') {
      store.updateField('summary', s);
    } else if (field === 'targetRoleIdeation') {
      applyTargetRoleSuggestion(); // default: applies first
      return;
    } else if (field === 'extractKeywords') {
      const newSkills = s.split(',').map(sk => sk.trim()).filter(Boolean);
      newSkills.forEach(sk => store.addChip('skills', sk));
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
          job_description: data.jobDescription,
          skills: data.skills.join(', '),
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
      debounceTimers.current['skills'] = setTimeout(() => { fetchSuggestion('skills', val); }, 2000);
    }
  };

  const handleRewriteBullets = async (entryId: string, entry: WorkEntry) => {
    if (!entry.bullets || entry.bullets.length === 0 || entry.bullets.every(b => b.trim() === '')) return;
    setBulletLoading(entryId);
    try {
      const res = await fetch('/api/rewrite-bullets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry, targetRole: data.targetRole, jobDescription: data.jobDescription }),
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
         toast.error(result.error);
      }
    } catch { 
       toast.error('Failed to rewrite bullets.');
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
        body: JSON.stringify({ field: 'roleBullets', value: jobTitle, target_role: data.targetRole, job_description: data.jobDescription }),
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
       toast.error('Failed to generate bullet ideas.');
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
        body: JSON.stringify({ field: 'projectDesc', value: desc, target_role: data.targetRole, job_description: data.jobDescription }),
      });
      const result = await res.json();
      if (result.suggestion) {
         store.updateProject(projId, 'description', result.suggestion);
      }
    } catch { /* silent */ }
    setLoadingSuggestion(null);
  };

  const handleSuggestTechStack = async (projId: string, desc: string) => {
    if (!desc) return;
    setLoadingSuggestion(projId + '_tech');
    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: 'techStackFromDesc', value: desc }),
      });
      const result = await res.json();
      if (result.suggestion) {
         store.updateProject(projId, 'techStack', result.suggestion);
      }
    } catch { /* silent */ }
    setLoadingSuggestion(null);
  };

  const handleSuggestCoursework = async (eduId: string, degree: string) => {
    if (!degree) return;
    setLoadingSuggestion(eduId + '_coursework');
    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: 'courseworkFromDegree', value: degree, target_role: data.targetRole, skills: data.skills.join(', ') }),
      });
      const result = await res.json();
      if (result.suggestion) {
         store.updateEducation(eduId, 'coursework', result.suggestion);
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
        body: JSON.stringify({ field: 'targetRoleIdeation', value: expSum || 'Entry Level', job_description: data.jobDescription || '' }),
      });
      const result = await res.json();
      if (result.suggestion) {
        setSuggestions(p => ({ ...p, targetRoleIdeation: result.suggestion }));
      }
    } catch { /* silent */ }
    setLoadingSuggestion(null);
  };

  const handleExtractKeywords = async () => {
    if (!data.jobDescription) return;
    setLoadingSuggestion('extractKeywords');
    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: 'extractKeywords', value: data.jobDescription }),
      });
      const result = await res.json();
      if (result.suggestion) {
        setSuggestions(p => ({ ...p, extractKeywords: result.suggestion }));
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
        toast.success('Resume draft saved successfully!');
      } else {
        throw new Error();
      }
    } catch {
      toast.error('Failed to save draft.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const applyTargetRoleSuggestion = (specificRole?: string) => {
    const s = suggestions['targetRoleIdeation'];
    if (!s) return;
    if (specificRole) {
      // Apply specific clicked role
      store.updateField('targetRole', specificRole.trim());
    } else {
      // Fallback: apply the first suggested title
      const firstRole = s.split(',')[0].trim();
      store.updateField('targetRole', firstRole);
    }
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
        toast.error(result.error);
      }
    } catch {
      toast.error('Failed to generate cover letter.');
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
      toast.error("Image must be smaller than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      store.updatePersonal('profileImage', reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setValidationErrors({});

    // Filter out completely empty boilerplate instances
    const cleanedData = {
      ...data,
      experience: data.experience.filter(exp => 
        exp.company.trim() || exp.jobTitle.trim() || exp.bullets.some(b => b.trim())
      ),
      education: data.education.filter(edu => 
        edu.institution.trim() || edu.degree.trim() || edu.year.trim()
      ),
      projects: data.projects.filter(proj => 
        proj.name.trim() || proj.techStack.trim() || proj.description.trim()
      ),
    };

    const result = resumeSchema.safeParse(cleanedData);
    
    if (!result.success) {
      // Instead of immediately blocking, try "Magic Repair" for minor issues
      toast.loading('Polishing your data with AI...', { id: 'magic-repair' });
      setFixingType('magicRepair');
      
      try {
        const res = await fetch('/api/resume-fix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fixType: 'magicRepair', data: cleanedData }),
        });
        
        if (res.ok) {
          const { fixedData } = await res.json();
          // Update store with fixed data
          store.setResumeData(fixedData);
          
          // Re-validate fixed data
          const finalResult = resumeSchema.safeParse(fixedData);
          if (finalResult.success) {
            toast.success('Validation fixed by AI!', { id: 'magic-repair' });
            setFixingType(null);
            onSubmit(fixedData);
            return;
          }
        }
      } catch (err) {
        console.error('Magic repair failed:', err);
      }
      
      toast.dismiss('magic-repair');
      setFixingType(null);

      // If AI couldn't fix it or failed, show the issues
      const newErrors: Record<string, string[]> = {};
      result.error.issues.forEach((err) => {
        const path = err.path;
        let section = 'General';
        let prefix = '';
        
        if (path[0] === 'personal') section = 'Personal Details';
        else if (path[0] === 'experience') {
          section = 'Work Experience';
          if (typeof path[1] === 'number') prefix = `(Entry #${path[1] + 1}) `;
        }
        else if (path[0] === 'education') {
          section = 'Education';
          if (typeof path[1] === 'number') prefix = `(Entry #${path[1] + 1}) `;
        }
        else if (path[0] === 'projects') {
          section = 'Projects';
          if (typeof path[1] === 'number') prefix = `(Entry #${path[1] + 1}) `;
        }
        else if (path[0] === 'targetRole' || path[0] === 'jobDescription') section = 'Target & JD';
        else if (path[0] === 'skills') section = 'Skills';
        
        if (!newErrors[section]) newErrors[section] = [];
        const fieldName = String(path[path.length - 1]).replace(/([A-Z])/g, ' $1').toLowerCase();
        newErrors[section].push(`${prefix}${fieldName}: ${err.message}`);
      });

      if (Object.keys(newErrors).length > 0) {
        setValidationErrors(newErrors);
        toast.error('Form has issues AI couldn\'t fix. Please review at the bottom.');
        setTimeout(() => {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }, 100);
        return;
      }
    }

    onSubmit(cleanedData);
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

  const nextStep = () => { setStep(Math.min(step + 1, STEPS.length - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const prevStep = () => { setStep(Math.max(step - 1, 0)); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  // Keyboard shortcuts: Ctrl+ArrowRight / Ctrl+ArrowLeft
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'ArrowRight') { e.preventDefault(); nextStep(); }
      if (e.ctrlKey && e.key === 'ArrowLeft') { e.preventDefault(); prevStep(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const canProceed = useCallback((s: number): boolean => {
    switch (s) {
      case 1: return data.personal.fullName.trim().length > 0 && (data.personal.email.trim().length > 0 || data.personal.phone.trim().length > 0);
      case 2: return data.targetRole.trim().length > 0;
      default: return true;
    }
  }, [data]);

  // Real per-step completion detection
  const isStepComplete = useCallback((s: number): boolean => {
    switch (s) {
      case 0: return true; // Start is always complete once passed
      case 1: return data.personal.fullName.trim().length > 0 && (data.personal.email.trim().length > 0 || data.personal.phone.trim().length > 0);
      case 2: return data.targetRole.trim().length > 0 && data.skills.length > 0;
      case 3: return data.experience.some(e => e.jobTitle.trim().length > 0 && e.company.trim().length > 0);
      case 4: return data.education.some(e => e.degree.trim().length > 0);
      case 5: return false; // Review is never "complete" — it's the final step
      default: return false;
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

    // Special rendering for target role ideation: show clickable role chips
    if (field === 'targetRoleIdeation') {
      const roles = suggestions[field].split(',').map(r => r.trim()).filter(Boolean);
      return (
        <div className="ai-suggestion-bubble animate-fade-in">
          <div className="ai-suggestion-header">
            <Sparkles size={14} />
            <span>Suggested Roles — Click any to apply</span>
            <button onClick={() => dismissSuggestion(field)} className="suggestion-dismiss" type="button"><X size={12} /></button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {roles.map((role, i) => (
              <button
                key={i}
                type="button"
                onClick={() => applyTargetRoleSuggestion(role)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/15 hover:border-primary/50 transition-all cursor-pointer"
              >
                <Target size={12} />
                {role}
              </button>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="ai-suggestion-bubble animate-fade-in">
        <div className="ai-suggestion-header">
          <Sparkles size={14} />
          <span>{field === 'extractKeywords' ? 'Extracted Keywords' : 'AI Suggestion'}</span>
          <button onClick={() => dismissSuggestion(field)} className="suggestion-dismiss" type="button"><X size={12} /></button>
        </div>
        <p className="ai-suggestion-text">{suggestions[field]}</p>
        <div className="flex gap-2">
          <button onClick={() => applySuggestion(field)} className="suggestion-apply-btn" type="button"><Check size={14} /> {field === 'extractKeywords' ? 'Add to Skills' : 'Apply'}</button>
          {field === 'extractKeywords' && (
            <p className="text-[0.65rem] text-muted-foreground self-center italic">These will be added to your skills list.</p>
          )}
        </div>
      </div>
    );
  };

  // We only show the UI after hydration is complete to avoid SSR mismatch with localStorage
  const [mounted, setMounted] = useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const { precisionMode, togglePrecisionMode } = store;

  return (
    <div className={`p-4 md:p-6 lg:p-8 bg-card text-card-foreground shadow-2xl rounded-[2.5rem] border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-500 animate-fade-in ${precisionMode ? 'high-density' : ''}`}>
      {step > 0 && (
        <div className="flex items-center gap-4 mb-8">
          <div className="relative h-1 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary via-purple-500 to-accent transition-all duration-1000 rounded-full" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[0.65rem] font-black font-mono text-primary">{progress}%</span>
            <div className="h-4 w-[1px] bg-border" />
            <button 
              type="button" 
              onClick={togglePrecisionMode}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all ${precisionMode ? 'bg-primary border-primary text-primary-foreground' : 'bg-muted/30 border-border text-muted-foreground hover:border-primary/50'}`}
            >
              <Zap size={10} className={precisionMode ? 'fill-current' : ''} />
              <span className="text-[0.6rem] font-bold uppercase tracking-tighter">Precision</span>
            </button>
          </div>
        </div>
      )}

      {/* === Redesigned Stepper with connecting lines === */}
      <div className={`flex items-center mb-10 overflow-x-auto pb-4 gap-2 hide-scrollbar transition-all ${precisionMode ? 'opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0' : ''}`}>
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = step === i;
          const isComplete = i < step && isStepComplete(i);
          const isPast = i < step;
          return (
            <React.Fragment key={s.id}>
              <button
                className={`flex flex-col items-center gap-2 min-w-[70px] transition-all cursor-pointer group`}
                onClick={() => { setStep(i); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                type="button"
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border-2 transition-all duration-500 shadow-sm ${
                  isActive ? 'bg-primary text-primary-foreground border-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)] scale-110 -rotate-3'
                  : isComplete ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/50'
                  : isPast ? 'bg-amber-500/10 text-amber-500 border-amber-500/50'
                  : 'bg-zinc-100 dark:bg-zinc-900 text-muted-foreground border-border/50'
                }`}>
                  {isComplete ? <Check size={12} strokeWidth={3} /> : <Icon size={12} />}
                </div>
                {!precisionMode && (
                  <span className={`text-[0.6rem] font-black uppercase tracking-widest transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground/60'}`}>{s.title}</span>
                )}
              </button>
              {i < STEPS.length - 1 && (
                <div className="flex-1 min-w-[12px] h-[1px] bg-border transition-all mt-[-16px]" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="mb-6 relative">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-3 text-2xl font-bold tracking-tight mb-1">{React.createElement(STEPS[step].icon, { size: 24, color: 'var(--primary)' })} {STEPS[step].title}</h2>
            <p className="text-sm text-muted-foreground">{STEPS[step].desc}</p>
          </div>
          
          {/* Unified Master Meter (Clickable) */}
          <div className="relative">
            <button 
              type="button"
              onClick={() => setShowScoreDetails(!showScoreDetails)}
              className="flex flex-col items-center group cursor-pointer transition-transform hover:scale-105 outline-none" 
              title="Click for deep AI analysis & feedback"
            >
              <div className="relative w-12 h-12">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-muted/10" />
                  <circle 
                    cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="3" 
                    fill="transparent" 
                    strokeDasharray={125.6} 
                    strokeDashoffset={125.6 - (125.6 * (reviewResult?.projectedScore || liveScore)) / 100} 
                    strokeLinecap="round" 
                    style={{ color: reviewResult ? `hsl(${reviewResult.projectedScore * 1.2}, 70%, 45%)` : scoreColor, transition: 'all 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }} 
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[0.6rem] font-black" style={{ color: reviewResult ? `hsl(${reviewResult.projectedScore * 1.2}, 70%, 45%)` : scoreColor }}>
                    {reviewResult?.projectedScore || liveScore}%
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-1 opacity-60 group-hover:opacity-100 transition-opacity">
                <span className="text-[0.45rem] font-black uppercase tracking-tighter">ATS Optima</span>
              </div>
            </button>

            {/* Score Details Popover */}
            {showScoreDetails && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-background border border-accent/20 shadow-2xl rounded-2xl z-50 p-4 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 italic"><Shield size={14} className="text-primary" /> Neural Audit</h3>
                  <button onClick={() => setShowScoreDetails(false)} className="text-muted-foreground hover:text-foreground transition-colors"><X size={14} /></button>
                </div>

                {!reviewResult ? (
                  <div className="text-center py-6 space-y-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mx-auto text-primary border border-primary/20">
                      <Zap size={20} className="animate-pulse" />
                    </div>
                    <div>
                      <p className="text-[0.7rem] font-black uppercase tracking-tight">Logic Check Pending</p>
                      <p className="text-[0.6rem] text-muted-foreground px-4 uppercase font-bold opacity-60">Run audit to verify ATS metadata synchronization.</p>
                    </div>
                    <button 
                      onClick={handleReviewReadiness} 
                      disabled={reviewLoading}
                      className="w-full h-8 text-[0.65rem] font-black uppercase tracking-widest bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                    >
                      {reviewLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      Execute Neural Scan
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-muted/30 border border-border/50">
                      <div className="text-center border-r border-border/50 pr-2 flex-1">
                        <p className="text-[0.5rem] uppercase text-muted-foreground font-black tracking-tighter leading-tight opacity-70">Keywords</p>
                        <p className="text-xs font-black italic">{reviewResult.keywordScore}%</p>
                      </div>
                      <div className="text-center border-r border-border/50 px-2 flex-1">
                        <p className="text-[0.5rem] uppercase text-muted-foreground font-black tracking-tighter leading-tight opacity-70">Format</p>
                        <p className="text-xs font-black italic">{reviewResult.formatScore}%</p>
                      </div>
                      <div className="text-center pl-2 flex-1">
                        <p className="text-[0.5rem] uppercase text-muted-foreground font-black tracking-tighter leading-tight opacity-70">Bullets</p>
                        <p className="text-xs font-black italic">{reviewResult.bulletScore}%</p>
                      </div>
                    </div>

                    {reviewResult.sectionChecks && (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 select-none">
                        <p className="text-[0.5rem] uppercase font-black text-muted-foreground tracking-[0.15em] opacity-80">Critical Telemetry</p>
                        {reviewResult.sectionChecks.filter((s:any) => s.status !== 'pass').slice(0, 5).map((s:any, i:number) => (
                          <div key={i} className={`flex gap-2 p-1.5 rounded-lg border transition-all ${s.status === 'fail' ? 'bg-red-500/5 border-red-500/10' : 'bg-amber-500/5 border-amber-500/10'}`}>
                            {s.status === 'fail' ? <AlertTriangle size={10} className="text-red-500 shrink-0 mt-0.5" /> : <Info size={10} className="text-amber-500 shrink-0 mt-0.5" />}
                            <div className="flex-1">
                              <p className="text-[0.65rem] font-black uppercase tracking-tight leading-tight">{s.name}</p>
                              <p className="text-[0.55rem] text-muted-foreground leading-snug font-bold">{s.detail}</p>
                            </div>
                            {s.fixable && (
                              <button onClick={() => { handleAutoFix(s.fixType); setShowScoreDetails(false); }} className="text-[0.55rem] font-black uppercase text-primary hover:underline self-center shrink-0 tracking-widest px-1">Fix</button>
                            )}
                          </div>
                        ))}
                        {reviewResult.sectionChecks.every((s:any) => s.status === 'pass') && (
                          <div className="flex flex-col items-center gap-2 py-4 justify-center text-emerald-500 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                            <CheckCircle2 size={20} className="animate-bounce" />
                            <span className="text-[0.65rem] font-black uppercase tracking-widest">Profile Optimal</span>
                          </div>
                        )}
                      </div>
                    )}

                    <button 
                      onClick={handleReviewReadiness} 
                      disabled={reviewLoading}
                      className="w-full h-8 text-[0.6rem] font-black uppercase tracking-widest border-2 border-primary/20 hover:bg-primary/5 rounded-lg flex items-center justify-center gap-2 transition-all"
                    >
                      <RefreshCcw size={10} /> Sync Audit
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* AI Expert Advisor Banner (Hide in Precision Mode) */}
        {AI_ADVISOR_DATA[step] && !precisionMode && (
          <div className="mt-4 flex items-start gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/20 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary/40 group-hover:bg-primary transition-colors" />
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0 animate-pulse">
              <Sparkles size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[0.65rem] font-bold uppercase tracking-wider text-primary">AI Expert Advisor</span>
                <div className="h-1 w-1 rounded-full bg-primary/30" />
                <span className="text-[0.65rem] text-muted-foreground">Personalized Coach</span>
              </div>
              <p className="text-sm text-foreground/90 leading-tight transition-all duration-500">
                {AI_ADVISOR_DATA[step][advisorTipIdx]}
              </p>
            </div>
            <div className="flex gap-1 shrink-0 mt-1">
              {AI_ADVISOR_DATA[step].map((_, i) => (
                <div key={i} className={`h-1 w-3 rounded-full transition-all ${i === advisorTipIdx ? 'bg-primary w-5' : 'bg-primary/20'}`} />
              ))}
            </div>
          </div>
        )}
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
              {uploadedFile && !isUploading && <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-base font-semibold mt-2"><FileText size={12} /> {uploadedFile}</div>}
              <input ref={fileRef} type="file" accept=".txt,.md,.pdf,.docx" onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); }} style={{ display: 'none' }} />
            </div>
            {uploadMsg && <div className={`upload-message animate-fade-in ${uploadMsg.startsWith('✅') ? 'success' : 'error'}`}>{uploadMsg}</div>}
            <div className="flex items-center gap-4 my-6 text-sm text-muted-foreground uppercase tracking-widest before:flex-1 before:h-px before:bg-border after:flex-1 after:h-px after:bg-border"><span>OR</span></div>
            <div className="flex flex-col gap-3">
              <button type="button" onClick={nextStep} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-base font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-6 py-3 text-base full-width"><FileText size={16} /> Start from Scratch</button>
              
              <button 
                type="button" 
                onClick={handleMagicBaseline} 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-base font-semibold border border-primary/20 bg-background hover:bg-primary/5 text-primary h-11 px-6 py-3 gap-2 group relative overflow-hidden"
                disabled={loadingSuggestion === 'magicBaseline'}
              >
                {loadingSuggestion === 'magicBaseline' ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Sparkles size={16} className="text-primary group-hover:scale-125 transition-transform" />
                )}
                <span>Magic AI Baseline</span>
                <span className="absolute -right-2 -top-1 px-2 py-0.5 bg-primary text-[0.6rem] font-bold text-primary-foreground rotate-12 group-hover:rotate-0 transition-transform">NEW</span>
              </button>
              <p className="text-[0.7rem] text-muted-foreground text-center italic">Best for quick starts: AI generates a high-quality role profile instantly.</p>
            </div>
          </div>
        )}

        {/* === STEP 1: Personal + Appearance Settings === */}
        {step === 1 && (
          <div className="flex flex-col gap-6 animate-in fade-in-50 duration-500 animate-fade-in">
            <PersonalSection 
              data={data.personal} 
              template={data.template} 
              updatePersonal={store.updatePersonal} 
            />

            {/* Appearance & Template Settings */}
            <details className="group border rounded-xl bg-muted/20 border-border/50 overflow-hidden" open>
              <summary className="flex items-center justify-between gap-2 p-4 cursor-pointer select-none hover:bg-muted/30 transition-colors">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Shield size={16} className="text-primary" /> Appearance & Template
                </h3>
                <ChevronDown size={16} className="text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-4 pb-4 pt-2 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-semibold flex items-center gap-2"><FileText size={14} /> Resume Title</label>
                    <DebouncedInput type="text" value={data.title} onChangeValue={(v) => store.updateField('title', v)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="e.g. Senior SWE Resume" />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-semibold flex items-center gap-2"><Zap size={14} /> Theme Color</label>
                    <div className="flex gap-2 items-center">
                      <input type="color" value={data.themeColor} onChange={(e) => store.updateField('themeColor', e.target.value)} className="h-10 w-12 rounded border border-input bg-background p-1 cursor-pointer" />
                      <DebouncedInput type="text" value={data.themeColor} onChangeValue={(v) => store.updateField('themeColor', v)} className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-semibold flex items-center gap-2"><Code size={14} /> Font Family</label>
                    <select value={data.fontFamily} onChange={(e) => store.updateField('fontFamily', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <option value="Inter">Inter (Sans-serif)</option>
                      <option value="Roboto">Roboto</option>
                      <option value="Open Sans">Open Sans</option>
                      <option value="Serif">Times New Roman (Serif)</option>
                      <option value="Monospace">JetBrains Mono (Monospace)</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-semibold">Resume Template</label>
                  <div className="template-grid mt-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.75rem' }}>
                    {TEMPLATES.map(t => (
                      <button key={t.id} type="button" className={`template-card flex flex-col items-start gap-2 p-2 ${data.template === t.id ? 'active' : ''}`} onClick={() => store.updateField('template', t.id)}>
                        <div className="w-full aspect-[21/29.7] rounded bg-muted overflow-hidden border border-border/50 relative">
                          <img src={`/api/templates/${t.id}`} alt={t.name} className="object-cover w-full h-full" loading="lazy" />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="template-card-name text-xs font-semibold">{t.name}</span>
                          <span className="template-card-desc text-[0.6rem] mt-0.5 text-muted-foreground">{t.desc}</span>
                        </div>
                        {data.template === t.id && <Check size={16} className="template-check absolute top-3 right-3 bg-primary text-white rounded-full p-0.5" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </details>
          </div>
        )}

        {/* === STEP 2: Target, JD & Skills (MERGED) === */}
        {step === 2 && (
          <div className="flex flex-col gap-8 animate-in fade-in-50 duration-500 animate-fade-in">
            {/* Auto-trigger: extract skills from JD when arriving with no skills */}
            {data.jobDescription && data.skills.length === 0 && (
              <AutoTriggerSkillExtract jd={data.jobDescription} fetchSuggestion={fetchSuggestion} />
            )}
            <TargetAndSkillsSection
              targetRole={data.targetRole}
              jobDescription={data.jobDescription}
              updateField={store.updateField}
              loadingSuggestion={loadingSuggestion}
              fetchSuggestion={fetchSuggestion}
              handleAddChip={handleAddChip}
              onSkillsChange={onSkillsChange}
              SuggestionBubble={SuggestionBubble}
              skillInput={skillInput}
              setSkillInput={setSkillInput}
              handleSuggestTargetRoles={handleSuggestTargetRoles}
              handleExtractKeywords={handleExtractKeywords}
            />

            <div className="flex items-center gap-4 text-sm text-muted-foreground uppercase tracking-widest before:flex-1 before:h-px before:bg-border after:flex-1 after:h-px after:bg-border"><Code size={14} /> Skills</div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-3">
                <label className="text-base font-semibold leading-none flex items-center gap-2"><Code size={18} /> Skills {loadingSuggestion === 'skills' && <Loader2 size={16} className="spin-icon inline-loader" />}</label>
                <button type="button" onClick={() => fetchSuggestion('skills', data.targetRole || data.skills.join(', ') || 'general')} disabled={loadingSuggestion === 'skills'} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-primary/30 text-primary hover:bg-primary/10 h-9 px-3 gap-2">
                  {loadingSuggestion === 'skills' ? <><Loader2 size={14} className="spin-icon" /> Suggesting...</> : <><Sparkles size={14} /> AI Suggest</>}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <DebouncedInput type="text" value={skillInput} onChangeValue={val => setSkillInput(val)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); handleAddChip('skills', skillInput, setSkillInput); onSkillsChange(); } }}
                  className="flex w-full rounded-md border border-input bg-background px-4 py-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Type a skill and press Enter" delay={10} />
                <button type="button" onClick={() => { handleAddChip('skills', skillInput, setSkillInput); onSkillsChange(); }} className="inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground h-10 w-10 shrink-0"><Plus size={16} /></button>
              </div>
              {data.skills.length > 0 && (
                <div className="skill-chips">
                  {data.skills.map((s, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-primary/10 text-primary hover:bg-primary/20">{s}<button type="button" onClick={() => store.removeChip('skills', i)} className="opacity-50 hover:opacity-100 transition-opacity"><X size={11} /></button></span>
                  ))}
                </div>
              )}
              <SuggestionBubble field="skills" />
              {data.jobDescription && (
                <button type="button" onClick={() => fetchSuggestion('skills', `Extract the most important technical skills and keywords from this JD: ${data.jobDescription.substring(0, 500)}`)} disabled={loadingSuggestion === 'skills'} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-primary/30 text-primary hover:bg-primary/10 h-9 px-3 gap-1.5 self-start mt-1">
                  <Target size={13} /> Extract Skills from JD
                </button>
              )}
            </div>
          </div>
        )}

        {/* === STEP 3: Experience === */}
        {step === 3 && (
          <ExperienceSection 
             handleRewriteBullets={handleRewriteBullets} 
             handleGenerateRoleBullets={handleGenerateRoleBullets} 
             bulletLoading={bulletLoading} 
             experience={data.experience}
             updateWork={store.updateWork}
             moveWork={store.moveWorkEntry}
             addWorkEntry={store.addWorkEntry}
             removeWorkEntry={store.removeWorkEntry}
             updateBullet={store.updateBullet}
             removeBullet={store.removeBullet}
             addBullet={store.addBullet}
          />
        )}

        {/* === STEP 4: Projects & Education (MERGED) === */}
        {step === 4 && (
          <div className="flex flex-col gap-8 animate-in fade-in-50 duration-500 animate-fade-in">
            <ProjectsSection 
              handleRewriteProjectDesc={handleRewriteProjectDesc}
              handleSuggestTechStack={handleSuggestTechStack}
              loadingSuggestion={loadingSuggestion}
              projects={data.projects}
              updateProject={store.updateProject}
              moveProject={store.moveProject}
              addProject={store.addProject}
              removeProject={store.removeProject}
            />

            <div className="flex items-center gap-4 text-sm text-muted-foreground uppercase tracking-widest before:flex-1 before:h-px before:bg-border after:flex-1 after:h-px after:bg-border"><GraduationCap size={14} /> Education</div>

            <EducationSection 
              education={data.education}
              updateEducation={store.updateEducation}
              moveEducation={store.moveEducation}
              addEducation={store.addEducation}
              removeEducation={store.removeEducation}
              handleSuggestCoursework={handleSuggestCoursework}
              loadingSuggestion={loadingSuggestion}
            />
          </div>
        )}

        {/* === STEP 5: Review & Generate === */}
        {step === 5 && (
          <div className="flex flex-col gap-6 animate-in fade-in-50 duration-500 animate-fade-in">
            {/* Auto-trigger: readiness review on entry */}
            {!reviewResult && !reviewLoading && (
              <AutoTriggerReview handleReviewReadiness={handleReviewReadiness} />
            )}
            {/* Summary */}
            <div className="grid gap-3">
              <div className="flex items-center justify-between gap-2">
                <label className="text-base font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"><Sparkles size={18} /> Professional Summary</label>
                <button type="button" onClick={generateSummary} disabled={summaryLoading} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-primary/30 text-primary hover:bg-primary/10 h-10 px-4 gap-2">
                  {summaryLoading ? <><Loader2 size={16} className="spin-icon" /> Generating...</> : <><Sparkles size={16} /> AI Auto-fill</>}
                </button>
              </div>
              <DebouncedTextarea value={data.summary} onChangeValue={(val: string) => store.updateField('summary', val)} className="flex w-full rounded-md border border-input bg-background px-4 py-3 text-base ring-offset-background file:border-0 file:bg-transparent file:text-base file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" rows={4} placeholder="A results-driven software engineer with 5+ years..." delay={500} />
              <p className="text-[0.95rem] text-muted-foreground italic">Click &quot;AI Auto-fill&quot; to generate from your data, or write your own.</p>
            </div>



            {/* Certifications */}
            <div className="grid gap-2">
              <label className="text-base font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"><Award size={14} /> Certifications</label>
              <div className="flex items-center gap-2">
                <input type="text" value={certInput} onChange={e => setCertInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddChip('certifications', certInput, setCertInput); } }}
                  className="flex w-full rounded-md border border-input bg-background px-4 py-3 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="AWS Certified Solutions Architect" />
                <button type="button" onClick={() => handleAddChip('certifications', certInput, setCertInput)} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-base font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10 shrink-0"><Plus size={16} /></button>
              </div>
              {data.certifications.length > 0 && (
                <div className="skill-chips">{data.certifications.map((c, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-accent/10 text-accent hover:bg-accent/20">{c}<button type="button" onClick={() => store.removeChip('certifications', i)} className="opacity-50 hover:opacity-100 transition-opacity focus:outline-none"><X size={11} /></button></span>
                ))}</div>
              )}
            </div>

            {/* Languages */}
            <div className="grid gap-2">
              <label className="text-base font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"><Languages size={14} /> Languages</label>
              <div className="flex items-center gap-2">
                <input type="text" value={langInput} onChange={e => setLangInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddChip('languages', langInput, setLangInput); } }}
                  className="flex w-full rounded-md border border-input bg-background px-4 py-3 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="English (Native), Hindi (Fluent)" />
                <button type="button" onClick={() => handleAddChip('languages', langInput, setLangInput)} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-base font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10 shrink-0"><Plus size={16} /></button>
              </div>
              {data.languages.length > 0 && (
                <div className="skill-chips">{data.languages.map((l, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary/10 text-secondary hover:bg-secondary/20">{l}<button type="button" onClick={() => store.removeChip('languages', i)} className="opacity-50 hover:opacity-100 transition-opacity focus:outline-none"><X size={11} /></button></span>
                ))}</div>
              )}
            </div>

            {/* Readiness Summary (Compact) */}
            {reviewResult && (
              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">AI Audit Complete ({reviewResult.projectedScore}%)</p>
                    <p className="text-xs text-muted-foreground">Detailed feedback available in the header score meter.</p>
                  </div>
                </div>
                {reviewResult.canAutoFix && (
                  <button type="button" onClick={handleApplyAllFixes} disabled={!!fixingType} className="h-9 px-4 text-xs font-bold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2">
                    {fixingType ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />} Apply Fixes
                  </button>
                )}
              </div>
            )}
            {!reviewResult && (
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-between gap-4">
                 <div className="flex items-center gap-3">
                    <Loader2 size={20} className="animate-spin text-primary" />
                    <div>
                      <p className="text-sm font-bold">Running AI Readiness Audit...</p>
                      <p className="text-xs text-muted-foreground">Analyzing your resume against industry standards.</p>
                    </div>
                 </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-12 flex items-center justify-between gap-4">
          {step > 0 && (
            <button 
              type="button" 
              onClick={prevStep} 
              className="h-10 px-6 rounded-xl border border-border bg-background hover:bg-muted text-xs font-black uppercase tracking-widest transition-all -skew-x-6 hover:skew-x-0"
            >
              <div className="flex items-center gap-2 skew-x-6 group-hover:skew-x-0">
                <ChevronLeft size={14} strokeWidth={3} />
                Back
              </div>
            </button>
          )}
          
          <div className="flex-1" />
          
          <div className="flex items-center gap-3">
            {step > 0 && (
              <button 
                type="button" 
                onClick={() => setShowConfirmReset(true)}
                className="h-10 w-10 flex items-center justify-center rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-all -skew-x-6" 
                title="Start Fresh"
              >
                <RefreshCcw size={14} className="skew-x-6" />
              </button>
            )}
            
            {step > 0 && !isLastStep && (
              <button 
                type="button" 
                onClick={nextStep} 
                disabled={!canProceed(step)} 
                className="h-10 px-8 rounded-xl bg-zinc-900 border border-white/10 text-white shadow-[0_10px_20px_-10px_rgba(0,0,0,0.5)] hover:shadow-primary/20 hover:scale-[1.02] disabled:opacity-50 transition-all -skew-x-6"
              >
                <div className="flex items-center gap-2 skew-x-6">
                  <span className="text-xs font-black uppercase tracking-widest">Next</span>
                  <ChevronRight size={14} strokeWidth={3} />
                </div>
              </button>
            )}
            
            {isLastStep && (
              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={handleGenerateCoverLetter} 
                  disabled={coverLetterLoading || !canProceed(1)} 
                  className="h-10 px-6 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs font-black uppercase tracking-widest transition-all hover:bg-zinc-50 -skew-x-6"
                >
                  <div className="flex items-center gap-2 skew-x-6">
                    {coverLetterLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    <span className="hidden sm:inline">Cover Letter</span>
                  </div>
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading || !canProceed(1) || !canProceed(2)} 
                  className="h-10 px-8 rounded-xl bg-primary text-primary-foreground shadow-[0_10px_20px_-5px_rgba(var(--primary-rgb),0.3)] hover:scale-[1.02] disabled:opacity-50 transition-all -skew-x-6"
                >
                  <div className="flex items-center gap-2 skew-x-6">
                    {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    <span className="text-xs font-black uppercase tracking-widest">Process Resume</span>
                  </div>
                </button>
              </div>
            )}
          </div>
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
            <textarea value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} className="flex w-full rounded-md border border-input bg-background px-4 py-3 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 jd-textarea" style={{ minHeight: '300px', cursor: 'text' }} />
            <p className="text-[0.85rem] text-muted-foreground italic" style={{ marginTop: '0.5rem' }}>You can directly edit this cover letter before copying.</p>
          </div>
        )}
      </form>

      {/* Custom Confirm Reset Modal */}
      {showConfirmReset && typeof document !== 'undefined' && createPortal(
        <div className="resume-modal-overlay">
          <div className="resume-modal-content" style={{ maxWidth: '450px', padding: '2rem', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--error)' }}>Start Fresh?</h3>
            <p style={{ marginBottom: '2rem', color: 'var(--text-muted)' }}>
              Are you sure you want to clear all form data and start a new resume from scratch? This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button type="button" onClick={() => setShowConfirmReset(false)} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-base font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 px-6 py-3 text-base">
                Cancel
              </button>
              <button 
                type="button" 
                onClick={() => {
                  store.resetForm();
                  setCoverLetter(null);
                  setShowConfirmReset(false);
                }} 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-base font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-6 py-3 text-base"
                style={{ background: 'var(--error)', borderColor: 'var(--error)' }}
              >
                Yes, Clear Everything
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
