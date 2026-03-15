import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { matchJobsWithResume } from '@/lib/jobs/matcher';
import { deductCredits, checkCredits } from '@/lib/credits';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const resumeId = searchParams.get('resumeId');
        if (!resumeId) return NextResponse.json({ error: 'Resume ID required' }, { status: 400 });

        // Credit check
        const canAfford = await checkCredits((session.user as any).id, 'JOB_MATCH');
        if (!canAfford.allowed) return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });

        const recommendations = await matchJobsWithResume(resumeId);
        
        // Deduct credits
        await deductCredits((session.user as any).id, 'JOB_MATCH', 'Job Match Analysis');

        return NextResponse.json({ recommendations });
    } catch (err) {
        console.error('Recommendations error:', err);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
