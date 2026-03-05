import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { deductCredits, checkCredits, CREDIT_COSTS } from '@/lib/credits';

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

Return ONLY valid JSON, no other text:
{
  "score": <number 0-100>,
  "matchedKeywords": ["keyword1", "keyword2"],
  "missingKeywords": ["keyword1", "keyword2"],
  "suggestions": ["suggestion1", "suggestion2"]
}

Rules:
- Score 0-100 based on keyword match, skills alignment, and experience relevance
- matchedKeywords: skills/tech/qualifications found in BOTH resume and JD
- missingKeywords: important skills/requirements in JD but NOT in resume
- suggestions: 2-4 actionable tips to improve the match
- Be thorough — check technical skills, soft skills, certifications, years of experience
- Do NOT include any text outside the JSON

Job Description:
---
${jobDescription.substring(0, 2000)}
---

Resume:
---
${resume.substring(0, 3000)}
---
`;

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: "google/gemma-3-4b-it:free",
                temperature: 0.2,
                max_tokens: 600,
                messages: [{ role: 'user', content: prompt }],
            }),
        });

        if (!response.ok) {
            return NextResponse.json({ error: 'ATS analysis failed' }, { status: 500 });
        }

        const data = await response.json();
        let content = data.choices?.[0]?.message?.content?.trim() || '';
        content = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

        try {
            const result = JSON.parse(content);
            // SUCCESS — now deduct credits
            await deductCredits(userId, 'ATS_SCORE', 'ATS Compatibility Score');
            return NextResponse.json(result);
        } catch {
            console.error('ATS score parse error:', content.substring(0, 200));
            // DON'T deduct — AI returned garbage
            return NextResponse.json({ error: 'Invalid AI response. Please try again.' }, { status: 500 });
        }
    } catch (err) {
        console.error('ATS score error:', err);
        return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
    }
}
