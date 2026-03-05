import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, contact, location, target_role, skills, experience, education } = body;

        // Validate inputs
        if (!name || !contact || !target_role) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Secure API key handling
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            console.error('OPENROUTER_API_KEY is missing');
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }

        // Construct the prompt mirroring the user's Python script
        const resumePrompt = `
You are a world-class executive resume writer and ATS optimization expert.

Generate a FULL one-page professional resume.

Candidate Information:
Name: ${name}
Contact: ${contact}
Location: ${location || 'N/A'}
Target Role: ${target_role}

Skills:
${skills || 'N/A'}

Experience / Projects:
${experience || 'N/A'}

Education:
${education || 'N/A'}

STRICT RULES:

1. Use this structure:

### SUMMARY
### CORE COMPETENCIES
### PROFESSIONAL EXPERIENCE
### TECHNICAL PROJECTS
### EDUCATION

2. Use the Google XYZ formula:
Accomplished [X] measured by [Y] by doing [Z]

3. Use strong ATS keywords for:
${target_role}

4. Do NOT repeat points.

5. Bullet points must be achievement driven.

6. Keep resume concise but powerful.

7. Output ONLY Markdown.
`;

        // Call OpenRouter AI
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: "google/gemma-3-4b-it:free",
                temperature: 0.3,
                max_tokens: 1500,
                messages: [
                    {
                        role: 'user',
                        content: 'You are a world-class resume writer. Return only the resume.\n\n' + resumePrompt,
                    },
                ],
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenRouter API Error:', errorText);
            return NextResponse.json(
                { error: 'Failed to generate resume from AI service' },
                { status: response.status }
            );
        }

        const data = await response.json();
        const generatedResume = data.choices?.[0]?.message?.content;

        if (!generatedResume) {
            throw new Error('Unexpected API response structure');
        }

        return NextResponse.json({ resume: generatedResume });

    } catch (error) {
        console.error('API Route Error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
