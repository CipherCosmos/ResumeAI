import React, { memo } from 'react';
import { Plus, GraduationCap } from 'lucide-react';
import { EducationEntry } from '@/types/resume';
import { EducationCard } from './cards/EducationCard';

interface Props {
  education: EducationEntry[];
  updateEducation: any;
  moveEducation: any;
  addEducation: () => void;
  removeEducation: (id: string) => void;
}

export const EducationSection = memo(function EducationSection({
  education,
  updateEducation,
  moveEducation,
  addEducation,
  removeEducation
}: Props) {

  return (
    <div className="flex flex-col gap-6 animate-in fade-in-50 duration-500 animate-fade-in">
      {education.length === 0 && (
        <div className="flex flex-col items-center justify-center p-8 text-center gap-2 bg-muted/20 rounded-xl border border-dashed text-muted-foreground">
          <GraduationCap size={24} color="var(--primary)" style={{ opacity: 0.4 }} />
          <p>No education added yet. Include your degrees, bootcamps, or certifications.</p>
        </div>
      )}
      {education.map((edu, idx) => (
        <EducationCard 
          key={edu.id}
          edu={edu}
          idx={idx}
          totalEntries={education.length}
          onRemove={removeEducation}
          onMove={moveEducation}
          onUpdate={updateEducation as any}
        />
      ))}
      <button 
        type="button" 
        onClick={addEducation} 
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-base font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 px-6 py-3 text-base w-full"
      >
        <Plus size={16} /> Add Education
      </button>
    </div>
  );
}, (prevProps, nextProps) => {
  return JSON.stringify(prevProps.education) === JSON.stringify(nextProps.education);
});
