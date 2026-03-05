import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session: any = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const resume = await prisma.resume.findFirst({
        where: { id, userId: session.user.id },
        select: { id: true },
    });

    if (!resume) {
        return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    const shareUrl = `${process.env.NEXTAUTH_URL}/r/${resume.id}`;

    return NextResponse.json({ shareUrl });
}
