import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { deductCredits, checkCredits, CREDIT_COSTS } from '@/lib/credits';

export async function POST(req: Request) {
    try {
        const { resumeData, jobDescription } = await req.json();

        if (!resumeData) {
            return NextResponse.json({ error: 'Resume data is required' }, { status: 400 });
        }

        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
        }

        const userId = (session.user as any).id;

        // Pre-check credits (don't deduct yet)
        const creditCheck = await checkCredits(userId, 'COVER_LETTER');
        if (!creditCheck.allowed) {
            return NextResponse.json({ error: `Insufficient credits. Need ${creditCheck.cost}, have ${creditCheck.balance}.` }, { status: 403 });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) return NextResponse.json({ error: 'Config error' }, { status: 500 });

        const prompt = `You are an expert career coach and professional copywriter.
Write a highly persuasive, customized, and professional cover letter based on the provided resume and job description.

REQUIREMENTS:
1. The cover letter must be written in the first person ("I").
2. Begin immediately with "Dear Hiring Manager," — do NOT include a generic header blocks with name/date/address placeholders. Do not output "[Date]" or "[Address]".
3. Structure: 
    - Engaging opening stating the target role.
    - 2-3 body paragraphs highlighting the MOST RELEVANT experience and skills from the resume.
    - Strong closing paragraph expressing enthusiasm.
4. Keep it concise (300-400 words). Do NOT hallucinate skills or experiences. DO NOT use bracketed placeholders like "[Company Name]" — if the company name isn't in the job description, just refer to "your company" or "the team".
5. Return the output as formatted markdown.

Resume Data:
${JSON.stringify(resumeData, null, 2)}

Job Description (if available):
${jobDescription ? jobDescription.substring(0, 3000) : 'General application for ' + (resumeData.targetRole || 'this role') + '. Focus on the resume strengths.'}
`;

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: "google/gemma-3-4b-it:free", // Reverting to stable free model
                temperature: 0.6,
                max_tokens: 1000,
                messages: [{ role: 'user', content: prompt }],
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('Cover letter generation failed:', errText);
            return NextResponse.json({ error: 'Failed to generate cover letter.' }, { status: 500 });
        }

        const data = await response.json();
        const coverLetter = data.choices?.[0]?.message?.content?.trim() || '';

        if (!coverLetter) {
            // DON'T deduct — AI returned empty
            return NextResponse.json({ error: 'AI returned an empty response. Please try again.' }, { status: 500 });
        }

        // SUCCESS — now deduct credits
        await deductCredits(userId, 'COVER_LETTER', 'AI Cover Letter Generation');

        return NextResponse.json({ coverLetter });
    } catch (err) {
        console.error('Cover letter API error:', err);
        return NextResponse.json({ error: 'Unexpected error generating cover letter.' }, { status: 500 });
    }
}
