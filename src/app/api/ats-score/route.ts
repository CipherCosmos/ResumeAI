import { callAI } from '@/lib/ai';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { deductCredits, checkCredits } from '@/lib/credits';
import { z } from 'zod';

const atsScoreSchema = z.object({
    score: z.number().min(0).max(100),
    matchedKeywords: z.array(z.string()),
    missingKeywords: z.array(z.string()),
    suggestions: z.array(z.string())
});

export async function POST(req: Request) {
    try {
        const { resume, jobDescription } = await req.json();

        if (!resume || !jobDescription) {
            return NextResponse.json({ error: 'Resume and job description required' }, { status: 400 });
        }

        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
        }

        const userId = (session.user as any).id;

        // Pre-check credits (don't deduct yet)
        const creditCheck = await checkCredits(userId, 'ATS_SCORE');
        if (!creditCheck.allowed) {
            return NextResponse.json({ error: `Insufficient credits. Need ${creditCheck.cost}, have ${creditCheck.balance}.` }, { status: 403 });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) return NextResponse.json({ error: 'Config error' }, { status: 500 });

        const prompt = `You are an ATS (Applicant Tracking System) analysis expert. Analyze the resume against the job description.

Rules:
- Score 0-100 based on keyword match, skills alignment, and experience relevance
- matchedKeywords: skills/tech/qualifications found in BOTH resume and JD
- missingKeywords: important skills/requirements in JD but NOT in resume
- suggestions: 2-4 actionable tips to improve the match
- Be thorough — check technical skills, soft skills, certifications, years of experience

Job Description:
---
${jobDescription.substring(0, 2000)}
---

Resume:
---
${resume.substring(0, 3000)}
---
`;

        const aiResult = await callAI({
            messages: [
                { role: 'system', content: 'You are an ATS analysis expert. You MUST respond ONLY with a valid JSON object matching exactly this schema: { "score": <number 0-100>, "matchedKeywords": ["string"], "missingKeywords": ["string"], "suggestions": ["string"] }. Do not include markdown formatting like ```json.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.2,
            max_tokens: 600,
        });

        let content = aiResult.content;
        content = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

        try {
            const result = atsScoreSchema.parse(JSON.parse(content));
            // SUCCESS — now deduct credits
            await deductCredits(userId, 'ATS_SCORE', 'ATS Compatibility Score');
            return NextResponse.json(result);
        } catch (parseError) {
            console.error('ATS score parse error:', parseError, content.substring(0, 200));
            // DON'T deduct — AI returned garbage
            return NextResponse.json({ error: 'Invalid AI response format. Please try again.' }, { status: 500 });
        }
    } catch (err) {
        console.error('ATS score error:', err);
        return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
    }
}
