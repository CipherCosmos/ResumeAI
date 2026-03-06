import React from 'react';
import { Plus } from 'lucide-react';
import { useResumeStore } from '@/store/useResumeStore';
import { WorkEntry } from '@/types/resume';
import { ExperienceCard } from './cards/ExperienceCard';

export function ExperienceSection({
  handleRewriteBullets,
  handleGenerateRoleBullets,
  bulletLoading
}: {
  handleRewriteBullets: (id: string, entry: WorkEntry) => void;
  handleGenerateRoleBullets: (id: string, title: string) => void;
  bulletLoading: string | null;
}) {
  const { data, updateWork, addWorkEntry, removeWorkEntry, updateBullet, removeBullet, addBullet } = useResumeStore();

  return (
    <div className="flex flex-col gap-6 animate-in fade-in-50 duration-500 animate-fade-in">
      {data.experience.map((entry, idx) => (
        <ExperienceCard
          key={entry.id}
          entry={entry}
          idx={idx}
          totalEntries={data.experience.length}
          bulletLoading={bulletLoading}
          onRemove={removeWorkEntry}
          onUpdate={updateWork}
          onUpdateBullet={updateBullet}
          onRemoveBullet={removeBullet}
          onAddBullet={addBullet}
          onRewriteBullets={handleRewriteBullets}
          onGenerateRoleBullets={handleGenerateRoleBullets}
        />
      ))}
      <button 
        type="button" 
        onClick={addWorkEntry} 
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full"
      >
        <Plus size={16} /> Add Work Experience
      </button>
    </div>
  );
}
