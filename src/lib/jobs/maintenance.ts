import prisma from '../prisma';
import { logger } from '../logger';
import { updateMarketDemandStats } from './skill-gap';

export class MaintenanceService {
    /**
     * Updates the Knowledge Base: skill demand, stale jobs, and data health.
     */
    static async updateKnowledgeBase() {
        logger.info('Maintenance: Starting Knowledge Base update...');
        
        try {
            // 1. Update Market Demand Statistics (Skill Gap Analysis)
            logger.info('Maintenance: Refreshing skill demand statistics...');
            await updateMarketDemandStats();
            
            // 2. Mark stale jobs as inactive based on lastSeen (not seen in 7 days)
            logger.info('Maintenance: Cleaning up stale job postings...');
            const lastSeenThreshold = new Date();
            lastSeenThreshold.setDate(lastSeenThreshold.getDate() - 7);
            
            const staleResult = await (prisma as any).jobPosting.updateMany({
                where: {
                    lastSeen: { lt: lastSeenThreshold },
                    isActive: true
                },
                data: { isActive: false }
            });
            logger.info(`Maintenance: Deactivated ${staleResult.count} jobs not seen in 7 days.`);

            // 3. Deactivate jobs older than 90 days (Absolute Age)
            const absoluteThreshold = new Date();
            absoluteThreshold.setDate(absoluteThreshold.getDate() - 90);
            const absoluteResult = await (prisma as any).jobPosting.updateMany({
                where: {
                    postedAt: { lt: absoluteThreshold },
                    isActive: true
                },
                data: { isActive: false }
            });
            logger.info(`Maintenance: Deactivated ${absoluteResult.count} jobs older than 90 days.`);

            // 4. Purge persistent "Unknown" jobs or junk data
            const unknownResult = await (prisma as any).jobPosting.updateMany({
                where: {
                    OR: [
                        { title: { contains: 'Unknown', mode: 'insensitive' } },
                        { company: { contains: 'Unknown', mode: 'insensitive' } },
                        { title: { contains: 'Job Opportunity', mode: 'insensitive' } }
                    ],
                    isActive: true,
                    createdAt: { lt: new Date(Date.now() - 1 * 60 * 60 * 1000) } // 1 hour old
                },
                data: { isActive: false }
            });
            logger.info(`Maintenance: Purged ${unknownResult.count} low-quality records.`);
            
            // 3. Data Integrity: Check for missing embeddings (if applicable)
            // This is a placeholder for future vector db maintenance
            
            logger.info('Maintenance: Knowledge Base update complete.');
        } catch (err) {
            logger.error('Maintenance: Error during KB update', err);
            throw err;
        }
    }
}
