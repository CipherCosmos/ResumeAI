import React from 'react';
import { Trash2, Loader2, Sparkles } from 'lucide-react';
import { DebouncedInput, DebouncedTextarea } from '@/components/DebouncedInput';
import { ProjectEntry } from '@/types/resume';

interface ProjectCardProps {
  proj: ProjectEntry;
  idx: number;
  loadingSuggestion: string | null;
  onRemove: (id: string) => void;
  onUpdate: (id: string, field: keyof ProjectEntry, value: string) => void;
  onRewriteDesc: (id: string, desc: string) => void;
}

export function ProjectCard({
  proj,
  idx,
  loadingSuggestion,
  onRemove,
  onUpdate,
  onRewriteDesc,
}: ProjectCardProps) {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-5 flex flex-col gap-4 relative group transition-colors hover:border-primary/50">
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-5 flex flex-col gap-4 relative group transition-colors hover:border-primary/50-header">
        <span className="rounded-xl border bg-card text-card-foreground shadow-sm p-5 flex flex-col gap-4 relative group transition-colors hover:border-primary/50-number">#{idx + 1}</span>
        <button
          type="button"
          onClick={() => onRemove(proj.id)}
          className="h-8 w-8 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-destructive/10 hover:text-destructive text-muted-foreground opacity-50 group-hover:opacity-100"
        >
          <Trash2 size={14} />
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="grid gap-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2-sm">Project Name</label>
          <DebouncedInput
            type="text"
            value={proj.name}
            onChangeValue={(val) => onUpdate(proj.id, 'name', val)}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="AI Resume Builder"
            delay={250}
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2-sm">Tech Stack</label>
          <DebouncedInput
            type="text"
            value={proj.techStack}
            onChangeValue={(val) => onUpdate(proj.id, 'techStack', val)}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="React, Next.js, Python"
            delay={250}
          />
        </div>
      </div>
      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2-sm">Description</label>
          <button
            type="button"
            onClick={() => onRewriteDesc(proj.id, proj.description)}
            disabled={loadingSuggestion === proj.id || !proj.description}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-accent text-accent hover:bg-accent/10 h-8 px-3 gap-1.5"
            style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
          >
            {loadingSuggestion === proj.id ? (
              <>
                <Loader2 size={12} className="animate-spin" /> Rewriting...
              </>
            ) : (
              <>
                <Sparkles size={12} /> AI Rewrite
              </>
            )}
          </button>
        </div>
        <DebouncedTextarea
          value={proj.description}
          onChangeValue={(val) => onUpdate(proj.id, 'description', val)}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          rows={2}
          placeholder="Built a full-stack application that..."
          delay={250}
        />
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2-sm">Link</label>
        <DebouncedInput
          type="url"
          value={proj.link}
          onChangeValue={(val) => onUpdate(proj.id, 'link', val)}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="https://github.com/..."
          delay={250}
        />
      </div>
    </div>
  );
}
