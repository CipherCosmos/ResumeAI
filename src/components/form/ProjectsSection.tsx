import React from 'react';
import { Plus, Globe } from 'lucide-react';
import { useResumeStore } from '@/store/useResumeStore';
import { ProjectCard } from './cards/ProjectCard';

export function ProjectsSection({
  handleRewriteProjectDesc,
  loadingSuggestion
}: {
  handleRewriteProjectDesc: (id: string, desc: string) => void;
  loadingSuggestion: string | null;
}) {
  const { data, updateProject, addProject, removeProject } = useResumeStore();

  return (
    <div className="flex flex-col gap-6 animate-in fade-in-50 duration-500 animate-fade-in">
      {data.projects.length === 0 && (
        <div className="flex flex-col items-center justify-center p-8 text-center gap-2 bg-muted/20 rounded-xl border border-dashed text-muted-foreground">
          <Globe size={24} color="var(--primary)" style={{ opacity: 0.4 }} />
          <p>No projects yet. Add your notable projects to stand out.</p>
        </div>
      )}
      {data.projects.map((proj, idx) => (
        <ProjectCard
          key={proj.id}
          proj={proj}
          idx={idx}
          loadingSuggestion={loadingSuggestion}
          onRemove={removeProject}
          onUpdate={updateProject}
          onRewriteDesc={handleRewriteProjectDesc}
        />
      ))}
      <button 
        type="button" 
        onClick={addProject} 
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full"
      >
        <Plus size={16} /> Add Project
      </button>
    </div>
  );
}
