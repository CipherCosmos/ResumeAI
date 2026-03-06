import React, { memo } from 'react';
import { Target, ClipboardList } from 'lucide-react';
import { DebouncedInput, DebouncedTextarea } from '@/components/DebouncedInput';

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
}

export const TargetAndSkillsSection = memo(function TargetAndSkillsSection({ 
  targetRole, 
  jobDescription, 
  updateField, 
  SuggestionBubble 
}: Props) {

  return (
    <>
      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-2">
          <label className="text-base font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"><Target size={14} /> Target Job Title <span className="text-destructive font-normal">*</span></label>
        </div>
        <DebouncedInput
          type="text"
          value={targetRole}
          onChangeValue={(val) => updateField('targetRole', val)}
          className="flex w-full rounded-md border border-input bg-background px-4 py-3 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Senior Software Engineer"
          required
        />
        <SuggestionBubble field="targetRoleIdeation" />
        <p className="text-[0.85rem] text-muted-foreground italic">AI uses this to tailor content and ATS keywords.</p>
      </div>

      <div className="grid gap-2">
        <label className="text-base font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"><ClipboardList size={14} /> Job Description <span className="text-[0.75rem] font-medium px-2 py-0.5 bg-muted rounded-full text-muted-foreground">optional</span></label>
        <DebouncedTextarea
          value={jobDescription || ''}
          onChangeValue={(val) => updateField('jobDescription', val)}
          className="flex w-full rounded-md border border-input bg-background px-4 py-3 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 jd-textarea"
          rows={10}
          placeholder="Paste the full job description here for maximum ATS optimization..."
        />
        <p className="text-[0.85rem] text-muted-foreground italic">Pasting a JD lets AI extract keywords and score your resume against the role.</p>
      </div>
    </>
  );
}, (prevProps, nextProps) => {
  return prevProps.targetRole === nextProps.targetRole &&
         prevProps.jobDescription === nextProps.jobDescription;
});
