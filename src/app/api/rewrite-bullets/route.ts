import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { deductCredits, checkCredits, CREDIT_COSTS } from '@/lib/credits';

export async function POST(req: Request) {
    try {
        const { entry, targetRole } = await req.json();

        if (!entry || !entry.bullets || entry.bullets.length === 0) {
            return NextResponse.json({ error: 'Experience entry with bullets is required' }, { status: 400 });
        }

        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
        }

        const userId = (session.user as any).id;

        // Pre-check credits (don't deduct yet)
        const creditCheck = await checkCredits(userId, 'REWRITE_BULLETS');
        if (!creditCheck.allowed) {
            return NextResponse.json({ error: `Insufficient credits. Need ${creditCheck.cost}, have ${creditCheck.balance}.` }, { status: 403 });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) return NextResponse.json({ error: 'Config error' }, { status: 500 });

        const prompt = `You are an expert resume writer. Rewrite the following achievement bullets for a ${entry.jobTitle || 'professional'} at ${entry.company || 'a company'}, targeting a ${targetRole || 'new'} role.

Follow the Google XYZ formula: "Accomplished [X], as measured by [Y], by doing [Z]".
Make them highly impactful, active, and results-oriented.

Return ONLY a valid JSON array of strings (the rewritten bullets). Nothing else.
Example: ["bullet 1...", "bullet 2..."]

Original Bullets:
${entry.bullets.join('\n')}
`;

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: "google/gemma-3-4b-it:free",
                temperature: 0.4,
                max_tokens: 500,
                messages: [{ role: 'user', content: prompt }],
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('Bullet rewrite failed:', errText);
            return NextResponse.json({ error: 'Failed to rewrite bullets.' }, { status: 500 });
        }

        const data = await response.json();
        let content = data.choices?.[0]?.message?.content?.trim() || '';
        content = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

        try {
            const rewritten = JSON.parse(content);
            if (Array.isArray(rewritten)) {
                // SUCCESS — now deduct credits
                await deductCredits(userId, 'REWRITE_BULLETS', 'AI Bullet Rewriting');
                return NextResponse.json({ bullets: rewritten });
            } else {
                return NextResponse.json({ error: 'Invalid response format from AI' }, { status: 500 });
            }
        } catch {
            return NextResponse.json({ error: 'Invalid response from AI' }, { status: 500 });
        }
    } catch (err) {
        console.error('Bullet rewrite error:', err);
        return NextResponse.json({ error: 'Unexpected error rewriting bullets.' }, { status: 500 });
    }
}
