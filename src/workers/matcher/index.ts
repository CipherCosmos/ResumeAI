import { createWorker } from '@/lib/queue';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const matchWorker = createWorker('match-queue', async (job: any) => {
    const { jobId, resumeId } = job.data;
    logger.info(`MatchWorker: Processing matches for ${jobId ? 'job ' + jobId : 'resume ' + resumeId}`);

    try {
        if (jobId) {
            await matchJobWithAllResumes(jobId);
        } else if (resumeId) {
            await matchResumeWithAllJobs(resumeId);
        }
    } catch (err) {
        logger.error('MatchWorker failed', err);
        throw err;
    }
});

async function matchJobWithAllResumes(jobId: string) {
    const job: any = await (prisma as any).jobPosting.findUnique({ where: { id: jobId } });
    if (!job || !job.vector) return;

    // 1. Get similar resumes via pgvector
    const similarResumes: any[] = await (prisma as any).$queryRaw`
        SELECT id, "userId", "data", "vector" <=> ${JSON.stringify(job.vector)}::vector as distance
        FROM "Resume"
        ORDER BY distance ASC
        LIMIT 50
    `;

    for (const resume of similarResumes) {
        const score = calculateMatchScore(job, resume);
        await saveMatch(resume.userId, jobId, resume.id, score);
    }
}

async function matchResumeWithAllJobs(resumeId: string) {
    const resume: any = await (prisma as any).resume.findUnique({ where: { id: resumeId } });
    if (!resume || !resume.vector) return;

    // 1. Get similar jobs via pgvector
    const similarJobs: any[] = await (prisma as any).$queryRaw`
        SELECT id, title, skills, "experienceLevel", "salaryMin", "salaryMax",
               "vector" <=> ${JSON.stringify(resume.vector)}::vector as distance
        FROM "JobPosting"
        WHERE "isActive" = true
        ORDER BY distance ASC
        LIMIT 50
    `;

    for (const job of similarJobs) {
        const score = calculateMatchScore(job, resume);
        await saveMatch(resume.userId, job.id, resumeId, score);
    }
}

function calculateMatchScore(job: any, resume: any) {
    // 1. Semantic Score (0-100)
    // Distance is 0 to 2 (cosine distance). 0 is identical.
    const distance = resume.distance || 0.5;
    const semanticScore = Math.max(0, Math.min(100, (1 - distance) * 100));

    // 2. Skill Match (0-100)
    const jobSkills = Array.isArray(job.skills) ? job.skills.map((s: string) => s.toLowerCase()) : [];
    const resumeData = resume.data || {};
    const resumeSkills = Array.isArray(resumeData.skills) ? resumeData.skills.map((s: string) => s.toLowerCase()) : [];
    
    let skillScore = 0;
    if (jobSkills.length > 0) {
        const matches = jobSkills.filter((s: string) => resumeSkills.includes(s));
        skillScore = (matches.length / jobSkills.length) * 100;
    }

    // Weighted average
    const overallScore = Math.round((semanticScore * 0.6) + (skillScore * 0.4));
    
    return {
        overallScore,
        semanticScore: Math.round(semanticScore),
        skillScore: Math.round(skillScore),
        explanation: `Semantic similarity: ${Math.round(semanticScore)}%. Skill overlap: ${Math.round(skillScore)}%.`
    };
}

async function saveMatch(userId: string, jobId: string, resumeId: string, score: any) {
    await (prisma as any).jobMatch.upsert({
        where: {
            userId_jobId_resumeId: { userId, jobId, resumeId }
        },
        update: {
            overallScore: score.overallScore,
            semanticScore: score.semanticScore,
            skillScore: score.skillScore,
            explanation: score.explanation,
            updatedAt: new Date(),
        },
        create: {
            userId,
            jobId,
            resumeId,
            overallScore: score.overallScore,
            semanticScore: score.semanticScore,
            skillScore: score.skillScore,
            explanation: score.explanation,
        }
    });
}
