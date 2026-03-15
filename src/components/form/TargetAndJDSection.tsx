import React, { memo } from 'react';
import { Target, ClipboardList } from 'lucide-react';
import { DebouncedInput, DebouncedTextarea } from '@/components/DebouncedInput';
import { AIBadge } from '@/components/AIBadge';
import { useResumeStore } from '@/store/useResumeStore';

interface Props {
  targetRole: string;
  jobDescription?: string;
  updateField: any;
  SuggestionBubble: React.FC<{ field: string }>;
  loadingSuggestion?: string | null;
  fetchSuggestion?: any;
  handleAddChip?: any;
  onSkillsChange?: any;
  skillInput?: string;
  setSkillInput?: any;
  handleSuggestTargetRoles?: () => void;
  handleExtractKeywords?: () => void;
}

export const TargetAndSkillsSection = memo(function TargetAndSkillsSection({ 
  targetRole, 
  jobDescription, 
  updateField, 
  SuggestionBubble,
  loadingSuggestion,
  handleSuggestTargetRoles,
  handleExtractKeywords
}: Props) {
  const precisionMode = useResumeStore(state => state.precisionMode);

  return (
    <>
      <div className={`grid ${precisionMode ? 'gap-3' : 'gap-4'}`}>
        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-2">
            {!precisionMode && <label className="text-base font-semibold leading-none flex items-center gap-2"><Target size={14} /> Target Job Title <span className="text-destructive font-normal">*</span></label>}
            <AIBadge 
              label={precisionMode ? "Role Ideas" : "AI Role Ideas"} 
              type="generate"
              onClick={() => handleSuggestTargetRoles?.()}
              loading={loadingSuggestion === 'targetRoleIdeation'}
            />
          </div>
          <div className="group relative">
            {precisionMode && <Target size={12} className="absolute left-3 top-2.5 text-muted-foreground/50" />}
            <DebouncedInput
              type="text"
              value={targetRole}
              onChangeValue={(val) => updateField('targetRole', val)}
              className={`flex w-full rounded-xl border border-input bg-background/50 ring-offset-background placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all ${precisionMode ? 'px-8 py-2 text-xs h-9' : 'px-4 py-3 text-base'}`}
              placeholder="Senior Software Engineer"
              required
            />
          </div>
          <SuggestionBubble field="targetRoleIdeation" />
          {!precisionMode && <p className="text-[0.85rem] text-muted-foreground italic">AI uses this to tailor content and ATS keywords.</p>}
        </div>
      </div>

      <div className={`grid ${precisionMode ? 'gap-3' : 'gap-4'}`}>
        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-2">
            {!precisionMode && <label className="text-base font-semibold leading-none flex items-center gap-2"><ClipboardList size={14} /> Job Description <span className="text-[0.75rem] font-medium px-2 py-0.5 bg-muted rounded-full text-muted-foreground">optional</span></label>}
            {jobDescription && (
              <AIBadge 
                label={precisionMode ? "Extract" : "AI Extract Skills"} 
                type="analyze"
                onClick={() => handleExtractKeywords?.()}
                loading={loadingSuggestion === 'extractKeywords'}
              />
            )}
          </div>
          <DebouncedTextarea
            value={jobDescription || ''}
            onChangeValue={(val) => updateField('jobDescription', val)}
            className={`flex w-full rounded-xl border border-input bg-background/50 ring-offset-background placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all jd-textarea ${precisionMode ? 'px-4 py-2 text-xs h-32' : 'px-4 py-3 text-base h-[300px]'}`}
            rows={precisionMode ? 5 : 10}
            placeholder="Paste the full job description here for maximum ATS optimization..."
          />
          <SuggestionBubble field="extractKeywords" />
          {!precisionMode && <p className="text-[0.85rem] text-muted-foreground italic">Pasting a JD lets AI extract keywords and score your resume against the role.</p>}
        </div>
      </div>
    </>
  );
}, (prevProps, nextProps) => {
  return prevProps.targetRole === nextProps.targetRole &&
         prevProps.jobDescription === nextProps.jobDescription &&
         prevProps.loadingSuggestion === nextProps.loadingSuggestion;
});
