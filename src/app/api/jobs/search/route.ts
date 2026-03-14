import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { generateEmbedding } from '@/lib/ai';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q') || '';
        const location = searchParams.get('location'); // Changed to allow undefined
        const salaryMin = parseInt(searchParams.get('salaryMin') || '0');
        const experience = searchParams.get('experience') || '';
        const sortBy = searchParams.get('sortBy') || 'newest';
        const daysOld = searchParams.get('days_old'); // New: Extract days_old
        
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const pageSize = Math.max(1, parseInt(searchParams.get('pageSize') || '20'));
        const skip = (page - 1) * pageSize;
        
        // 1. Initial Keyword Search (Prisma)
        const where: any = { 
            isActive: true,
            salaryMin: salaryMin ? { gte: salaryMin } : undefined,
        };

        if (location) {
            where.location = { contains: location, mode: 'insensitive' };
        }
        
        if (experience) {
            where.experienceLevel = { contains: experience, mode: 'insensitive' };
        }

        let dateLimit: Date | null = null;
        if (daysOld) {
            dateLimit = new Date();
            dateLimit.setDate(dateLimit.getDate() - parseInt(daysOld));
            where.postedAt = { gte: dateLimit };
        }

        if (query) {
            where.OR = [
                { title: { contains: query, mode: 'insensitive' } },
                { company: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
            ];
        }

        let orderBy: any = { postedAt: 'desc' };
        if (sortBy === 'salary') {
            orderBy = { salaryMax: 'desc' };
        }

        const [results, total] = await Promise.all([
            (prisma as any).jobPosting.findMany({
                where,
                orderBy,
                skip,
                take: pageSize,
            }),
            (prisma as any).jobPosting.count({ where })
        ]);

        let finalResults = results;
        let isSemantic = false;

        // 2. Semantic Search Fallback (if keyword results are thin and it's the first page)
        if (query && results.length < 10 && page === 1) {
            try {
                const queryVector = await generateEmbedding(query);
                
                const locationFilter = location ? Prisma.sql`AND "location" ILIKE ${'%' + location + '%'}` : Prisma.empty;
                const dateFilter = dateLimit ? Prisma.sql`AND "postedAt" >= ${dateLimit}` : Prisma.empty;

                const semanticResults: any[] = await (prisma as any).$queryRaw`
                    SELECT *, "vector" <=> ${JSON.stringify(queryVector)}::vector as distance
                    FROM "JobPosting"
                    WHERE "isActive" = true
                      AND ("salaryMin" >= ${salaryMin} OR "salaryMin" IS NULL)
                      ${locationFilter}
                      ${dateFilter}
                    ORDER BY distance ASC
                    LIMIT ${pageSize}
                `;

                // Merge and deduplicate
                const existingIds = new Set(results.map((r: any) => r.id));
                const filteredSemantic = semanticResults.filter((r: any) => !existingIds.has(r.id));
                
                finalResults = [...results, ...filteredSemantic].slice(0, pageSize);
                isSemantic = true;
            } catch (err) {
                console.error('Semantic search failed, returning keyword results only', err);
            }
        }

        return NextResponse.json({ 
            jobs: finalResults, 
            count: total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
            isSemantic
        });

    } catch (err) {
        console.error('Search error:', err);
        return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
}
