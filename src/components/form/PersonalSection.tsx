import React, { useRef } from 'react';
import { User, Mail, Phone, MapPin, Linkedin, Github, Globe, Trash2 } from 'lucide-react';
import { useResumeStore } from '@/store/useResumeStore';
import { DebouncedInput } from '@/components/DebouncedInput';

export function PersonalSection() {
  const { data, updatePersonal } = useResumeStore();
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
    <div className="flex flex-col gap-6 animate-in fade-in-50 duration-500 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="grid gap-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"><User size={14} /> Full Name <span className="text-destructive font-normal">*</span></label>
          <DebouncedInput
            type="text"
            value={data.personal.fullName}
            onChangeValue={(value) => updatePersonal('fullName', value)}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Jane Doe"
            required
            delay={250}
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"><Mail size={14} /> Email <span className="text-destructive font-normal">*</span></label>
          <DebouncedInput
            type="email"
            value={data.personal.email}
            onChangeValue={(value) => updatePersonal('email', value)}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="jane@example.com"
            delay={250}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="grid gap-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"><Phone size={14} /> Phone</label>
          <DebouncedInput
            type="tel"
            value={data.personal.phone}
            onChangeValue={(value) => updatePersonal('phone', value)}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="+1 234 567 8900"
            delay={250}
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"><MapPin size={14} /> Location</label>
          <DebouncedInput
            type="text"
            value={data.personal.location}
            onChangeValue={(value) => updatePersonal('location', value)}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="San Francisco, CA"
            delay={250}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="grid gap-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"><Linkedin size={14} /> LinkedIn</label>
          <DebouncedInput
            type="url"
            value={data.personal.linkedin}
            onChangeValue={(value) => updatePersonal('linkedin', value)}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="linkedin.com/in/janedoe"
            delay={250}
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"><Github size={14} /> GitHub</label>
          <DebouncedInput
            type="url"
            value={data.personal.github}
            onChangeValue={(value) => updatePersonal('github', value)}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="github.com/janedoe"
            delay={250}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"><Globe size={14} /> Portfolio / Website</label>
        <DebouncedInput
          type="url"
          value={data.personal.portfolio}
          onChangeValue={(value) => updatePersonal('portfolio', value)}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="https://janedoe.dev"
          delay={250}
        />
      </div>

      {data.template === 'modern' && (
        <div className="grid gap-2" style={{ marginTop: '0.5rem', padding: '1.25rem', border: '1px dashed var(--surface-border)', borderRadius: 'var(--radius-lg)', background: 'rgba(0,0,0,0.01)' }}>
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2" style={{ marginBottom: '0.5rem' }}>Profile Image <span className="text-[0.65rem] font-medium px-2 py-0.5 bg-muted rounded-full text-muted-foreground" style={{ marginLeft: 'auto' }}>Modern Template</span></label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {data.personal.profileImage ? (
              <div style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--surface-border)' }}>
                <img src={data.personal.profileImage} alt="Profile preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button type="button" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10 shrink-0" onClick={() => updatePersonal('profileImage', '')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: 0, opacity: 0, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0'}>
                  <Trash2 size={24} />
                </button>
              </div>
            ) : (
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                <User size={32} opacity={0.3} />
              </div>
            )}
            <div style={{ flex: 1 }}>
              <button type="button" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2" onClick={() => profileImageRef.current?.click()}>
                {data.personal.profileImage ? 'Change Image' : 'Upload Image'}
              </button>
              <p className="text-[0.85rem] text-muted-foreground italic" style={{ marginTop: '0.35rem' }}>For best results, use a square aspect ratio. Max 2MB.</p>
              <input type="file" ref={profileImageRef} onChange={handleProfileImageUpload} accept="image/png, image/jpeg, image/webp" style={{ display: 'none' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
