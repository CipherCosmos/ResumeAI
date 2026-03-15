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
        
        // 2. Validate with Zod (but be resilient)
        const validated = JobDataSchema.safeParse(rawJson);
        const data = validated.success ? validated.data : rawJson;

        if (!validated.success) {
            logger.warn(`ParserWorker: Validation partial match for job ${jobId}. Using raw data.`, validated.error);
        }

        // Ensure we at least have a title if possible
        if (!data.title || data.title === 'Unknown Role' || data.title.includes('Unknown')) {
            data.title = (jobPosting.title === 'Unknown Role' || jobPosting.title.includes('Unknown')) ? 'Job Opportunity' : jobPosting.title;
        }
        if (!data.company || data.company === 'Unknown Company' || data.company.includes('Unknown')) {
            data.company = (jobPosting.company === 'Unknown Company' || jobPosting.company.includes('Unknown')) ? 'Careers Portal' : jobPosting.company;
        }

        // If even after parsing it's still extremely poor quality, mark as inactive
        const isBadData = (!data.title || data.title === 'Job Opportunity') && 
                         (!data.company || data.company === 'Careers Portal');
        
        if (isBadData) {
            logger.warn(`ParserWorker: Marking job ${jobId} as inactive due to persistent poor data quality.`);
        }

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
                title: data.title,
                company: data.company,
                location: data.location || jobPosting.location,
                skills: data.skills as any,
                salary: data.salary,
                salaryMin: data.salaryMin,
                salaryMax: data.salaryMax,
                experienceLevel: data.experienceLevel ?? jobPosting.experienceLevel ?? 'Mid',
                employmentType: data.employmentType ?? jobPosting.employmentType ?? 'Full-time',
                postedAt: parseDate(data.postedAt) || jobPosting.postedAt || jobPosting.firstSeen || new Date(),
                isActive: isBadData ? false : (data.isClosed ? false : jobPosting.isActive),
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
