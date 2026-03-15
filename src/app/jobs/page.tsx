'use client';

import React, { useState, useEffect } from 'react';
import { 
    Search, MapPin, Briefcase, DollarSign, TrendingUp, Sparkles, 
    CheckCircle2, AlertCircle, BarChart3, Loader2, ChevronRight,
    Filter, Zap, Plus, ExternalLink, Calendar, Globe, Building2,
    LayoutGrid, List, SlidersHorizontal
} from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { useSession } from 'next-auth/react';
import { useJobStore } from '@/store/useJobStore';
import { JobCard } from '@/components/jobs/JobCard';
import { JobCardSkeleton } from '@/components/jobs/JobCardSkeleton';
import { JobFiltersSidebar } from '@/components/jobs/JobFiltersSidebar';
import { JobDetailsDrawer } from '@/components/jobs/JobDetailsDrawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Helpers ─────────────────────────────────────
const fetcher = (url: string) => fetch(url).then(res => res.json());

// ─── Constants ───────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
    saved: 'Saved',
    applied: 'Applied',
    screening: 'Screening',
    interview: 'Interview',
    offer: 'Offer',
    rejected: 'Rejected',
};

// ─── Main Page ───────────────────────────────────────

export default function JobsPage() {
    const { data: session } = useSession();
    const { 
        activeTab, setActiveTab, 
        jobs, fetchJobs, 
        recommendations, fetchRecommendations,
        applications, fetchApplications,
        skillGap, fetchSkillGap,
        isLoadingJobs, isLoadingRecs, isLoadingApps, isLoadingGap,
        filters, setFilters
    } = useJobStore();

    const [selectedResumeId, setSelectedResumeId] = useState<string>('');
    const [resumes, setResumes] = useState<any[]>([]);
    const [isFilterOpen, setIsFilterOpen] = useState(true);

    useEffect(() => {
        if (activeTab === 'browse') fetchJobs();
        if (activeTab === 'applications') fetchApplications();
        if (session) {
            fetch('/api/resumes').then(res => res.json()).then(data => {
                const resumeList = data.resumes || [];
                setResumes(resumeList);
                if (resumeList.length > 0) setSelectedResumeId(resumeList[0].id);
            });
        }
    }, [activeTab, session, fetchJobs, fetchApplications]);

    return (
        <div className="h-screen flex flex-col bg-[#050505] text-zinc-300 selection:bg-primary/30 overflow-hidden">
            {/* Ambient Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/5 rounded-full blur-[120px]" />
            </div>

            {/* Compact Header - STATIONARY */}
            <header className="relative z-20 bg-[#050505]/80 backdrop-blur-md border-b border-white/5 shrink-0">
                <div className="container mx-auto max-w-[1600px] px-4 md:px-12 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary to-violet-600 flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                            <Zap className="text-white" size={20} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-white italic tracking-tight uppercase leading-none">
                                Neural <span className="text-primary not-italic">Discovery</span>
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                                <span className="text-[0.55rem] font-bold text-zinc-500 uppercase tracking-widest leading-none">Intelligence v2.0</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center bg-zinc-900/60 border border-white/5 p-1 rounded-xl">
                            {[
                                { id: 'browse', label: 'Feed', icon: LayoutGrid },
                                { id: 'recommended', label: 'Matches', icon: Sparkles },
                                { id: 'applications', label: 'Tracker', icon: Briefcase },
                                { id: 'insights', label: 'Insights', icon: BarChart3 },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[0.65rem] font-black uppercase tracking-wider transition-all ${
                                        activeTab === tab.id 
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                                        : 'text-zinc-500 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    <tab.icon size={14} />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                </button>
                            ))}
                        </div>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className="lg:hidden h-10 w-10 text-zinc-500 border border-white/5 bg-zinc-900/40 rounded-xl"
                        >
                            <Filter size={18} />
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Discovery Interface - FLEX FILL */}
            <div className="flex-1 overflow-hidden container mx-auto max-w-[1600px] px-4 md:px-12 relative z-10 flex flex-col lg:flex-row gap-8 py-6">
                {(activeTab === 'browse') && (
                    <aside className={`lg:w-80 shrink-0 transition-all duration-500 flex flex-col ${isFilterOpen ? 'opacity-100' : 'hidden lg:block opacity-50'}`}>
                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-zinc-900/20 border border-white/5 rounded-2xl p-4">
                            <JobFiltersSidebar 
                                filters={filters} 
                                onFilterChange={setFilters} 
                                onApply={fetchJobs} 
                            />
                        </div>
                    </aside>
                )}

                {/* Independent Scroll Results */}
                <main className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10">
                    {activeTab === 'browse' && (
                        <BrowseTab 
                            jobs={jobs} 
                            isLoading={isLoadingJobs} 
                            onSearch={(q) => useJobStore.getState().setFilters({ search: q })}
                        />
                    )}
                    
                    {activeTab === 'recommended' && (
                        <RecommendedTab 
                            recommendations={recommendations} 
                            isLoading={isLoadingRecs}
                            resumes={resumes}
                            selectedResumeId={selectedResumeId}
                            onSelectResume={setSelectedResumeId}
                            onMatch={() => fetchRecommendations(selectedResumeId)}
                        />
                    )}
                    {activeTab === 'applications' && (
                        <ApplicationsTab 
                            applications={applications} 
                            isLoading={isLoadingApps} 
                            onRefresh={() => fetchApplications()}
                        />
                    )}
                    {activeTab === 'insights' && (
                        <InsightsTab 
                            skillGap={skillGap} 
                            isLoading={isLoadingGap} 
                            onRefresh={() => selectedResumeId && fetchSkillGap(selectedResumeId)}
                        />
                    )}
                </main>
            </div>
        </div>
    );
}

// ─── Browse Tab ──────────────────────────────────────

function BrowseTab({ jobs, isLoading, onSearch }: { jobs: any[], isLoading: boolean, onSearch: (q: string) => void }) {
    const { saveApplication, applyToJob, filters, setFilters, fetchJobs } = useJobStore();
    const [localSearch, setLocalSearch] = useState(filters.search);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (localSearch !== filters.search) {
                setFilters({ search: localSearch });
                fetchJobs();
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [localSearch, fetchJobs, setFilters, filters.search]);

    return (
        <div className="space-y-6">
            {/* Search Bar Area - STICKY INSIDE SCROLLABLE */}
            <div className="sticky top-0 z-30 pb-4 bg-[#050505] -mx-1 px-1">
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-violet-500/10 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
                    <div className="relative flex items-center bg-zinc-900/60 border border-white/10 rounded-xl p-1 backdrop-blur-3xl group-focus-within:border-primary/50 transition-all duration-500">
                        <div className="flex items-center justify-center h-10 w-12 shrink-0">
                            <Search className="text-zinc-600 group-focus-within:text-primary transition-colors" size={16} />
                        </div>
                        <input 
                            type="text" 
                            value={localSearch}
                            placeholder="Quantum scan jobs, companies, or tech stack..."
                            className="flex-1 bg-transparent border-none py-2 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-0 text-[0.85rem] font-bold"
                            onChange={(e) => setLocalSearch(e.target.value)}
                        />
                        {isLoading && (
                            <div className="pr-4">
                                <Loader2 size={14} className="animate-spin text-primary" />
                            </div>
                        )}
                        <Button 
                            className="h-8 rounded-lg bg-primary hover:bg-primary/90 text-white font-black text-[0.6rem] uppercase tracking-widest px-6"
                        >
                            Execute
                        </Button>
                    </div>
                </div>
            </div>

            <JobDetailsDrawer />

            {/* Content Area */}
            {isLoading && jobs.length === 0 ? (
                <div className="grid grid-cols-1 gap-6">
                    {[1, 2, 3].map(i => <JobCardSkeleton key={i} />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {jobs.length === 0 ? (
                        <div className="bg-zinc-900/20 border border-white/5 rounded-[2rem] p-20 text-center space-y-6">
                            <div className="inline-flex h-20 w-20 rounded-3xl bg-zinc-900 border border-white/5 items-center justify-center text-zinc-700 mx-auto">
                                <Search size={32} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-white">Discovery Void</h3>
                                <p className="text-zinc-500 text-sm max-w-xs mx-auto font-medium">
                                    No roles found matching your current neural parameters. Try expanding your search or adjusting filters.
                                </p>
                            </div>
                            <Button 
                                variant="outline" 
                                onClick={() => {
                                    setLocalSearch('');
                                    setFilters({ search: '', location: '', level: '', type: '' });
                                    fetchJobs();
                                }}
                                className="rounded-xl border-white/5 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white"
                            >
                                Clear All Parameters
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 px-3 py-1 text-[0.6rem] font-black uppercase">
                                        {jobs.length} Opportunities Found
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 bg-zinc-900/50 border border-white/5 p-1 rounded-xl mr-2">
                                        {[
                                            { id: 'relevance' as const, label: 'Relevance' },
                                            { id: 'newest' as const, label: 'Newest' },
                                            { id: 'salary' as const, label: 'Salary' }
                                        ].map(s => (
                                            <button 
                                                key={s.id}
                                                onClick={() => {
                                                    setFilters({ sortBy: s.id });
                                                    fetchJobs();
                                                }}
                                                className={`px-3 py-1 text-[0.6rem] font-black uppercase tracking-widest rounded-lg transition-all ${
                                                    filters.sortBy === s.id 
                                                        ? 'bg-primary text-white shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)]' 
                                                        : 'text-zinc-500 hover:text-white hover:bg-white/5'
                                                }`}
                                            >
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white rounded-lg">
                                        <LayoutGrid size={16} />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white rounded-lg">
                                        <List size={16} />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white rounded-lg lg:hidden">
                                        <SlidersHorizontal size={16} />
                                    </Button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                {jobs.map((job, idx) => (
                                    <motion.div
                                        key={job.id}
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: (idx % 15) * 0.03 }}
                                    >
                                        <JobCard 
                                            job={job} 
                                            onSave={saveApplication}
                                            onApply={applyToJob}
                                        />
                                    </motion.div>
                                ))}
                                
                                <InfiniteScrollWatcher />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function InfiniteScrollWatcher() {
    const { pagination, loadMoreJobs, isLoadingJobs } = useJobStore();
    const { ref, inView } = useInView({
        threshold: 0,
        triggerOnce: false
    });

    useEffect(() => {
        if (inView && pagination.hasMore && !isLoadingJobs) {
            loadMoreJobs();
        }
    }, [inView, pagination.hasMore, isLoadingJobs, loadMoreJobs]);

    if (!pagination.hasMore) return null;

    return (
        <div ref={ref} className="space-y-6 pt-6">
            <JobCardSkeleton />
            <JobCardSkeleton />
        </div>
    );
}

// ─── Recommended Tab ─────────────────────────────────

function RecommendedTab({ 
    recommendations, isLoading, resumes, selectedResumeId, onSelectResume, onMatch 
}: any) {
    const { saveApplication, applyToJob } = useJobStore();
    return (
        <div className="space-y-10 max-w-5xl mx-auto">
            {/* Neural Matcher Control Panel */}
            <div className="relative group overflow-hidden">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-violet-500/30 rounded-[2.5rem] blur opacity-75 group-hover:opacity-100 transition duration-1000" />
                <div className="relative bg-zinc-950 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-3xl">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                        <div className="flex items-center gap-8">
                            <div className="h-20 w-20 bg-primary/10 border border-primary/20 rounded-3xl flex items-center justify-center shrink-0">
                                <Sparkles className="text-primary" size={32} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">Neural Alignment</h3>
                                <p className="text-zinc-500 text-sm font-medium leading-relaxed max-w-sm">
                                    Execute a deep-recursive matching cycle to align your profile with the current market demand.
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                            <div className="relative w-full sm:w-64 group/select">
                                <select 
                                    value={selectedResumeId}
                                    onChange={(e) => onSelectResume(e.target.value)}
                                    className="w-full bg-zinc-900/50 border border-white/5 text-white text-[0.75rem] font-bold uppercase tracking-widest px-6 py-4 rounded-2xl focus:outline-none focus:border-primary/50 appearance-none transition-all cursor-pointer"
                                >
                                    {resumes.map((r: any) => (
                                        <option key={r.id} value={r.id}>{r.title}</option>
                                    ))}
                                </select>
                                <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-600 rotate-90 pointer-events-none" size={16} />
                            </div>
                            <Button 
                                onClick={onMatch}
                                disabled={isLoading || !selectedResumeId}
                                className="w-full sm:w-auto px-10 h-14 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.2em] text-[0.7rem] rounded-2xl shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)] hover:shadow-primary/50 transition-all disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : <Zap size={16} className="mr-2" />}
                                Initialize Match
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Match Results */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in zoom-in duration-700">
                    <div className="relative h-24 w-24 mb-10">
                        <div className="absolute inset-0 border-[4px] border-primary/10 rounded-full" />
                        <div className="absolute inset-0 border-[4px] border-primary border-t-transparent rounded-full animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="text-primary animate-pulse" size={32} />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <p className="text-lg font-black text-white uppercase tracking-[0.3em]">Profiling Target...</p>
                        <p className="text-sm text-zinc-500 font-medium uppercase tracking-widest animate-pulse">Running semantic tensor alignment</p>
                    </div>
                </div>
            ) : recommendations.length === 0 ? (
                <div className="bg-zinc-900/10 border border-white/[0.03] rounded-[2.5rem] p-24 text-center space-y-8">
                    <div className="h-20 w-20 bg-zinc-900 border border-white/5 rounded-3xl flex items-center justify-center mx-auto text-zinc-700">
                        <Sparkles size={32} />
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-xl font-bold text-white">Matches Pending</h3>
                        <p className="text-zinc-500 text-sm max-w-sm mx-auto font-medium leading-relaxed">
                            Select a target profile above to initialize the alignment engine and discover high-probability opportunities.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-4">
                        <h4 className="text-[0.65rem] font-black text-zinc-500 uppercase tracking-[0.4em]">Top Neural Alignments</h4>
                        <div className="h-px flex-1 bg-white/5 mx-6" />
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10">{recommendations.length} Scoped</Badge>
                    </div>
                    <div className="grid grid-cols-1 gap-6">
                        {recommendations.map((match: any) => (
                            <div key={match.jobId} className="group relative">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/10 to-transparent rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-700" />
                                <div className="relative flex flex-col md:flex-row bg-zinc-950/40 border border-white/10 rounded-3xl overflow-hidden hover:border-primary/30 transition-all duration-500">
                                    <div className="p-8 flex-1">
                                        <div className="flex items-center gap-5 mb-8">
                                            <div className="h-14 w-14 shrink-0 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-center">
                                                <span className="text-lg font-black text-primary">{match.score}%</span>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-white mb-1 uppercase tracking-tight line-clamp-1">{match.title}</h3>
                                                <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em]">{match.company || 'Market Opportunity'}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8 border-t border-white/5">
                                            <div className="space-y-5">
                                                <div className="flex items-center gap-2 text-[0.6rem] font-black text-emerald-500 uppercase tracking-[0.2em]">
                                                    <TrendingUp size={12} /> Alignment Nodes
                                                </div>
                                                <div className="space-y-3">
                                                    {match.strengths.slice(0, 3).map((s: string, i: number) => (
                                                        <div key={i} className="flex items-start gap-3 group/item">
                                                            <div className="mt-1 h-3.5 w-3.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                                                                <CheckCircle2 size={10} className="text-emerald-500" />
                                                            </div>
                                                            <span className="text-[0.7rem] text-zinc-400 font-medium leading-relaxed group-hover/item:text-zinc-200 transition-colors">{s}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-5">
                                                <div className="flex items-center gap-2 text-[0.6rem] font-black text-amber-500 uppercase tracking-[0.2em]">
                                                    <AlertCircle size={12} /> Optimization Areas
                                                </div>
                                                <div className="space-y-3">
                                                    {match.weaknesses.slice(0, 3).map((w: string, i: number) => (
                                                        <div key={i} className="flex items-start gap-3 group/item">
                                                            <div className="mt-1 h-3.5 w-3.5 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                                                                <div className="h-1 w-1 bg-amber-500 rounded-full" />
                                                            </div>
                                                            <span className="text-[0.7rem] text-zinc-400 font-medium leading-relaxed group-hover/item:text-zinc-200 transition-colors">{w}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="md:w-64 bg-white/[0.02] border-t md:border-t-0 md:border-l border-white/5 p-8 flex flex-col justify-center gap-4">
                                        <Button 
                                            onClick={() => saveApplication(match.jobId)}
                                            className="w-full h-12 bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-[0.65rem] font-black uppercase tracking-widest text-zinc-300 hover:text-white rounded-xl transition-all"
                                        >
                                            Quick Sync
                                        </Button>
                                        <Button 
                                            onClick={() => applyToJob(match)}
                                            className="w-full h-12 bg-primary/10 border border-primary/20 hover:bg-primary text-primary hover:text-white text-[0.65rem] font-black uppercase tracking-widest rounded-xl transition-all group/apply"
                                        >
                                            Full Application
                                            <ExternalLink size={12} className="ml-2 group-hover/apply:translate-x-0.5 group-hover/apply:-translate-y-0.5 transition-transform" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Tracker Tab ─────────────────────────────────────

function ApplicationsTab({ applications, isLoading, onRefresh }: any) {
    const { updateApplicationStatus, analytics, fetchAnalytics } = useJobStore();

    useEffect(() => {
        fetchAnalytics();
    }, [applications, fetchAnalytics]);

    const onStatusChange = (id: string, status: string) => {
        updateApplicationStatus(id, status as any);
    };

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Analytics Grid */}
            {analytics && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Total Tracked', val: analytics.total, icon: Briefcase, color: 'text-zinc-300' },
                        { label: 'In Screening', val: (analytics as any).screening || 0, icon: Search, color: 'text-primary' },
                        { label: 'Interviewing', val: (analytics as any).interview || 0, icon: Sparkles, color: 'text-violet-500' },
                        { label: 'Active Offers', val: (analytics as any).offer || 0, icon: Zap, color: 'text-emerald-500' },
                    ].map(stat => (
                        <Card key={stat.label} className="bg-zinc-900/30 border-white/5 p-8 rounded-[2rem] flex flex-col items-center text-center group hover:border-white/10 transition-all duration-500">
                            <div className={`h-12 w-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center mb-6 ${stat.color} group-hover:scale-110 transition-transform`}>
                                <stat.icon size={20} />
                            </div>
                            <div className="text-4xl font-black text-white mb-2 leading-none">{stat.val}</div>
                            <div className="text-[0.65rem] font-black text-zinc-500 uppercase tracking-[0.2em]">{stat.label}</div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Application List */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-4">
                    <h4 className="text-[0.65rem] font-black text-zinc-500 uppercase tracking-[0.4em]">Submission Pipeline</h4>
                    <div className="h-px flex-1 bg-white/5 mx-6" />
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={onRefresh}
                        className="text-[0.6rem] font-black uppercase tracking-widest text-zinc-500 hover:text-white"
                    >
                        Sync Records
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <Loader2 size={32} className="animate-spin text-primary" />
                        <p className="text-[0.6rem] text-zinc-500 font-black uppercase tracking-widest">Hydrating tracker state...</p>
                    </div>
                ) : applications.length === 0 ? (
                    <div className="bg-zinc-900/10 border border-white/[0.03] rounded-[2.5rem] p-24 text-center space-y-8">
                        <div className="h-20 w-20 bg-zinc-900 border border-white/5 rounded-3xl flex items-center justify-center mx-auto text-zinc-700">
                            <Briefcase size={32} />
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-xl font-bold text-white">Pipeline Empty</h3>
                            <p className="text-zinc-500 text-sm max-w-sm mx-auto font-medium leading-relaxed">
                                Start capturing market opportunities from the Feed or Matches tabs to begin your tracking sequence.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {applications.map((app: any) => (
                            <Card key={app.id} className="relative overflow-hidden bg-zinc-950/40 border-white/5 rounded-3xl p-8 hover:border-white/10 transition-all duration-500 group">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                                    <div className="flex items-center gap-6 flex-1 w-full">
                                        <div className="h-12 w-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center shrink-0 group-hover:border-primary/30 transition-colors">
                                            <Building2 size={24} className="text-zinc-600 group-hover:text-primary transition-colors" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white mb-1 uppercase tracking-tight line-clamp-1">{app.job.title}</h3>
                                            <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em]">{app.job.company}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-wrap items-center justify-center md:justify-end gap-12 w-full md:w-auto">
                                        <div className="text-center md:text-left">
                                            <div className="text-zinc-600 text-[0.55rem] font-black uppercase tracking-[0.2em] mb-2 px-1">Engagement</div>
                                            <Badge variant="outline" className="bg-white/[0.03] border-white/5 text-zinc-400 text-[0.65rem] font-bold px-4 py-1.5 uppercase tracking-widest">
                                                {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Saved Only'}
                                            </Badge>
                                        </div>
                                        
                                        <div className="min-w-[160px]">
                                            <div className="text-zinc-600 text-[0.55rem] font-black uppercase tracking-[0.2em] mb-2 px-1 text-center">Current Phase</div>
                                            <div className="relative group/status">
                                                <select 
                                                    value={app.status}
                                                    onChange={(e) => onStatusChange(app.id, e.target.value)}
                                                    className="w-full bg-zinc-900/50 border border-white/5 text-white text-[0.65rem] font-black uppercase tracking-widest px-6 py-3 rounded-xl focus:outline-none focus:border-primary/50 appearance-none transition-all cursor-pointer text-center"
                                                >
                                                    {Object.entries(STATUS_LABELS).map(([val, label]) => (
                                                        <option key={val} value={val}>{label}</option>
                                                    ))}
                                                </select>
                                                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 rotate-90 pointer-events-none" size={12} />
                                            </div>
                                        </div>

                                        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl border border-white/5 hover:bg-white/5 text-zinc-500 hover:text-white transition-all">
                                            <ExternalLink size={18} />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Insights Tab ────────────────────────────────────

function InsightsTab({ skillGap, isLoading, onRefresh }: any) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto space-y-12"
        >
            {/* Insights Header */}
            <div className="relative group overflow-hidden">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500/20 to-primary/20 rounded-[2.5rem] blur opacity-50 transition duration-1000" />
                <div className="relative p-12 bg-zinc-950/40 border border-white/10 rounded-[2.5rem] backdrop-blur-3xl overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-5">
                        <BarChart3 size={160} className="text-primary" />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[0.6rem] font-black uppercase tracking-widest">
                                Neural Analytics V2.0
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black text-white italic uppercase tracking-tighter">Market <span className="text-primary not-italic">Equilibrium</span></h2>
                            <p className="text-zinc-500 text-sm font-medium leading-relaxed max-w-md">
                                Real-time profiling of your competitive positioning across the global technology marketplace.
                            </p>
                        </div>
                        <Button 
                            onClick={onRefresh}
                            disabled={isLoading}
                            className="h-16 px-10 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-[0.7rem] font-black uppercase tracking-[0.2em] text-zinc-300 hover:text-white transition-all shadow-[0_0_30px_rgba(255,255,255,0.02)]"
                        >
                            {isLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : <Zap size={16} className="mr-2" />}
                            Execute Deep Scan
                        </Button>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-8">
                    <div className="relative h-24 w-24">
                        <div className="absolute inset-0 border-[4px] border-primary/5 rounded-full" />
                        <div className="absolute inset-0 border-[4px] border-primary border-t-transparent rounded-full animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <BarChart3 className="text-primary animate-pulse" size={32} />
                        </div>
                    </div>
                    <div className="text-center space-y-2">
                        <p className="text-lg font-black text-white uppercase tracking-[0.3em] animate-pulse">Analyzing Demand Vectors</p>
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Cross-referencing global talent pools...</p>
                    </div>
                </div>
            ) : !skillGap ? (
                <div className="bg-zinc-900/10 border border-white/[0.03] rounded-[2.5rem] p-32 text-center space-y-8">
                    <div className="h-24 w-24 bg-zinc-900 border border-white/5 rounded-3xl flex items-center justify-center mx-auto text-zinc-800">
                        <BarChart3 size={40} />
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-2xl font-black text-white uppercase tracking-tight italic">Intelligence <span className="text-primary not-italic">Pending</span></h3>
                        <p className="text-zinc-500 text-sm max-w-sm mx-auto font-medium leading-relaxed">
                            Initialize a market alignment scan to unlock your strategic competitive advantage.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Role Alignment Score */}
                    <Card className="bg-zinc-900/40 border-white/10 p-10 rounded-[2.5rem] flex flex-col items-center justify-center text-center space-y-8 group hover:border-primary/30 transition-all duration-500">
                        <span className="text-[0.6rem] font-black uppercase tracking-[0.3em] text-zinc-500">Market Alignment</span>
                        <div className="relative h-48 w-48 flex items-center justify-center">
                            <svg className="h-full w-full -rotate-90">
                                <circle cx="96" cy="96" r="80" fill="none" stroke="currentColor" strokeWidth="8" className="text-white/[0.03]" />
                                <motion.circle 
                                    initial={{ strokeDashoffset: 502 }}
                                    animate={{ strokeDashoffset: 502 - (502 * (skillGap.roleAlignment || 0)) / 100 }}
                                    transition={{ duration: 2, ease: "easeOut" }}
                                    cx="96" cy="96" r="80" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray={502} className="text-primary drop-shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" 
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-5xl font-black text-white italic tracking-tighter">{skillGap.roleAlignment}%</span>
                                <span className="text-[0.6rem] font-black text-zinc-500 uppercase tracking-widest mt-1">Symmetry</span>
                            </div>
                        </div>
                        <p className="text-[0.7rem] text-zinc-500 font-medium leading-relaxed max-w-[200px]">
                            Your profile exhibits significant affinity with current market demand.
                        </p>
                    </Card>

                    {/* Salary Boosters */}
                    <Card className="lg:col-span-2 bg-zinc-900/40 border-white/10 p-10 rounded-[2.5rem] space-y-10 group hover:border-emerald-500/20 transition-all duration-500">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                    <DollarSign size={20} className="text-emerald-500" />
                                </div>
                                <h3 className="text-base font-black text-white uppercase tracking-widest italic">Value <span className="text-emerald-500 not-italic">Multipliers</span></h3>
                            </div>
                            <span className="text-[0.6rem] font-black text-zinc-600 uppercase tracking-[0.2em]">Projected Market Lift</span>
                        </div>
                        <div className="grid gap-4">
                            {skillGap.topSalaryBoosters?.length > 0 ? (
                                skillGap.topSalaryBoosters.map((item: any, i: number) => (
                                    <motion.div 
                                        key={i}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl hover:bg-white/[0.04] transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                            <span className="text-sm font-bold text-white uppercase tracking-wider">{item.skill}</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-black text-emerald-400 leading-none mb-1">+ ${Math.round((item.avgSalary || 120000) / 1000)}K</div>
                                            <div className="text-[0.55rem] text-zinc-500 font-bold uppercase tracking-widest">Expected Increase</div>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="py-20 text-center text-[0.65rem] text-zinc-600 font-black uppercase tracking-[0.3em]">Gathering market valuation data...</div>
                            )}
                        </div>
                    </Card>

                    {/* Competitive Strengths */}
                    <Card className="bg-zinc-900/40 border-white/10 p-10 rounded-[2.5rem] space-y-8 group hover:border-emerald-500/20 transition-all duration-500">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                <CheckCircle2 size={18} className="text-emerald-500" />
                            </div>
                            <h3 className="text-xs font-black text-white uppercase tracking-widest italic">Power <span className="text-emerald-500 not-italic">Nodes</span></h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {skillGap.inDemand?.map((item: any, i: number) => (
                                <div key={i} className="px-4 py-2 bg-emerald-500/5 border border-emerald-500/10 text-[0.65rem] font-bold text-emerald-500/80 uppercase tracking-widest rounded-lg">
                                    {item.skill}
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Skill Gaps */}
                    <Card className="lg:col-span-2 bg-zinc-900/40 border-white/10 p-10 rounded-[2.5rem] space-y-8 group hover:border-primary/20 transition-all duration-500">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                <TrendingUp size={18} className="text-primary" />
                            </div>
                            <h3 className="text-xs font-black text-white uppercase tracking-widest italic">Acquisition <span className="text-primary not-italic">Targets</span></h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {skillGap.missing?.slice(0, 12).map((item: any, i: number) => (
                                <div key={i} className="px-4 py-2 bg-primary/5 border border-primary/10 text-[0.65rem] font-bold text-primary/80 uppercase tracking-widest rounded-lg">
                                    {item.skill}
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Strategic Recommendations */}
                    {skillGap.recommendations?.length > 0 && (
                        <Card className="lg:col-span-3 bg-gradient-to-br from-zinc-900/60 to-black border-white/10 p-12 rounded-[3rem] space-y-10">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                                    <Sparkles size={24} className="text-violet-500" />
                                </div>
                                <h3 className="text-xl font-black text-white uppercase tracking-[0.2em] italic">Neural Trajectory <span className="text-violet-500 not-italic">Strategy</span></h3>
                            </div>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {skillGap.recommendations.map((rec: string, i: number) => (
                                    <motion.div 
                                        key={i}
                                        whileHover={{ y: -5 }}
                                        className="p-8 bg-white/[0.02] border border-white/[0.05] rounded-[2rem] space-y-6 hover:bg-white/[0.04] transition-all"
                                    >
                                        <div className="text-4xl font-black text-primary/20 tabular-nums leading-none">0{i + 1}</div>
                                        <p className="text-sm text-zinc-400 leading-relaxed font-medium">{rec}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>
            )}
        </motion.div>
    );
}
