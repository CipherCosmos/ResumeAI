'use client';

import React from 'react';
import { 
    Building2, MapPin, DollarSign, TrendingUp, ExternalLink, 
    Plus, Sparkles, Clock, Globe, Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

import { useJobStore } from '@/store/useJobStore';

interface JobCardProps {
    job: any;
    onSave: (id: string) => void;
    onApply: (job: any) => void;
}

export function JobCard({ job, onSave, onApply }: JobCardProps) {
    const { setSelectedJobId } = useJobStore();
    const skills = Array.isArray(job.skills) ? job.skills : [];
    
    // Smart Tags Logic
    const isNew = job.postedAt && (new Date().getTime() - new Date(job.postedAt).getTime() < 86400000 * 2);
    const hasHighSalary = job.salaryMin && job.salaryMin >= 150000;

    return (
        <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/10 to-violet-500/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
            
            <Card 
                onClick={() => setSelectedJobId(job.id)}
                className="relative bg-zinc-950/40 border-white/5 backdrop-blur-xl rounded-xl p-3 px-4 transition-all duration-300 group-hover:translate-y-[-2px] group-hover:border-primary/30 cursor-pointer overflow-hidden"
            >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left: Company & Title */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center shrink-0 group-hover:border-primary/30 transition-colors mt-0.5">
                            <Building2 className="text-zinc-600 group-hover:text-primary transition-colors" size={18} />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                <h3 className="text-[0.95rem] font-black text-white group-hover:text-primary transition-colors truncate uppercase italic tracking-tight">
                                    {job.title}
                                </h3>
                                <div className="flex gap-1">
                                    {job.isSemantic && <Badge className="bg-primary/5 text-primary border-primary/10 text-[0.5rem] uppercase px-1 py-0 h-4">Neural</Badge>}
                                    {isNew && <Badge className="bg-emerald-500/5 text-emerald-500 border-emerald-500/10 text-[0.5rem] uppercase px-1 py-0 h-4">Fresh</Badge>}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[0.7rem] font-bold text-zinc-500 uppercase tracking-wider">{job.company || 'Unknown'}</span>
                                {job.source && <span className="text-[0.6rem] text-zinc-700 font-medium">via {job.source}</span>}
                            </div>
                        </div>
                    </div>

                    {/* Middle: Metadata Row */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 md:px-6 md:border-x border-white/5 shrink-0">
                        <div className="flex items-center gap-1.5 text-zinc-400">
                            <MapPin size={11} className="text-zinc-600" />
                            <span className="text-[0.7rem] font-bold truncate max-w-[100px]">{job.location || 'Remote'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-400">
                            <DollarSign size={11} className="text-emerald-500/50" />
                            <span className="text-[0.7rem] font-bold">{job.salary || 'Comp'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-400">
                            <Briefcase size={11} className="text-blue-400/50" />
                            <span className="text-[0.7rem] font-bold capitalize">{job.employmentType || 'FT'}</span>
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0 md:pl-2" onClick={(e) => e.stopPropagation()}>
                        <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => onSave(job.id)}
                            className="h-8 w-8 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 text-zinc-500 hover:text-white transition-all"
                        >
                            <Plus size={16} />
                        </Button>
                        <Button 
                            onClick={() => onApply(job)}
                            className="h-8 px-4 rounded-lg bg-primary hover:bg-primary/90 text-white font-black text-[0.65rem] uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]"
                        >
                            Apply
                            <ExternalLink size={12} className="ml-2 opacity-50" />
                        </Button>
                    </div>
                </div>

                {/* Footer: Snippet & Skills */}
                <div className="mt-3 pt-3 border-t border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {job.description && (
                        <p className="text-[0.65rem] text-zinc-500 line-clamp-1 italic opacity-60 flex-1">
                            "{job.description.replace(/[#*`]/g, '')}"
                        </p>
                    )}
                    <div className="flex flex-wrap gap-1 md:justify-end shrink-0">
                        {skills.slice(0, 4).map((skill: string) => (
                            <div 
                                key={skill} 
                                className="px-2 py-0.5 rounded bg-zinc-900/50 text-zinc-600 text-[0.55rem] font-black uppercase tracking-widest border border-white/5"
                            >
                                {skill}
                            </div>
                        ))}
                    </div>
                </div>
            </Card>
        </div>
    );
}
