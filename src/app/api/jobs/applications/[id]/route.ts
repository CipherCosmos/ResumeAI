import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const { status, notes } = await req.json();

        const application = await prisma.jobApplication.update({
            where: { id, userId: (session.user as any).id },
            data: { status, notes, updatedAt: new Date() },
        });

        return NextResponse.json(application);
    } catch (err) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
