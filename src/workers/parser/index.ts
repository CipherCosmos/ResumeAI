import { createWorker, embeddingQueue } from '@/lib/queue';
import prisma from '@/lib/prisma';
import { parseJobDescription } from '@/lib/jobs/parser';
import { JobDataSchema } from '@/lib/jobs/schema';
import { logger } from '@/lib/logger';

export const parserWorker = createWorker('parser-queue', async (job: any) => {
    const { jobId } = job.data;
    logger.info(`ParserWorker: Processing job ${jobId}`);

    try {
        const jobPosting: any = await (prisma as any).jobPosting.findUnique({
            where: { id: jobId }
        });

        if (!jobPosting || !jobPosting.description) {
            logger.warn(`ParserWorker: Job ${jobId} not found or has no description`);
            return;
        }

        // 1. Call LLM Parser
        const rawJson = await parseJobDescription(jobPosting.description);
        
        // 2. Validate with Zod
        const validated = JobDataSchema.safeParse(rawJson);
        if (!validated.success) {
            logger.error(`ParserWorker: Validation failed for job ${jobId}`, validated.error);
            // Even if AI fails partially, we can log and move on, or try fallback
            return;
        }

        const data = validated.data;

        // Helper to parse relative or ISO dates
        const parseDate = (dateStr: string | null | undefined): Date | null => {
            if (!dateStr) return null;
            const now = new Date();
            const lower = dateStr.toLowerCase();
            if (lower.includes('today')) return now;
            if (lower.includes('yesterday')) return new Date(now.setDate(now.getDate() - 1));
            
            const daysMatch = lower.match(/(\d+)\s+days?\s+ago/);
            if (daysMatch) return new Date(now.setDate(now.getDate() - parseInt(daysMatch[1])));
            
            const weeksMatch = lower.match(/(\d+)\s+weeks?\s+ago/);
            if (weeksMatch) return new Date(now.setDate(now.getDate() - parseInt(weeksMatch[1]) * 7));
            
            const iso = Date.parse(dateStr);
            return isNaN(iso) ? null : new Date(iso);
        };

        // 3. Update DB
        await (prisma as any).jobPosting.update({
            where: { id: jobId },
            data: {
                title: data.title || jobPosting.title,
                company: data.company || jobPosting.company,
                location: data.location || jobPosting.location,
                skills: data.skills as any,
                salary: data.salary,
                salaryMin: data.salaryMin,
                salaryMax: data.salaryMax,
                experienceLevel: data.experienceLevel ?? jobPosting.experienceLevel ?? 'Mid',
                employmentType: data.employmentType ?? jobPosting.employmentType ?? 'Full-time',
                postedAt: parseDate(data.postedAt) || jobPosting.postedAt,
                isActive: data.isClosed ? false : jobPosting.isActive,
                updatedAt: new Date(),
            }
        });

        logger.info(`ParserWorker: Successfully parsed and updated job ${jobId}`);

        // 4. Trigger Embedding Worker
        await embeddingQueue.add('generate-embedding', { jobId });

    } catch (err) {
        logger.error(`ParserWorker: Error processing job ${jobId}`, err);
        throw err; // Retry
    }
});
