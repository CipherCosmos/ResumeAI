import { create } from 'zustand';
import type { JobMatchResult, ApplicationStatus, SkillGapResult, ApplicationAnalytics } from '@/types/job';

interface JobFilters {
    search: string;
    location: string;
    type: string[];
    level: string[];
    discipline: string[];
    industry: string[];
    visa: boolean | null;
    remote: boolean | null;
    sortBy: 'relevance' | 'newest' | 'salary';
    salaryMin: number;
}

interface JobListItem {
    id: string;
    title: string;
    company: string;
    location: string | null;
    salary: string | null;
    salaryMin: number | null;
    salaryMax: number | null;
    experienceLevel: string | null;
    employmentType: string | null;
    skills: any;
    source: string | null;
    sourceUrl: string | null;
    postedAt: string | null;
}

interface JobApplication {
    id: string;
    jobId: string;
    status: ApplicationStatus;
    appliedAt: string | null;
    job: {
        id: string;
        title: string;
        company: string;
    };
}

interface JobState {
    activeTab: 'browse' | 'recommended' | 'applications' | 'insights';
    setActiveTab: (tab: JobState['activeTab']) => void;
    jobs: JobListItem[];
    isLoadingJobs: boolean;
    filters: JobFilters;
    pagination: { page: number; total: number; totalPages: number; hasMore: boolean };
    setFilters: (filters: Partial<JobFilters>) => void;
    fetchJobs: () => Promise<void>;
    loadMoreJobs: () => Promise<void>;
    
    // Details View
    selectedJobId: string | null;
    setSelectedJobId: (id: string | null) => void;
    selectedJob: JobListItem | null;
    
    recommendations: JobMatchResult[];
    isLoadingRecs: boolean;
    fetchRecommendations: (resumeId: string) => Promise<void>;
    applications: JobApplication[];
    isLoadingApps: boolean;
    fetchApplications: (status?: string) => Promise<void>;
    saveApplication: (jobId: string, resumeId?: string, status?: ApplicationStatus) => Promise<void>;
    updateApplicationStatus: (id: string, status: ApplicationStatus, notes?: string) => Promise<void>;
    applyToJob: (job: JobListItem) => void;
    skillGap: SkillGapResult | null;
    isLoadingGap: boolean;
    fetchSkillGap: (resumeId: string, role?: string) => Promise<void>;
    analytics: ApplicationAnalytics | null;
    fetchAnalytics: () => Promise<void>;
}

export const useJobStore = create<JobState>()((set, get) => ({
    activeTab: 'browse',
    setActiveTab: (tab) => set({ activeTab: tab }),
    jobs: [],
    isLoadingJobs: false,
    filters: { 
        search: '', 
        location: '', 
        type: [], 
        level: [], 
        discipline: [], 
        industry: [], 
        visa: null, 
        remote: null, 
        sortBy: 'relevance', 
        salaryMin: 0 
    },
    pagination: { page: 1, total: 0, totalPages: 0, hasMore: false },
    setFilters: (newFilters) => set((state) => ({ 
        filters: { ...state.filters, ...newFilters },
        pagination: { ...state.pagination, page: 1 } // Reset to page 1 on filter change
    })),
    
    selectedJobId: null,
    setSelectedJobId: (id) => set({ selectedJobId: id }),
    get selectedJob() {
        return get().jobs.find(j => j.id === get().selectedJobId) || 
               (get().recommendations.find(r => r.jobId === get().selectedJobId) as any) || 
               null;
    },

    fetchJobs: async () => {
        set({ isLoadingJobs: true, jobs: [] }); // Reset list for fresh fetch
        try {
            const { filters } = get();
            const params = new URLSearchParams({
                page: '1',
                pageSize: '20'
            });
            if (filters.search) params.set('q', filters.search);
            if (filters.location) params.set('location', filters.location);
            if (filters.level.length > 0) params.set('experience', filters.level.join(','));
            if (filters.type.length > 0) params.set('type', filters.type.join(','));
            if (filters.discipline.length > 0) params.set('discipline', filters.discipline.join(','));
            if (filters.industry.length > 0) params.set('industry', filters.industry.join(','));
            if (filters.visa !== null) params.set('visa', filters.visa.toString());
            if (filters.remote !== null) params.set('remote', filters.remote.toString());
            if (filters.sortBy) params.set('sortBy', filters.sortBy);
            if (filters.salaryMin > 0) params.set('salaryMin', filters.salaryMin.toString());
            
            const res = await fetch(`/api/jobs/search?${params}`);
            const data = await res.json();
            if (res.ok) {
                // Ensure unique jobs even on initial fetch (though unlikely to have duplicates here)
                const uniqueJobs = Array.from(new Map(data.jobs.map((j: any) => [j.id, j])).values()) as JobListItem[];
                
                set({ 
                    jobs: uniqueJobs, 
                    pagination: { 
                        page: 1, 
                        total: data.count, 
                        totalPages: data.totalPages,
                        hasMore: data.page < data.totalPages
                    } 
                });
            }
        }
 catch (err) { 
            console.error(err); 
        } finally { 
            set({ isLoadingJobs: false }); 
        }
    },

    loadMoreJobs: async () => {
        const { pagination, isLoadingJobs, filters, jobs } = get();
        if (isLoadingJobs || !pagination.hasMore) return;

        set({ isLoadingJobs: true });
        try {
            const nextPage = pagination.page + 1;
            const params = new URLSearchParams({
                page: nextPage.toString(),
                pageSize: '20'
            });
            if (filters.search) params.set('q', filters.search);
            if (filters.location) params.set('location', filters.location);
            if (filters.level.length > 0) params.set('experience', filters.level.join(','));
            if (filters.type.length > 0) params.set('type', filters.type.join(','));
            if (filters.discipline.length > 0) params.set('discipline', filters.discipline.join(','));
            if (filters.industry.length > 0) params.set('industry', filters.industry.join(','));
            if (filters.visa !== null) params.set('visa', filters.visa.toString());
            if (filters.remote !== null) params.set('remote', filters.remote.toString());
            if (filters.sortBy) params.set('sortBy', filters.sortBy);
            if (filters.salaryMin > 0) params.set('salaryMin', filters.salaryMin.toString());
            
            const res = await fetch(`/api/jobs/search?${params}`);
            const data = await res.json();
            if (res.ok) {
                // Deduplicate incoming jobs by ID before merging with existing ones
                const allJobs = [...jobs, ...data.jobs];
                const uniqueJobs = Array.from(new Map(allJobs.map((j: any) => [j.id, j])).values()) as JobListItem[];

                set({ 
                    jobs: uniqueJobs, 
                    pagination: { 
                        page: nextPage, 
                        total: data.count, 
                        totalPages: data.totalPages,
                        hasMore: data.page < data.totalPages
                    } 
                });
            }
        } catch (err) { 
            console.error(err); 
        } finally { 
            set({ isLoadingJobs: false }); 
        }
    },

    recommendations: [],
    isLoadingRecs: false,
    fetchRecommendations: async (resumeId) => {
        set({ isLoadingRecs: true });
        try {
            const res = await fetch(`/api/jobs/recommended?resumeId=${resumeId}`);
            const data = await res.json();
            if (res.ok) set({ recommendations: data.recommendations });
        } catch (err) { console.error(err); } finally { set({ isLoadingRecs: false }); }
    },
    applications: [],
    isLoadingApps: false,
    fetchApplications: async (status) => {
        set({ isLoadingApps: true });
        try {
            const params = status ? `?status=${status}` : '';
            const res = await fetch(`/api/jobs/applications${params}`);
            const data = await res.json();
            if (res.ok) set({ applications: data.applications });
        } catch (err) { console.error(err); } finally { set({ isLoadingApps: false }); }
    },
    saveApplication: async (jobId, resumeId, status = 'saved') => {
        try {
            const res = await fetch('/api/jobs/applications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId, resumeId, status }),
            });
            if (res.ok) get().fetchApplications();
        } catch (err) { console.error(err); }
    },
    applyToJob: (job) => {
        if (!job.sourceUrl) return;
        window.open(job.sourceUrl, '_blank');
        get().saveApplication(job.id, undefined, 'applied');
    },
    updateApplicationStatus: async (id, status, notes) => {
        try {
            await fetch(`/api/jobs/applications/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, notes }),
            });
            get().fetchApplications();
        } catch (err) { console.error(err); }
    },
    skillGap: null,
    isLoadingGap: false,
    fetchSkillGap: async (resumeId, role) => {
        set({ isLoadingGap: true });
        try {
            const params = new URLSearchParams({ resumeId });
            if (role) params.set('role', role);
            const res = await fetch(`/api/jobs/skill-gap?${params}`);
            const data = await res.json();
            if (res.ok) set({ skillGap: data });
        } catch (err) { console.error(err); } finally { set({ isLoadingGap: false }); }
    },
    analytics: null,
    fetchAnalytics: async () => {
        try {
            const res = await fetch('/api/jobs/analytics');
            const data = await res.json();
            if (res.ok) set({ analytics: data });
        } catch (err) { console.error(err); }
    },
}));
