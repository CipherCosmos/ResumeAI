import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { generateEmbedding } from '@/lib/ai';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q') || '';
        const location = searchParams.get('location');
        const salaryMin = parseInt(searchParams.get('salaryMin') || '0');
        
        // Multiselect support (comma-separated strings)
        const experience = searchParams.get('experience')?.split(',').filter(Boolean) || [];
        const types = searchParams.get('type')?.split(',').filter(Boolean) || [];
        const disciplines = searchParams.get('discipline')?.split(',').filter(Boolean) || [];
        const industries = searchParams.get('industry')?.split(',').filter(Boolean) || [];
        
        // Metadata flags
        const visa = searchParams.get('visa') === 'true';
        const remote = searchParams.get('remote') === 'true';
        
        const sortBy = searchParams.get('sortBy') || 'relevance';
        const daysOld = searchParams.get('days_old');
        
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const pageSize = Math.max(1, parseInt(searchParams.get('pageSize') || '20'));
        const skip = (page - 1) * pageSize;
        
        // 1. Build Dynamic Filter
        const where: any = { 
            isActive: true,
            salaryMin: salaryMin ? { gte: salaryMin } : undefined,
        };

        if (location) {
            where.location = { contains: location, mode: 'insensitive' };
        }
        
        if (experience.length > 0) {
            where.experienceLevel = { in: experience };
        }

        if (types.length > 0) {
            where.employmentType = { in: types };
        }

        if (industries.length > 0) {
            where.industry = { in: industries };
        }

        if (disciplines.length > 0) {
            where.OR = disciplines.map(d => ({
                OR: [
                    { title: { contains: d, mode: 'insensitive' } },
                    { description: { contains: d, mode: 'insensitive' } },
                    { industry: { contains: d, mode: 'insensitive' } }
                ]
            }));
        }

        if (visa) {
            // Check for visa mention in description if not explicit (professional fallback)
            where.description = { contains: 'sponsorship', mode: 'insensitive' };
        }

        if (remote) {
            where.locationType = 'Remote';
        }

        let dateLimit: Date | null = null;
        const maxDays = daysOld ? Math.min(parseInt(daysOld), 120) : 90; 
        
        dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - maxDays);
        where.postedAt = { gte: dateLimit };

        if (query) {
            where.OR = [
                ...(where.OR || []),
                { title: { contains: query, mode: 'insensitive' } },
                { company: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
            ];
        }

        // 2. Sorting Strategy
        let orderBy: any = [{ postedAt: 'desc' }, { id: 'asc' }];
        
        if (sortBy === 'salary') {
            orderBy = [{ salaryMax: 'desc' }, { id: 'asc' }];
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

        // 3. Multi-Factor "Best Match" Ranking
        if (sortBy === 'relevance') {
            finalResults = results.map((job: any) => {
                let score = 0;
                
                // Recency weight (Max 20)
                const ageDays = (new Date().getTime() - new Date(job.postedAt).getTime()) / (1000 * 3600 * 24);
                score += Math.max(0, 20 - ageDays);
                
                // Salary weight (Max 15)
                if (job.salaryMin && salaryMin > 0) {
                    if (job.salaryMin >= salaryMin * 1.2) score += 15;
                    else if (job.salaryMin >= salaryMin) score += 10;
                }

                // Keyword relevance in title (Max 30)
                if (query) {
                    const q = query.toLowerCase();
                    const t = job.title.toLowerCase();
                    if (t.includes(q)) score += 30;
                    else if (job.description.toLowerCase().includes(q)) score += 15;
                }

                // Experience alignment (Max 15)
                if (experience.length > 0 && job.experienceLevel) {
                    if (experience.includes(job.experienceLevel)) score += 15;
                    else if (experience.includes('Entry') && job.experienceLevel === 'Intern') score += 10;
                    else if (experience.includes('Senior') && job.experienceLevel === 'Mid') score += 5;
                }

                // Skill / Discipline Overlap (Max 25)
                if (disciplines.length > 0) {
                    const jobSkills = Array.isArray(job.skills) ? (job.skills as string[]).map(s => s.toLowerCase()) : [];
                    const matches = disciplines.filter(d => {
                        const dl = d.toLowerCase();
                        return jobSkills.some(js => js.includes(dl)) || job.title.toLowerCase().includes(dl);
                    });
                    score += Math.min(25, matches.length * 10);
                }

                // Location Type (Max 10)
                if (remote && job.location?.toLowerCase().includes('remote')) {
                    score += 10;
                }

                return { ...job, discoveryScore: score };
            }).sort((a: any, b: any) => (b.discoveryScore || 0) - (a.discoveryScore || 0));
        }

        // 4. Semantic Fallback (Enhanced)
        if (query && results.length < 5 && page === 1) {
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

                const existingIds = new Set(results.map((r: any) => r.id));
                const filteredSemantic = semanticResults.filter((r: any) => !existingIds.has(r.id));
                
                finalResults = [...finalResults, ...filteredSemantic].slice(0, pageSize);
                isSemantic = true;
            } catch (err) {
                console.error('Semantic failed', err);
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
