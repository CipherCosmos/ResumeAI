import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const search = searchParams.get('search') || '';
        const limit = 20;
        const skip = (page - 1) * limit;

        const where: any = { isActive: true };
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { company: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [jobs, total] = await Promise.all([
            prisma.jobPosting.findMany({
                where,
                orderBy: { postedAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.jobPosting.count({ where }),
        ]);

        return NextResponse.json({
            jobs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        console.error('Jobs fetch error:', err);
        return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
    }
}
