import React, { useRef, memo } from 'react';
import { User, Mail, Phone, MapPin, Linkedin, Github, Globe, Trash2, Sparkles, Building2, Briefcase } from 'lucide-react';
import { DebouncedInput } from '@/components/DebouncedInput';
import { AIBadge } from '@/components/AIBadge';
import { useResumeStore } from '@/store/useResumeStore';
import { ResumeData } from '@/types/resume';

interface Props {
  data: ResumeData['personal'];
  template: ResumeData['template'];
  updatePersonal: (field: keyof ResumeData['personal'], value: string) => void;
}

export const PersonalSection = memo(function PersonalSection({ data, template, updatePersonal }: Props) {
  const precisionMode = useResumeStore(state => state.precisionMode);
  const profileImageRef = useRef<HTMLInputElement>(null);

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be smaller than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => updatePersonal('profileImage', reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = ''; // Allow re-uploading the same file
  };

  return (
    <div className={`flex flex-col animate-in fade-in-50 duration-500 animate-fade-in transition-all ${precisionMode ? 'gap-3' : 'gap-6'}`}>
      <div className={`grid grid-cols-1 md:grid-cols-2 ${precisionMode ? 'gap-3' : 'gap-6'}`}>
        <div className="grid gap-2">
          {!precisionMode && <label className="text-base font-semibold leading-none flex items-center gap-2"><User size={14} /> Full Name <span className="text-destructive font-normal">*</span></label>}
          <div className="group relative">
            {precisionMode && <User size={12} className="absolute left-3 top-2.5 text-muted-foreground/50" />}
            <DebouncedInput
              type="text"
              value={data.fullName}
              onChangeValue={(value) => updatePersonal('fullName', value)}
              className={`flex w-full rounded-xl border border-input bg-background/50 ring-offset-background placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all ${precisionMode ? 'px-8 py-2 text-xs h-9' : 'px-4 py-3 text-base'}`}
              placeholder="Jane Doe"
              required
              delay={250}
            />
          </div>
        </div>
        <div className="grid gap-2">
          {!precisionMode && <label className="text-base font-semibold leading-none flex items-center gap-2"><Mail size={14} /> Email <span className="text-destructive font-normal">*</span></label>}
          <div className="group relative">
            {precisionMode && <Mail size={12} className="absolute left-3 top-2.5 text-muted-foreground/50" />}
            <DebouncedInput
              type="email"
              value={data.email}
              onChangeValue={(value) => updatePersonal('email', value)}
              className={`flex w-full rounded-xl border border-input bg-background/50 ring-offset-background placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all ${precisionMode ? 'px-8 py-2 text-xs h-9' : 'px-4 py-3 text-base'}`}
              placeholder="jane@example.com"
              delay={250}
            />
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 ${precisionMode ? 'gap-3' : 'gap-6'}`}>
        <div className="grid gap-2">
          {!precisionMode && <label className="text-base font-semibold leading-none flex items-center gap-2"><Phone size={14} /> Phone</label>}
          <div className="group relative">
            {precisionMode && <Phone size={12} className="absolute left-3 top-2.5 text-muted-foreground/50" />}
            <DebouncedInput
              type="tel"
              value={data.phone}
              onChangeValue={(value) => updatePersonal('phone', value)}
              className={`flex w-full rounded-xl border border-input bg-background/50 ring-offset-background placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all ${precisionMode ? 'px-8 py-2 text-xs h-9' : 'px-4 py-3 text-base'}`}
              placeholder="+1 234 567 8900"
              delay={250}
            />
          </div>
        </div>
        <div className="grid gap-2">
          {!precisionMode && <label className="text-base font-semibold leading-none flex items-center gap-2"><MapPin size={14} /> Location</label>}
          <div className="group relative">
            {precisionMode && <MapPin size={12} className="absolute left-3 top-2.5 text-muted-foreground/50" />}
            <DebouncedInput
              type="text"
              value={data.location}
              onChangeValue={(value) => updatePersonal('location', value)}
              className={`flex w-full rounded-xl border border-input bg-background/50 ring-offset-background placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all ${precisionMode ? 'px-8 py-2 text-xs h-9' : 'px-4 py-3 text-base'}`}
              placeholder="San Francisco, CA"
              delay={250}
            />
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 ${precisionMode ? 'gap-3' : 'gap-6'}`}>
        <div className="grid gap-2">
          {!precisionMode && (
            <label className="text-base font-semibold leading-none flex items-center gap-2">
              <Linkedin size={14} /> LinkedIn
              {data.linkedin && !data.linkedin.startsWith('http') && (
                <AIBadge 
                  label="AI Fix" 
                  onClick={() => updatePersonal('linkedin', `https://${data.linkedin.replace(/^(http:\/\/|https:\/\/)/, '')}`)}
                  className="ml-auto"
                />
              )}
            </label>
          )}
          <div className="group relative">
            {precisionMode && <Linkedin size={12} className="absolute left-3 top-2.5 text-muted-foreground/50" />}
            <DebouncedInput
              type="text"
              value={data.linkedin}
              onChangeValue={(value) => updatePersonal('linkedin', value)}
              className={`flex w-full rounded-xl border border-input bg-background/50 ring-offset-background placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all ${precisionMode ? 'px-8 py-2 text-xs h-9' : 'px-4 py-3 text-base'}`}
              placeholder="linkedin.com/in/janedoe"
              delay={250}
            />
          </div>
        </div>
        <div className="grid gap-2">
          {!precisionMode && (
            <label className="text-base font-semibold leading-none flex items-center gap-2">
              <Github size={14} /> GitHub
              {data.github && !data.github.startsWith('http') && (
                <AIBadge 
                  label="AI Fix" 
                  onClick={() => updatePersonal('github', `https://${data.github.replace(/^(http:\/\/|https:\/\/)/, '')}`)}
                  className="ml-auto"
                />
              )}
            </label>
          )}
          <div className="group relative">
            {precisionMode && <Github size={12} className="absolute left-3 top-2.5 text-muted-foreground/50" />}
            <DebouncedInput
              type="text"
              value={data.github}
              onChangeValue={(value) => updatePersonal('github', value)}
              className={`flex w-full rounded-xl border border-input bg-background/50 ring-offset-background placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all ${precisionMode ? 'px-8 py-2 text-xs h-9' : 'px-4 py-3 text-base'}`}
              placeholder="github.com/janedoe"
              delay={250}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-2">
        {!precisionMode && (
          <label className="text-base font-semibold leading-none flex items-center gap-2">
            <Globe size={14} /> Portfolio / Website
            {data.portfolio && !data.portfolio.startsWith('http') && (
              <AIBadge 
                label="AI Fix" 
                onClick={() => updatePersonal('portfolio', `https://${data.portfolio.replace(/^(http:\/\/|https:\/\/)/, '')}`)}
                className="ml-auto"
              />
            )}
          </label>
        )}
        <div className="group relative">
          {precisionMode && <Globe size={12} className="absolute left-3 top-2.5 text-muted-foreground/50" />}
          <DebouncedInput
            type="text"
            value={data.portfolio}
            onChangeValue={(value) => updatePersonal('portfolio', value)}
            className={`flex w-full rounded-xl border border-input bg-background/50 ring-offset-background placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all ${precisionMode ? 'px-8 py-2 text-xs h-9' : 'px-4 py-3 text-base'}`}
            placeholder="https://janedoe.dev"
            delay={250}
          />
        </div>
      </div>

      {template === 'modern' && (
        <div className="grid gap-2" style={{ marginTop: '0.5rem', padding: '1.25rem', border: '1px dashed var(--surface-border)', borderRadius: 'var(--radius-lg)', background: 'rgba(0,0,0,0.01)' }}>
          <label className="text-base font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2" style={{ marginBottom: '0.5rem' }}>Profile Image <span className="text-[0.75rem] font-medium px-2 py-0.5 bg-muted rounded-full text-muted-foreground" style={{ marginLeft: 'auto' }}>Modern Template</span></label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {data.profileImage ? (
              <div style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--surface-border)' }}>
                <img src={data.profileImage} alt="Profile preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button type="button" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-base font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10 shrink-0" onClick={() => updatePersonal('profileImage', '')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: 0, opacity: 0, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0'}>
                  <Trash2 size={24} />
                </button>
              </div>
            ) : (
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                <User size={32} opacity={0.3} />
              </div>
            )}
            <div style={{ flex: 1 }}>
              <button type="button" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-base font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 px-6 py-3 text-base" onClick={() => profileImageRef.current?.click()}>
                {data.profileImage ? 'Change Image' : 'Upload Image'}
              </button>
              <p className="text-[0.85rem] text-muted-foreground italic" style={{ marginTop: '0.35rem' }}>For best results, use a square aspect ratio. Max 2MB.</p>
              <input type="file" ref={profileImageRef} onChange={handleProfileImageUpload} accept="image/png, image/jpeg, image/webp" style={{ display: 'none' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.template === nextProps.template &&
         JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data);
});
