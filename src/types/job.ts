export type ApplicationStatus = 'saved' | 'applied' | 'screening' | 'interview' | 'offer' | 'rejected';

export interface SkillGapResult {
    inDemand: SkillDemandItem[];
    missing: SkillDemandItem[];
    recommendations: string[];
    roleAlignment?: number;
    topSalaryBoosters?: SalaryBooster[];
}

export interface SkillDemandItem {
    skill: string;
    demandCount: number;
    demandPercentile: number;
    demandTrend?: 'up' | 'down' | 'stable';
    avgSalary?: number;
}

export interface SalaryBooster {
    skill: string;
    avgSalary: number;
}

export interface JobMatchResult {
    jobId: string;
    title: string;
    company: string;
    score: number;
    summary?: string;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
}

export interface ApplicationAnalytics {
    total: number;
    byStatus: Record<ApplicationStatus, number>;
    successRate: number;
}
