import prisma from '@/lib/prisma';
import type { JobMatchResult } from '@/types/job';
import { generateEmbedding } from '@/lib/ai';

export async function matchJobsWithResume(resumeId: string): Promise<JobMatchResult[]> {
    // 1. Check for pre-computed matches in JobMatch
    const existingMatches = await (prisma as any).jobMatch.findMany({
        where: { resumeId },
        include: { job: true },
        orderBy: { overallScore: 'desc' },
        take: 20
    });

    if (existingMatches.length > 0) {
        return existingMatches.map((m: any) => ({
            jobId: m.jobId,
            title: m.job.title,
            company: m.job.company,
            score: m.overallScore,
            summary: m.explanation || `This role at ${m.job.company} aligns well with your experience.`,
            strengths: ['Semantic match'],
            weaknesses: [],
            suggestions: [],
        }));
    }

    // 2. Fallback: Real-time semantic search if no matches pre-computed
    const resume: any = await prisma.resume.findUnique({ where: { id: resumeId } });
    if (!resume) throw new Error('Resume not found');

    let vector = resume.vector;
    if (!vector) {
        // One-time generation if missing
        const data = resume.data || {};
        const profile = `
            Title: ${resume.title}
            Skills: ${Array.isArray(data.skills) ? data.skills.join(', ') : ''}
            Content: ${resume.markdown || ''}
        `.trim();
        vector = await generateEmbedding(profile);
    }

    // Semantic query
    const results: any[] = await (prisma as any).$queryRaw`
        SELECT id, title, company, "vector" <=> ${JSON.stringify(vector)}::vector as distance
        FROM "JobPosting"
        WHERE "isActive" = true
        ORDER BY distance ASC
        LIMIT 20
    `;

    return results.map(job => ({
        jobId: job.id,
        title: job.title,
        company: job.company,
        score: Math.round((1 - job.distance) * 100),
        summary: `Highly relevant role based on semantic profile similarity.`,
        strengths: ['Vector match'],
        weaknesses: [],
        suggestions: [],
    }));
}
