import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { unstable_cache, revalidateTag } from 'next/cache';

const getCachedResumes = (userId: string) => unstable_cache(
    async () => {
        return await prisma.resume.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: { id: true, title: true, createdAt: true, updatedAt: true },
        });
    },
    [`resumes-${userId}`],
    { tags: [`resumes-${userId}`], revalidate: 3600 }
)();

const getCachedSingleResume = (id: string, userId: string) => unstable_cache(
    async () => {
        return await prisma.resume.findFirst({
            where: { id, userId }
        });
    },
    [`resume-${id}-${userId}`],
    { tags: [`resumes-${userId}`, `resume-${id}`], revalidate: 3600 }
)();

// GET: list user's resumes or a single resume
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as any).id;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
        const resume = await getCachedSingleResume(id, userId);
        if (!resume) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ resume });
    }

    const resumes = await getCachedResumes(userId);

    return NextResponse.json({ resumes });
}

// POST: save a new resume
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as any).id;
    const { title, data, markdown } = await req.json();

    const resume = await prisma.resume.create({
        data: {
            userId,
            title: title || 'Untitled Resume',
            data: data || {},
            markdown: markdown || null,
        },
    });

    revalidateTag(`resumes-${userId}`, {});

    return NextResponse.json({ resume });
}

// DELETE: delete a resume
export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as any).id;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Resume ID required' }, { status: 400 });

    // Verify ownership
    const resume = await prisma.resume.findFirst({ where: { id, userId } });
    if (!resume) return NextResponse.json({ error: 'Resume not found' }, { status: 404 });

    await prisma.resume.delete({ where: { id } });
    revalidateTag(`resumes-${userId}`, {});
    revalidateTag(`resume-${id}`, {});
    return NextResponse.json({ success: true });
}

// PUT: update an existing resume
export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as any).id;
    const { id, title, data, markdown } = await req.json();

    if (!id) return NextResponse.json({ error: 'Resume ID required' }, { status: 400 });

    // Verify ownership and existence
    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
        return NextResponse.json({ error: 'User account not found. Please log out and log in again.' }, { status: 401 });
    }

    const existing = await prisma.resume.findFirst({ where: { id, userId } });
    if (!existing) return NextResponse.json({ error: 'Resume not found or unauthorized' }, { status: 404 });

    const updated = await prisma.resume.update({
        where: { id },
        data: {
            title: title || existing.title,
            data: data || existing.data,
            markdown: markdown !== undefined ? markdown : existing.markdown,
        },
    });

    revalidateTag(`resumes-${userId}`, {});
    revalidateTag(`resume-${id}`, {});

    return NextResponse.json({ resume: updated });
}
