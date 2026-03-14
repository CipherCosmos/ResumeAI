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
            {/* Ambient Glow */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-violet-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            
            <Card 
                onClick={() => setSelectedJobId(job.id)}
                className="relative bg-zinc-950/40 border-white/5 backdrop-blur-xl rounded-2xl p-6 transition-all duration-300 group-hover:translate-y-[-2px] group-hover:border-primary/30 cursor-pointer"
            >
                <div className="flex justify-between items-start gap-4">
                    <div className="flex gap-4">
                        <div className="h-14 w-14 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center shrink-0 group-hover:border-primary/30 transition-colors">
                            <Building2 className="text-zinc-500 group-hover:text-primary transition-colors" size={24} />
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors line-clamp-1">
                                    {job.title}
                                </h3>
                                {job.isSemantic && (
                                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 text-[0.6rem] uppercase tracking-tighter py-0">
                                        Neural Match
                                    </Badge>
                                )}
                                {isNew && (
                                    <Badge variant="outline" className="bg-emerald-500/5 text-emerald-500 border-emerald-500/10 text-[0.6rem] uppercase tracking-tighter py-0">
                                        Fresh
                                    </Badge>
                                )}
                                {hasHighSalary && (
                                    <Badge variant="outline" className="bg-amber-500/5 text-amber-500 border-amber-500/10 text-[0.6rem] uppercase tracking-tighter py-0">
                                        High Value
                                    </Badge>
                                )}
                            </div>
                            <p className="text-zinc-400 font-medium flex items-center gap-1.5 text-sm">
                                {job.company}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => onSave(job.id)}
                            className="h-10 w-10 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 text-zinc-400 hover:text-white transition-all"
                        >
                            <Plus size={20} />
                        </Button>
                        <Button 
                            onClick={() => onApply(job)}
                            className="rounded-xl px-5 h-10 bg-primary hover:bg-primary/90 text-white font-bold text-sm transition-all shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)] hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.4)]"
                        >
                            Apply
                            <ExternalLink size={14} className="ml-2" />
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                    <div className="flex items-center gap-2 text-zinc-500">
                        <div className="h-8 w-8 rounded-lg bg-zinc-900/50 flex items-center justify-center">
                            <MapPin size={14} />
                        </div>
                        <span className="text-xs font-medium">{job.location || 'Remote'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-500">
                        <div className="h-8 w-8 rounded-lg bg-zinc-900/50 flex items-center justify-center">
                            <DollarSign size={14} />
                        </div>
                        <span className="text-xs font-medium">{job.salary || 'Competitive'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-500 col-span-2 md:col-span-1">
                        <div className="h-8 w-8 rounded-lg bg-zinc-900/50 flex items-center justify-center">
                            <TrendingUp size={14} />
                        </div>
                        <span className="text-xs font-medium capitalize">{job.experienceLevel || 'All Levels'}</span>
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/5 flex flex-wrap gap-2">
                    {skills.slice(0, 5).map((skill: string) => (
                        <div 
                            key={skill} 
                            className="px-3 py-1 rounded-lg bg-zinc-900/50 text-zinc-400 text-[0.65rem] font-bold uppercase tracking-wider border border-white/5 group-hover:border-primary/20 group-hover:text-zinc-300 transition-colors"
                        >
                            {skill}
                        </div>
                    ))}
                    {skills.length > 5 && (
                        <div className="px-3 py-1 rounded-lg text-zinc-600 text-[0.65rem] font-bold uppercase tracking-wider">
                            +{skills.length - 5} More
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
