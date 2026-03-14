import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const [
            totalJobs,
            activeJobs,
            topSkills,
            recentMatches,
            jobsBySource
        ] = await Promise.all([
            prisma.jobPosting.count(),
            prisma.jobPosting.count({ where: { isActive: true } }),
            prisma.skillDemand.findMany({
                orderBy: { demandCount: 'desc' },
                take: 10
            }),
            prisma.jobMatch.count({
                where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
            }),
            prisma.$queryRawUnsafe(`SELECT source, COUNT(*) as count FROM "JobPosting" GROUP BY source`)
        ]);

        const formattedSources = (jobsBySource as any[]).map(s => ({
            source: s.source,
            count: Number(s.count) // Ensure it's a number
        }));

        return NextResponse.json({
            metrics: {
                totalJobs,
                activeJobs,
                recentMatches24h: recentMatches,
            },
            topSkills,
            sources: formattedSources
        });
    } catch (err) {
        console.error('Analytics API error:', err);
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }
}
