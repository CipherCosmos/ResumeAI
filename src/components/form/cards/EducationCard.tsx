import { Trash2, ChevronUp, ChevronDown, GraduationCap, School, Calendar, Award, Code2 } from 'lucide-react';
import { DebouncedInput } from '@/components/DebouncedInput';
import { AIBadge } from '@/components/AIBadge';
import { useResumeStore } from '@/store/useResumeStore';
import { EducationEntry } from '@/types/resume';
import { AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

interface EducationCardProps {
  edu: EducationEntry;
  idx: number;
  totalEntries: number;
  onRemove: (id: string) => void;
  onUpdate: (id: string, field: keyof EducationEntry | 'coursework', value: any) => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
  handleSuggestCoursework?: (eduId: string, degree: string) => void;
  loadingSuggestion?: string | null;
}

export function EducationCard({
  edu,
  idx,
  totalEntries,
  onRemove,
  onUpdate,
  onMove,
  handleSuggestCoursework,
  loadingSuggestion,
}: EducationCardProps) {
  const precisionMode = useResumeStore(state => state.precisionMode);
  return (
    <AccordionItem value={edu.id} className="rounded-xl border bg-card text-card-foreground shadow-sm group transition-colors hover:border-primary/50 overflow-hidden">
      <div className="flex items-center justify-between pr-4 bg-muted/20">
        <AccordionTrigger className={`hover:no-underline hover:bg-muted/50 px-5 transition-all text-left justify-start gap-4 ${precisionMode ? 'py-2' : 'py-4'}`}>
          <div className={`flex items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0 transition-all ${precisionMode ? 'h-7 w-7' : 'h-10 w-10'}`}>
            <GraduationCap size={precisionMode ? 14 : 18} />
          </div>
          <div className="flex flex-col items-start min-w-0 transition-all">
            <span className={`font-bold truncate w-full tracking-tight ${precisionMode ? 'text-xs' : 'text-base'}`}>{edu.degree || 'New Degree'}</span>
            {!precisionMode && <span className="text-sm text-muted-foreground font-normal truncate w-full">{edu.institution || 'University Name'}</span>}
          </div>
        </AccordionTrigger>
        <div className="flex gap-1 ml-4 shrink-0">
          {totalEntries > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onMove(edu.id, 'up'); }}
                disabled={idx === 0}
                className="h-9 w-9 inline-flex items-center justify-center rounded-md text-base font-semibold transition-colors hover:bg-accent text-muted-foreground opacity-50 group-hover:opacity-100 disabled:opacity-30"
              >
                <ChevronUp size={16} />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onMove(edu.id, 'down'); }}
                disabled={idx === totalEntries - 1}
                className="h-9 w-9 inline-flex items-center justify-center rounded-md text-base font-semibold transition-colors hover:bg-accent text-muted-foreground opacity-50 group-hover:opacity-100 disabled:opacity-30"
              >
                <ChevronDown size={16} />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRemove(edu.id); }}
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
          {!precisionMode && <label className="text-base font-semibold leading-none flex items-center gap-3">Degree / Program</label>}
          <div className="group relative">
            {precisionMode && <GraduationCap size={12} className="absolute left-3 top-2.5 text-muted-foreground/50" />}
            <DebouncedInput
              type="text"
              value={edu.degree}
              onChangeValue={(val) => onUpdate(edu.id, 'degree', val)}
              className={`flex w-full rounded-xl border border-input bg-background/50 ring-offset-background placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all ${precisionMode ? 'px-8 py-2 text-xs h-9' : 'px-4 py-3 text-base'}`}
              placeholder="B.S. Computer Science"
              delay={250}
            />
          </div>
        </div>
        <div className="grid gap-2">
          {!precisionMode && <label className="text-base font-semibold leading-none flex items-center gap-3">Institution</label>}
          <div className="group relative">
            {precisionMode && <School size={12} className="absolute left-3 top-2.5 text-muted-foreground/50" />}
            <DebouncedInput
              type="text"
              value={edu.institution}
              onChangeValue={(val) => onUpdate(edu.id, 'institution', val)}
              className={`flex w-full rounded-xl border border-input bg-background/50 ring-offset-background placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all ${precisionMode ? 'px-8 py-2 text-xs h-9' : 'px-4 py-3 text-base'}`}
              placeholder="Stanford University"
              delay={250}
            />
          </div>
        </div>
      </div>
      <div className={`grid grid-cols-1 md:grid-cols-3 ${precisionMode ? 'gap-3' : 'gap-6'}`}>
        <div className="grid gap-2">
          {!precisionMode && (
            <label className="text-base font-semibold leading-none flex items-center gap-3">
              Year
              {edu.year && (edu.year.length !== 4 || isNaN(Number(edu.year))) && (
                <AIBadge 
                  label="AI Fix" 
                  onClick={() => onUpdate(edu.id, 'year', edu.year.replace(/\D/g, '').substring(0, 4))}
                  className="ml-auto"
                />
              )}
            </label>
          )}
          <div className="group relative">
            {precisionMode && <Calendar size={12} className="absolute left-3 top-2.5 text-muted-foreground/50" />}
            <DebouncedInput
              type="text"
              value={edu.year}
              onChangeValue={(val) => onUpdate(edu.id, 'year', val)}
              className={`flex w-full rounded-xl border border-input bg-background/50 ring-offset-background placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all ${precisionMode ? 'px-8 py-2 text-xs h-9' : 'px-4 py-3 text-base'}`}
              placeholder="2020"
              delay={250}
            />
          </div>
        </div>
        <div className="grid gap-2">
          {!precisionMode && <label className="text-base font-semibold leading-none flex items-center gap-3">GPA (optional)</label>}
          <div className="group relative">
            {precisionMode && <Award size={12} className="absolute left-3 top-2.5 text-muted-foreground/50" />}
            <DebouncedInput
              type="text"
              value={edu.gpa}
              onChangeValue={(val) => onUpdate(edu.id, 'gpa', val)}
              className={`flex w-full rounded-xl border border-input bg-background/50 ring-offset-background placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all ${precisionMode ? 'px-8 py-2 text-xs h-9' : 'px-4 py-3 text-base'}`}
              placeholder="3.9/4.0"
              delay={250}
            />
          </div>
        </div>
        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-2">
            {!precisionMode && <label className="text-base font-semibold leading-none flex items-center gap-3">Coursework (optional)</label>}
            {handleSuggestCoursework && (
              <AIBadge 
                label={precisionMode ? "Course" : "AI Suggest"} 
                type="generate"
                onClick={() => handleSuggestCoursework(edu.id, edu.degree)}
                loading={loadingSuggestion === edu.id + '_coursework'}
                disabled={!edu.degree}
              />
            )}
          </div>
          <div className="group relative">
            {precisionMode && <Code2 size={12} className="absolute left-3 top-2.5 text-muted-foreground/50" />}
            <DebouncedInput
              type="text"
              value={edu.coursework || ''}
              onChangeValue={(val) => onUpdate(edu.id, 'coursework', val)}
              className={`flex w-full rounded-xl border border-input bg-background/50 ring-offset-background placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all ${precisionMode ? 'px-8 py-2 text-xs h-9' : 'px-4 py-3 text-base'}`}
              placeholder="Data Structures, ML, Databases"
              delay={250}
            />
          </div>
        </div>
      </div>
      </AccordionContent>
    </AccordionItem>
  );
}
