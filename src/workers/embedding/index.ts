import { createWorker, analyticsQueue, matchQueue } from '@/lib/queue';
import prisma from '@/lib/prisma';
import { generateEmbedding } from '@/lib/ai';
import { logger } from '@/lib/logger';

export const embeddingWorker = createWorker('embedding-queue', async (job: any) => {
    const { jobId, resumeId } = job.data;
    
    try {
        if (jobId) {
            await processJobEmbedding(jobId);
        } else if (resumeId) {
            await processResumeEmbedding(resumeId);
        }
    } catch (err) {
        logger.error('EmbeddingWorker failed', err);
        throw err;
    }
});

async function processJobEmbedding(jobId: string) {
    const job = await prisma.jobPosting.findUnique({ where: { id: jobId } });
    if (!job) return;

    // Create a semantic profile string
    const profile = `
        Title: ${job.title}
        Company: ${job.company}
        Skills: ${Array.isArray(job.skills) ? job.skills.join(', ') : ''}
        Description: ${job.description}
    `.trim().substring(0, 6000);

    const vector = await generateEmbedding(profile);

    // Prisma doesn't support pgvector directly in updates yet. Use raw SQL.
    await prisma.$executeRaw`
        UPDATE "JobPosting"
        SET "vector" = ${vector}::vector
        WHERE "id" = ${jobId}
    `;

    logger.info(`EmbeddingWorker: Generated vector for job ${jobId}`);
    
    // Trigger matching
    await matchQueue.add('generate-matches', { jobId });
    
    // Trigger analytics
    await analyticsQueue.add('track-ingestion', { jobId });
}

async function processResumeEmbedding(resumeId: string) {
    const resume: any = await prisma.resume.findUnique({ where: { id: resumeId } });
    if (!resume) return;

    // Extract skills and content from data JSON
    const data = resume.data || {};
    const skills = Array.isArray(data.skills) ? data.skills.join(', ') : '';
    const summary = data.summary || '';
    const projects = Array.isArray(data.projects) 
        ? data.projects.map((p: any) => `${p.name}: ${p.description}`).join('; ') 
        : '';

    const profile = `
        Title: ${resume.title}
        Target Role: ${data.targetRole || ''}
        Summary: ${summary}
        Skills: ${skills}
        Projects: ${projects}
        Content: ${resume.markdown || ''}
    `.trim().substring(0, 6000);

    const vector = await generateEmbedding(profile);

    await prisma.$executeRaw`
        UPDATE "Resume"
        SET "vector" = ${vector}::vector
        WHERE "id" = ${resumeId}
    `;

    logger.info(`EmbeddingWorker: Generated vector for resume ${resumeId}`);
    
    // Trigger matching
    await matchQueue.add('generate-matches', { resumeId });
}
