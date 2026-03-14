import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');

        const where: any = { userId: (session.user as any).id };
        if (status) where.status = status;

        const applications = await prisma.jobApplication.findMany({
            where,
            include: { job: true },
            orderBy: { updatedAt: 'desc' },
        });

        return NextResponse.json({ applications });
    } catch (err) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { jobId, resumeId, status } = await req.json();

        const application = await prisma.jobApplication.upsert({
            where: {
                userId_jobId: {
                    userId: (session.user as any).id,
                    jobId,
                },
            },
            update: { status: status || 'applied', resumeId, updatedAt: new Date() },
            create: {
                userId: (session.user as any).id,
                jobId,
                resumeId,
                status: status || 'applied',
            },
        });

        return NextResponse.json(application);
    } catch (err) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
