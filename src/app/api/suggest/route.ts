import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { field, value, target_role } = body;

        if (!field || !value || value.length < 3) {
            return NextResponse.json({ suggestion: '' });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Server config error' }, { status: 500 });
        }

        const fieldPrompts: Record<string, string> = {
            skills: `The candidate is targeting the role of "${target_role || 'a professional role'}". They have listed these skills: "${value}". Suggest 3-5 additional highly relevant skills they should consider adding, formatted as a comma-separated list. Be concise. Output ONLY the suggested skills, nothing else.`,
            experience: `The candidate is targeting "${target_role || 'a professional role'}". They wrote this experience description: "${value}". Rewrite and optimize this into 2-3 powerful achievement-driven bullet points using the Google XYZ formula (Accomplished [X] measured by [Y] by doing [Z]). Use strong ATS keywords. Output ONLY the improved bullet points.`,
            education: `The candidate wrote this education section: "${value}". They are targeting "${target_role || 'a professional role'}". Suggest any relevant certifications or coursework they should highlight. Be concise. Output ONLY the suggestions.`,
        };

        const prompt = fieldPrompts[field];
        if (!prompt) {
            return NextResponse.json({ suggestion: '' });
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: "google/gemma-3-4b-it:free",
                temperature: 0.5,
                max_tokens: 300,
                messages: [
                    { role: 'user', content: 'You are a concise career advisor. Give short, actionable suggestions. No explanations or preamble.\n\n' + prompt },
                ],
            }),
        });

        if (!response.ok) {
            return NextResponse.json({ suggestion: '' });
        }

        const data = await response.json();
        const suggestion = data.choices?.[0]?.message?.content?.trim() || '';

        return NextResponse.json({ suggestion });

    } catch {
        return NextResponse.json({ suggestion: '' });
    }
}
