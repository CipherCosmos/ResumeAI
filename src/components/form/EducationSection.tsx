import React from 'react';
import { Plus } from 'lucide-react';
import { useResumeStore } from '@/store/useResumeStore';
import { EducationCard } from './cards/EducationCard';

export function EducationSection() {
  const { data, updateEducation, addEducation, removeEducation } = useResumeStore();

  return (
    <div className="flex flex-col gap-6 animate-in fade-in-50 duration-500 animate-fade-in">
      {data.education.map((edu, idx) => (
        <EducationCard 
          key={edu.id}
          edu={edu}
          idx={idx}
          totalEntries={data.education.length}
          onRemove={removeEducation}
          onUpdate={updateEducation as any}
        />
      ))}
      <button 
        type="button" 
        onClick={addEducation} 
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full"
      >
        <Plus size={16} /> Add Education
      </button>
    </div>
  );
}
