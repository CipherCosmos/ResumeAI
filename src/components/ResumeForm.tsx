'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Briefcase, User, MapPin, GraduationCap, Code, FileText,
  Send, Upload, Sparkles, ChevronRight, ChevronLeft, X, Check, Loader2
} from 'lucide-react';

export interface ResumeData {
  name: string;
  contact: string;
  location: string;
  target_role: string;
  skills: string;
  experience: string;
  education: string;
}

interface ResumeFormProps {
  onSubmit: (data: ResumeData) => void;
  isLoading: boolean;
}

const STEPS = [
  { id: 0, title: 'Upload or Start', icon: Upload, description: 'Upload an existing resume or start fresh' },
  { id: 1, title: 'Personal Info', icon: User, description: 'Name, contact, and location details' },
  { id: 2, title: 'Target & Skills', icon: Code, description: 'Your target role and key skills' },
  { id: 3, title: 'Experience', icon: Briefcase, description: 'Work history and projects' },
  { id: 4, title: 'Education', icon: GraduationCap, description: 'Degrees and certifications' },
];

export default function ResumeForm({ onSubmit, isLoading }: ResumeFormProps) {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<ResumeData>({
    name: '', contact: '', location: '', target_role: '', skills: '', experience: '', education: '',
  });

  // AI suggestion states
  const [suggestions, setSuggestions] = useState<Record<string, string>>({});
  const [loadingSuggestion, setLoadingSuggestion] = useState<string | null>(null);
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  // Upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Trigger AI suggestion for supported fields after debounce
    if (['skills', 'experience', 'education'].includes(name) && value.length > 15) {
      if (debounceTimers.current[name]) clearTimeout(debounceTimers.current[name]);
      debounceTimers.current[name] = setTimeout(() => {
        fetchSuggestion(name, value);
      }, 1500);
    }
  };

  const fetchSuggestion = async (field: string, value: string) => {
    setLoadingSuggestion(field);
    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, value, target_role: formData.target_role }),
      });
      const data = await res.json();
      if (data.suggestion) {
        setSuggestions((prev) => ({ ...prev, [field]: data.suggestion }));
      }
    } catch { /* silently fail */ }
    setLoadingSuggestion(null);
  };

  const applySuggestion = (field: string) => {
    const suggestion = suggestions[field];
    if (!suggestion) return;
    if (field === 'skills') {
      // Append suggested skills
      setFormData((prev) => ({
        ...prev,
        skills: prev.skills ? `${prev.skills}, ${suggestion}` : suggestion,
      }));
    } else {
      // Replace content for experience/education
      setFormData((prev) => ({ ...prev, [field]: suggestion }));
    }
    setSuggestions((prev) => {
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  const dismissSuggestion = (field: string) => {
    setSuggestions((prev) => {
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  // --- File Upload ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedExts = ['.txt', '.md', '.pdf', '.docx'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!allowedExts.includes(ext)) {
      setUploadMessage('Please upload a PDF, DOCX, TXT, or MD file.');
      return;
    }

    setIsUploading(true);
    setUploadMessage(null);

    try {
      const formPayload = new FormData();
      formPayload.append('file', file);

      const res = await fetch('/api/parse-resume', {
        method: 'POST',
        body: formPayload,
      });

      const data = await res.json();
      if (data.parsed) {
        setFormData({
          name: data.parsed.name || '',
          contact: data.parsed.contact || '',
          location: data.parsed.location || '',
          target_role: data.parsed.target_role || '',
          skills: data.parsed.skills || '',
          experience: data.parsed.experience || '',
          education: data.parsed.education || '',
        });
        setUploadMessage(`✅ Parsed "${file.name}" successfully! Review and edit below.`);
        setStep(1); // Jump to personal info step
      } else {
        setUploadMessage(data.error || 'Could not parse the file.');
      }
    } catch {
      setUploadMessage('An error occurred while uploading.');
    }
    setIsUploading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prevStep = () => setStep((s) => Math.max(s - 1, 0));
  const goToStep = (s: number) => setStep(s);

  const canProceedFromStep = useCallback((s: number): boolean => {
    switch (s) {
      case 0: return true; // upload is optional
      case 1: return formData.name.trim().length > 0 && formData.contact.trim().length > 0;
      case 2: return formData.target_role.trim().length > 0;
      case 3: return true; // experience is optional
      case 4: return true; // education is optional
      default: return true;
    }
  }, [formData]);

  const isLastStep = step === STEPS.length - 1;

  /* --- Suggestion Bubble Component --- */
  const SuggestionBubble = ({ field }: { field: string }) => {
    if (loadingSuggestion === field) {
      return (
        <div className="ai-suggestion-bubble loading">
          <Loader2 size={14} className="spin-icon" />
          <span>AI is analyzing...</span>
        </div>
      );
    }
    if (!suggestions[field]) return null;
    return (
      <div className="ai-suggestion-bubble animate-fade-in">
        <div className="ai-suggestion-header">
          <Sparkles size={14} color="var(--accent)" />
          <span>AI Suggestion</span>
          <button onClick={() => dismissSuggestion(field)} className="suggestion-dismiss"><X size={12} /></button>
        </div>
        <p className="ai-suggestion-text">{suggestions[field]}</p>
        <button onClick={() => applySuggestion(field)} className="suggestion-apply-btn">
          <Check size={14} />
          {field === 'skills' ? 'Add Skills' : 'Apply Suggestion'}
        </button>
      </div>
    );
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '2rem' }}>
      {/* Step Indicator */}
      <div className="stepper">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = step === i;
          const isDone = step > i;
          return (
            <button
              key={s.id}
              className={`stepper-item ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
              onClick={() => goToStep(i)}
              type="button"
            >
              <div className="stepper-icon">
                {isDone ? <Check size={16} /> : <Icon size={16} />}
              </div>
              <span className="stepper-label">{s.title}</span>
            </button>
          );
        })}
      </div>

      {/* Step Description */}
      <div className="step-header animate-fade-in" key={step}>
        <h2 className="heading-lg" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          {React.createElement(STEPS[step].icon, { size: 24, color: 'var(--primary)' })}
          {STEPS[step].title}
        </h2>
        <p style={{ color: 'var(--foreground)', opacity: 0.7, marginBottom: '1.5rem' }}>
          {STEPS[step].description}
        </p>
      </div>

      <form onSubmit={handleSubmit}>

        {/* ---- STEP 0: Upload ---- */}
        {step === 0 && (
          <div className="animate-fade-in">
            <div
              className="upload-zone"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
              onDragLeave={(e) => { e.currentTarget.classList.remove('drag-over'); }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('drag-over');
                const file = e.dataTransfer.files[0];
                if (file && fileInputRef.current) {
                  const dt = new DataTransfer();
                  dt.items.add(file);
                  fileInputRef.current.files = dt.files;
                  fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
                }
              }}
            >
              {isUploading ? (
                <Loader2 size={48} className="spin-icon" color="var(--primary)" />
              ) : (
                <Upload size={48} color="var(--primary)" style={{ opacity: 0.7 }} />
              )}
              <p className="upload-zone-title">
                {isUploading ? 'Parsing your resume...' : 'Drag & drop your resume here'}
              </p>
              <p className="upload-zone-sub">or click to browse (.pdf, .docx, .txt, .md)</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.pdf,.docx"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </div>
            {uploadMessage && (
              <div className={`upload-message animate-fade-in ${uploadMessage.startsWith('✅') ? 'success' : 'error'}`}>
                {uploadMessage}
              </div>
            )}
            <div className="divider-or">
              <span>OR</span>
            </div>
            <button type="button" onClick={nextStep} className="btn-primary" style={{ width: '100%' }}>
              <FileText size={18} />
              Start from Scratch
            </button>
          </div>
        )}

        {/* ---- STEP 1: Personal Info ---- */}
        {step === 1 && (
          <div className="step-content animate-fade-in">
            <div className="form-grid">
              <div className="input-group">
                <label className="input-label" htmlFor="name">Full Name *</label>
                <div className="input-icon-wrap">
                  <User size={18} className="field-icon" />
                  <input required type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="input-field with-icon" placeholder="Jane Doe" />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label" htmlFor="contact">Phone & Email *</label>
                <input required type="text" id="contact" name="contact" value={formData.contact} onChange={handleChange} className="input-field" placeholder="+1 234 567 8900 | jane@example.com" />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="location">City, State</label>
              <div className="input-icon-wrap">
                <MapPin size={18} className="field-icon" />
                <input type="text" id="location" name="location" value={formData.location} onChange={handleChange} className="input-field with-icon" placeholder="San Francisco, CA" />
              </div>
            </div>
          </div>
        )}

        {/* ---- STEP 2: Target & Skills ---- */}
        {step === 2 && (
          <div className="step-content animate-fade-in">
            <div className="input-group">
              <label className="input-label" htmlFor="target_role">Target Job Title *</label>
              <div className="input-icon-wrap">
                <Briefcase size={18} className="field-icon" />
                <input required type="text" id="target_role" name="target_role" value={formData.target_role} onChange={handleChange} className="input-field with-icon" placeholder="Senior Software Engineer" />
              </div>
              <p className="field-hint">This helps AI tailor your resume for ATS keyword matching.</p>
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="skills">
                Key Skills (comma separated)
                {loadingSuggestion === 'skills' && <Loader2 size={14} className="spin-icon" style={{ marginLeft: '0.5rem', display: 'inline' }} />}
              </label>
              <div className="input-icon-wrap">
                <Code size={18} className="field-icon top" />
                <textarea id="skills" name="skills" value={formData.skills} onChange={handleChange} className="input-field with-icon" placeholder="React, Next.js, TypeScript, Python, AWS..." rows={3} />
              </div>
              <p className="field-hint">Type 15+ characters to get AI skill suggestions.</p>
              <SuggestionBubble field="skills" />
            </div>
          </div>
        )}

        {/* ---- STEP 3: Experience ---- */}
        {step === 3 && (
          <div className="step-content animate-fade-in">
            <div className="input-group">
              <label className="input-label" htmlFor="experience">
                Experience / Projects
                {loadingSuggestion === 'experience' && <Loader2 size={14} className="spin-icon" style={{ marginLeft: '0.5rem', display: 'inline' }} />}
              </label>
              <div className="input-icon-wrap">
                <Briefcase size={18} className="field-icon top" />
                <textarea id="experience" name="experience" value={formData.experience} onChange={handleChange} className="input-field with-icon" placeholder="Describe your work experience, key achievements, and projects..." rows={6} />
              </div>
              <p className="field-hint">AI will rewrite this using the Google XYZ formula for maximum impact.</p>
              <SuggestionBubble field="experience" />
            </div>
          </div>
        )}

        {/* ---- STEP 4: Education ---- */}
        {step === 4 && (
          <div className="step-content animate-fade-in">
            <div className="input-group">
              <label className="input-label" htmlFor="education">
                Education & Certifications
                {loadingSuggestion === 'education' && <Loader2 size={14} className="spin-icon" style={{ marginLeft: '0.5rem', display: 'inline' }} />}
              </label>
              <div className="input-icon-wrap">
                <GraduationCap size={18} className="field-icon top" />
                <textarea id="education" name="education" value={formData.education} onChange={handleChange} className="input-field with-icon" placeholder={"B.S. Computer Science, MIT, 2020\nAWS Certified Solutions Architect"} rows={4} />
              </div>
              <SuggestionBubble field="education" />
            </div>
          </div>
        )}

        {/* ---- Navigation Buttons ---- */}
        <div className="step-nav">
          {step > 0 && (
            <button type="button" onClick={prevStep} className="btn-secondary">
              <ChevronLeft size={18} />
              Back
            </button>
          )}
          <div style={{ flex: 1 }} />
          {step > 0 && !isLastStep && (
            <button type="button" onClick={nextStep} disabled={!canProceedFromStep(step)} className="btn-primary">
              Next
              <ChevronRight size={18} />
            </button>
          )}
          {isLastStep && (
            <button type="submit" disabled={isLoading || !canProceedFromStep(1)} className="btn-primary" style={{ minWidth: '220px' }}>
              {isLoading ? (
                <>
                  <Loader2 size={18} className="spin-icon" />
                  Generating Resume...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Generate Professional Resume
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
