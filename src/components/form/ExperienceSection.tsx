import React, { memo } from 'react';
import { Plus, Briefcase } from 'lucide-react';
import { WorkEntry } from '@/types/resume';
import { ExperienceCard } from './cards/ExperienceCard';

interface Props {
  handleRewriteBullets: (id: string, entry: WorkEntry) => void;
  handleGenerateRoleBullets: (id: string, title: string) => void;
  bulletLoading: string | null;
  experience: WorkEntry[];
  updateWork: any;
  moveWork: any;
  addWorkEntry: () => void;
  removeWorkEntry: (id: string) => void;
  updateBullet: any;
  removeBullet: any;
  addBullet: any;
}

export const ExperienceSection = memo(function ExperienceSection({
  handleRewriteBullets,
  handleGenerateRoleBullets,
  bulletLoading,
  experience,
  updateWork,
  moveWork,
  addWorkEntry,
  removeWorkEntry,
  updateBullet,
  removeBullet,
  addBullet
}: {
  handleRewriteBullets: (id: string, entry: WorkEntry) => void;
  handleGenerateRoleBullets: (id: string, title: string) => void;
  bulletLoading: string | null;
  experience: WorkEntry[];
  updateWork: any;
  moveWork: any;
  addWorkEntry: () => void;
  removeWorkEntry: (id: string) => void;
  updateBullet: any;
  removeBullet: any;
  addBullet: any;
}) {

  return (
    <div className="flex flex-col gap-6 animate-in fade-in-50 duration-500 animate-fade-in">
      {experience.length === 0 && (
        <div className="flex flex-col items-center justify-center p-8 text-center gap-2 bg-muted/20 rounded-xl border border-dashed text-muted-foreground">
          <Briefcase size={24} color="var(--primary)" style={{ opacity: 0.4 }} />
          <p>No work experience added yet. List your relevant roles to show your career progression.</p>
        </div>
      )}
      {experience.map((entry, idx) => (
        <ExperienceCard
          key={entry.id}
          entry={entry}
          idx={idx}
          totalEntries={experience.length}
          bulletLoading={bulletLoading}
          onRemove={removeWorkEntry}
          onUpdate={updateWork}
          onMove={moveWork}
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
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-base font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 px-6 py-3 text-base w-full"
      >
        <Plus size={16} /> Add Work Experience
      </button>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.bulletLoading === nextProps.bulletLoading &&
         JSON.stringify(prevProps.experience) === JSON.stringify(nextProps.experience);
});
