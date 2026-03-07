import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!(session?.user as any)?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { provider } = await req.json();

        if (!provider || typeof provider !== 'string') {
            return NextResponse.json({ error: 'Provider is required' }, { status: 400 });
        }

        // Attempt to delete the account binding
        const deletedAccount = await prisma.account.deleteMany({
            where: {
                userId: (session!.user as any).id,
                provider: provider.toLowerCase(),
            },
        });

        if (deletedAccount.count === 0) {
            return NextResponse.json({ error: 'No matching account found to disconnect.' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: `Successfully disconnected ${provider}.` });
    } catch (error: any) {
        console.error('Profile disconnect error:', error);
        return NextResponse.json(
            { error: error?.message || 'Internal server error while disconnecting profile' },
            { status: 500 }
        );
    }
}
