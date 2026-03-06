import React, { memo } from 'react';
import { Plus, Globe } from 'lucide-react';
import { ProjectEntry } from '@/types/resume';
import { ProjectCard } from './cards/ProjectCard';

interface Props {
  handleRewriteProjectDesc: (id: string, desc: string) => void;
  handleSuggestTechStack: (id: string, desc: string) => void;
  loadingSuggestion: string | null;
  projects: ProjectEntry[];
  updateProject: any;
  moveProject: any;
  addProject: () => void;
  removeProject: (id: string) => void;
}

export const ProjectsSection = memo(function ProjectsSection({
  handleRewriteProjectDesc,
  handleSuggestTechStack,
  loadingSuggestion,
  projects,
  updateProject,
  moveProject,
  addProject,
  removeProject
}: Props) {

  return (
    <div className="flex flex-col gap-6 animate-in fade-in-50 duration-500 animate-fade-in">
      {projects.length === 0 && (
        <div className="flex flex-col items-center justify-center p-8 text-center gap-2 bg-muted/20 rounded-xl border border-dashed text-muted-foreground">
          <Globe size={24} color="var(--primary)" style={{ opacity: 0.4 }} />
          <p>No projects yet. Add your notable projects to stand out.</p>
        </div>
      )}
      {projects.map((proj, idx) => (
        <ProjectCard
          key={proj.id}
          proj={proj}
          idx={idx}
          totalEntries={projects.length}
          loadingSuggestion={loadingSuggestion}
          onRemove={removeProject}
          onUpdate={updateProject}
          onMove={moveProject}
          onRewriteDesc={handleRewriteProjectDesc}
          onSuggestTechStack={handleSuggestTechStack}
        />
      ))}
      <button 
        type="button" 
        onClick={addProject} 
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-base font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 px-6 py-3 text-base w-full"
      >
        <Plus size={16} /> Add Project
      </button>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.loadingSuggestion === nextProps.loadingSuggestion &&
         JSON.stringify(prevProps.projects) === JSON.stringify(nextProps.projects);
});
