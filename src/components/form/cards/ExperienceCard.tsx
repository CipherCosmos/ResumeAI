import React from 'react';
import { Trash2, Plus, X, Loader2, Sparkles, ChevronUp, ChevronDown, Building2, MapPin, Calendar, Briefcase } from 'lucide-react';
import { DebouncedInput } from '@/components/DebouncedInput';
import { AIBadge } from '@/components/AIBadge';
import { useResumeStore } from '@/store/useResumeStore';
import { WorkEntry } from '@/types/resume';
import { AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

interface ExperienceCardProps {
  entry: WorkEntry;
  idx: number;
  totalEntries: number;
  bulletLoading: string | null;
  onRemove: (id: string) => void;
  onUpdate: (id: string, field: keyof WorkEntry, value: string) => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
  onUpdateBullet: (id: string, bulletIndex: number, value: string) => void;
  onRemoveBullet: (id: string, bulletIndex: number) => void;
  onAddBullet: (id: string) => void;
  onRewriteBullets: (id: string, entry: WorkEntry) => void;
  onGenerateRoleBullets: (id: string, title: string) => void;
}

export function ExperienceCard({
  entry,
  idx,
  totalEntries,
  bulletLoading,
  onRemove,
  onUpdate,
  onMove,
  onUpdateBullet,
  onRemoveBullet,
  onAddBullet,
  onRewriteBullets,
  onGenerateRoleBullets,
}: ExperienceCardProps) {
  const precisionMode = useResumeStore(state => state.precisionMode);
  return (
    <AccordionItem value={entry.id} className="rounded-xl border bg-card text-card-foreground shadow-sm group transition-colors hover:border-primary/50 overflow-hidden">
      <div className="flex items-center justify-between pr-4 bg-muted/20">
        <AccordionTrigger className={`hover:no-underline hover:bg-muted/50 px-5 transition-all text-left justify-start gap-4 ${precisionMode ? 'py-2' : 'py-4'}`}>
          <div className={`flex items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0 transition-all ${precisionMode ? 'h-7 w-7' : 'h-10 w-10'}`}>
            <Building2 size={precisionMode ? 14 : 18} />
          </div>
          <div className="flex flex-col items-start min-w-0 transition-all">
            <span className={`font-bold truncate w-full tracking-tight ${precisionMode ? 'text-xs' : 'text-base'}`}>{entry.jobTitle || 'New Role'}</span>
            {!precisionMode && <span className="text-sm text-muted-foreground font-normal truncate w-full">{entry.company || 'Company Name'}</span>}
          </div>
        </AccordionTrigger>
        <div className="flex gap-1 ml-4 shrink-0">
          {totalEntries > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onMove(entry.id, 'up'); }}
                disabled={idx === 0}
                className="h-9 w-9 inline-flex items-center justify-center rounded-md text-base font-semibold transition-colors hover:bg-accent text-muted-foreground opacity-50 group-hover:opacity-100 disabled:opacity-30"
              >
                <ChevronUp size={16} />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onMove(entry.id, 'down'); }}
                disabled={idx === totalEntries - 1}
                className="h-9 w-9 inline-flex items-center justify-center rounded-md text-base font-semibold transition-colors hover:bg-accent text-muted-foreground opacity-50 group-hover:opacity-100 disabled:opacity-30"
              >
                <ChevronDown size={16} />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRemove(entry.id); }}
                className="h-9 w-9 text-base inline-flex items-center justify-center rounded-md text-base font-semibold transition-colors hover:bg-destructive/10 hover:text-destructive text-muted-foreground opacity-50 group-hover:opacity-100"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>
      <AccordionContent className={`flex flex-col border-t bg-card transition-all ${precisionMode ? 'p-3 gap-3' : 'p-5 pt-4 gap-6'}`}>
      <div className={`grid grid-cols-1 md:grid-cols-2 ${precisionMode ? 'gap-3' : 'gap-6'}`}>
        <div className="grid gap-2">
          {!precisionMode && (
            <label className="text-base font-semibold leading-none flex items-center gap-3">
              Job Title
            </label>
          )}
          <div className="group relative">
            {precisionMode && <Briefcase size={12} className="absolute left-3 top-2.5 text-muted-foreground/50" />}
            <DebouncedInput
              type="text"
              value={entry.jobTitle}
              onChangeValue={(val) => onUpdate(entry.id, 'jobTitle', val)}
              className={`flex w-full rounded-xl border border-input bg-background/50 ring-offset-background placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all ${precisionMode ? 'px-8 py-2 text-xs h-9' : 'px-4 py-3 text-base'}`}
              placeholder="Software Engineer"
              delay={250}
            />
          </div>
        </div>
        <div className="grid gap-2">
          {!precisionMode && (
            <label className="text-base font-semibold leading-none flex items-center gap-3">
              Company
            </label>
          )}
          <div className="group relative">
            {precisionMode && <Building2 size={12} className="absolute left-3 top-2.5 text-muted-foreground/50" />}
            <DebouncedInput
              type="text"
              value={entry.company}
              onChangeValue={(val) => onUpdate(entry.id, 'company', val)}
              className={`flex w-full rounded-xl border border-input bg-background/50 ring-offset-background placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all ${precisionMode ? 'px-8 py-2 text-xs h-9' : 'px-4 py-3 text-base'}`}
              placeholder="Google"
              delay={250}
            />
          </div>
        </div>
      </div>
      <div className={`grid grid-cols-1 md:grid-cols-3 ${precisionMode ? 'gap-3' : 'gap-6'}`}>
        <div className="grid gap-2">
          {!precisionMode && (
            <label className="text-base font-semibold leading-none flex items-center gap-3">
              Location
            </label>
          )}
          <div className="group relative">
            {precisionMode && <MapPin size={12} className="absolute left-3 top-2.5 text-muted-foreground/50" />}
            <DebouncedInput
              type="text"
              value={entry.location}
              onChangeValue={(val) => onUpdate(entry.id, 'location', val)}
              className={`flex w-full rounded-xl border border-input bg-background/50 ring-offset-background placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all ${precisionMode ? 'px-8 py-2 text-xs h-9' : 'px-4 py-3 text-base'}`}
              placeholder="Mountain View, CA"
              delay={250}
            />
          </div>
        </div>
        <div className="grid gap-2">
          {!precisionMode && (
            <label className="text-base font-semibold leading-none flex items-center gap-3">
              Start
            </label>
          )}
          <div className="group relative">
            {precisionMode && <Calendar size={12} className="absolute left-3 top-2.5 text-muted-foreground/50" />}
            <DebouncedInput
              type="text"
              value={entry.startDate}
              onChangeValue={(val) => onUpdate(entry.id, 'startDate', val)}
              className={`flex w-full rounded-xl border border-input bg-background/50 ring-offset-background placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all ${precisionMode ? 'px-8 py-2 text-xs h-9' : 'px-4 py-3 text-base'}`}
              placeholder="Jan 2022"
              delay={250}
            />
          </div>
        </div>
        <div className="grid gap-2">
          {!precisionMode && (
            <label className="text-base font-semibold leading-none flex items-center gap-3">
              End
            </label>
          )}
          <div className="group relative">
            {precisionMode && <Calendar size={12} className="absolute left-3 top-2.5 text-muted-foreground/50" />}
            <DebouncedInput
              type="text"
              value={entry.endDate}
              onChangeValue={(val) => onUpdate(entry.id, 'endDate', val)}
              className={`flex w-full rounded-xl border border-input bg-background/50 ring-offset-background placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all ${precisionMode ? 'px-8 py-2 text-xs h-9' : 'px-4 py-3 text-base'}`}
              placeholder="Present"
              delay={250}
            />
          </div>
        </div>
      </div>
      <div className="grid gap-2">
        <label className="text-base font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-3">
          Achievement Bullets
        </label>
        {entry.bullets.map((b, bi) => (
          <div key={bi} className="flex items-start gap-3 mb-3">
            <span className="text-primary/50 font-bold mt-2 select-none">▸</span>
            <DebouncedInput
              type="text"
              value={b}
              onChangeValue={(val) => onUpdateBullet(entry.id, bi, val)}
              className="flex min-h-[40px] w-full rounded-md border border-input bg-background px-4 py-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
              placeholder="Accomplished X by doing Y, resulting in Z..."
              delay={150}
            />
            {entry.bullets.length > 1 && (
              <button
                type="button"
                onClick={() => onRemoveBullet(entry.id, bi)}
                className="h-9 w-9 inline-flex items-center justify-center rounded-md text-base font-semibold transition-colors hover:bg-destructive/10 hover:text-destructive text-muted-foreground shrink-0"
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => onAddBullet(entry.id)}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-base font-semibold py-2 px-3 text-primary hover:bg-primary/10 transition-colors gap-2 self-start"
        >
          <Plus size={14} /> Add bullet
        </button>
        <div className="flex flex-wrap gap-2 mt-2 ml-1">
          <AIBadge 
            label="Rewrite (XYZ)" 
            type="rewrite"
            onClick={() => onRewriteBullets(entry.id, entry)}
            loading={bulletLoading === entry.id}
          />
          {entry.jobTitle && (
            <AIBadge 
              label="Generate Ideas" 
              type="generate"
              onClick={() => onGenerateRoleBullets(entry.id, entry.jobTitle)}
              loading={bulletLoading === entry.id + '_generate'}
            />
          )}
        </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
