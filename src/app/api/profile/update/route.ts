import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { name, phone, address, image } = body;

        const user = await prisma.user.update({
            where: { email: session.user.email },
            data: {
                name,
                phone,
                address,
                image
            },
        });

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                image: user.image
            }
        });
    } catch (error: any) {
        console.error('Profile update error:', error);
        return NextResponse.json(
            { error: error?.message || 'Internal server error while updating profile' },
            { status: 500 }
        );
    }
}
