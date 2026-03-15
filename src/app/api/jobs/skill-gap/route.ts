import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { runSkillGapAnalysis } from '@/lib/jobs/skill-gap';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const resumeId = searchParams.get('resumeId');
        const role = searchParams.get('role');

        if (!resumeId) return NextResponse.json({ error: 'Resume ID required' }, { status: 400 });

        const analysis = await runSkillGapAnalysis(resumeId, role || undefined);
        return NextResponse.json(analysis);
    } catch (err) {
        console.error('Skill gap error:', err);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
