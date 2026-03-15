'use client';

import React from 'react';
import { 
    X, Building2, MapPin, DollarSign, Calendar, 
    ExternalLink, Briefcase, Zap, Sparkles, Globe,
    ChevronRight, CheckCircle2, ShieldCheck, Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useJobStore } from '@/store/useJobStore';

export function JobDetailsDrawer() {
    const { selectedJobId, setSelectedJobId, jobs, recommendations, saveApplication, applyToJob } = useJobStore();
    
    // Find the job in either jobs or recommendations
    const job = jobs.find(j => j.id === selectedJobId) || 
                (recommendations.find(r => (r as any).jobId === selectedJobId) as any);

    if (!selectedJobId) return null;

    return (
        <AnimatePresence>
            {selectedJobId && (
                <>
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedJobId(null)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                    />
                    
                    {/* Drawer Content */}
                    <motion.div 
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-full max-w-2xl bg-[#080808] border-l border-white/5 shadow-2xl z-[101] overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="relative p-8 md:p-12 pb-6 flex flex-col gap-6">
                            <button 
                                onClick={() => setSelectedJobId(null)}
                                className="absolute top-8 right-8 h-10 w-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                            >
                                <X size={18} />
                            </button>

                            <div className="flex items-center gap-3">
                                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-3 py-1 text-[0.6rem] font-black uppercase tracking-widest">
                                    Opportunity Profile
                                </Badge>
                                <div className="h-px w-12 bg-white/10" />
                                <span className="text-zinc-600 text-[0.6rem] font-bold uppercase tracking-widest">ID: {job?.id?.substring(0, 8)}</span>
                            </div>

                            <div className="space-y-4">
                                <h1 className="text-3xl md:text-5xl font-black text-white italic uppercase tracking-tighter leading-none">
                                    {job?.title}
                                </h1>
                                <div className="flex flex-wrap items-center gap-6 text-zinc-500 font-medium">
                                    <div className="flex items-center gap-2 group cursor-default">
                                        <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center group-hover:border-primary/30 transition-colors">
                                            <Building2 size={14} className="group-hover:text-primary transition-colors" />
                                        </div>
                                        <span className="text-sm font-bold uppercase tracking-wide group-hover:text-zinc-300 transition-colors">{job?.company}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center">
                                            <MapPin size={14} />
                                        </div>
                                        <span className="text-sm">{job?.location || 'Remote'}</span>
                                    </div>
                                    {job?.salary && (
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/10 flex items-center justify-center">
                                                <DollarSign size={14} className="text-emerald-500" />
                                            </div>
                                            <span className="text-sm text-emerald-500 font-bold">{job?.salary}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 mt-4">
                                <Button 
                                    onClick={() => applyToJob(job)}
                                    className="flex-1 h-16 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.2em] text-[0.7rem] rounded-2xl shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)] hover:shadow-primary/50 transition-all"
                                >
                                    Initialize Application Sequence
                                    <ExternalLink size={14} className="ml-2" />
                                </Button>
                                <Button 
                                    variant="outline"
                                    onClick={() => saveApplication(job.id)}
                                    className="h-16 w-16 bg-white/5 border-white/10 hover:bg-white/10 rounded-2xl transition-all p-0"
                                >
                                    <Zap size={20} className="text-zinc-400" />
                                </Button>
                                <Button 
                                    variant="outline"
                                    className="h-16 w-16 bg-white/5 border-white/10 hover:bg-white/10 rounded-2xl transition-all p-0"
                                >
                                    <Share2 size={20} className="text-zinc-400" />
                                </Button>
                            </div>
                        </div>

                        <Separator className="bg-white/5" />

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-12 pb-32 custom-scrollbar">
                            {/* Neural Matcher Integration (if applicable) */}
                            {job?.score && (
                                <div className="p-8 rounded-[2rem] bg-gradient-to-br from-primary/10 via-zinc-900/40 to-black border border-primary/20 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Sparkles className="text-primary" size={24} />
                                            <span className="text-[0.7rem] font-black uppercase tracking-[0.3em] text-white">Neural Alignment Score</span>
                                        </div>
                                        <span className="text-4xl font-black text-primary italic">{job.score}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${job.score}%` }}
                                            className="h-full bg-primary"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Job Description */}
                            <div className="space-y-6">
                                <h3 className="text-[0.65rem] font-black uppercase tracking-[0.4em] text-zinc-500">Mission Description</h3>
                                <div className="prose prose-invert max-w-none prose-sm prose-p:leading-relaxed prose-headings:text-white prose-strong:text-primary prose-li:marker:text-primary">
                                    {job?.description?.split('\n').map((para: string, i: number) => (
                                        <p key={i} className="text-zinc-400 mb-4">{para}</p>
                                    ))}
                                    {!job?.description && (
                                        <p className="text-zinc-600 italic">No detailed mission brief available for this role.</p>
                                    )}
                                </div>
                            </div>

                            {/* Requirements/Skills */}
                            {job?.skills && (
                                <div className="space-y-6">
                                    <h3 className="text-[0.65rem] font-black uppercase tracking-[0.4em] text-zinc-500">Required Skill Nodes</h3>
                                    <div className="flex flex-wrap gap-3">
                                        {(typeof job.skills === 'string' ? JSON.parse(job.skills) : job.skills).map((skill: string, i: number) => (
                                            <div key={i} className="px-5 py-3 rounded-xl bg-zinc-900/50 border border-white/5 text-[0.65rem] font-bold text-zinc-300 uppercase tracking-widest hover:border-primary/30 transition-all cursor-default group">
                                                <span className="group-hover:text-primary transition-colors">{skill}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Footer Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8 border-t border-white/5">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-[0.6rem] font-black text-zinc-500 uppercase tracking-[0.2em]">
                                        <Globe size={12} /> Source Vector
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="bg-white/5 border-white/5 text-zinc-400 capitalize">{job?.source || 'Direct Channel'}</Badge>
                                        <span className="text-xs text-zinc-600 font-medium">Scanned via Neural Discovery</span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-[0.6rem] font-black text-zinc-500 uppercase tracking-[0.2em]">
                                        <Calendar size={12} /> Chrono Data
                                    </div>
                                    <span className="text-xs text-zinc-400 font-bold uppercase tracking-widest">
                                        Posted: {job?.postedAt ? new Date(job.postedAt).toLocaleDateString() : 'Active Discovery'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

const customScrollbarStyle = `
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.1);
}
`;
