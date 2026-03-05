import { NextResponse } from 'next/server';
import { extractText } from 'unpdf';
import mammoth from 'mammoth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { deductCredits, checkCredits, CREDIT_COSTS } from '@/lib/credits';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
        }

        const userId = (session.user as any).id;

        // Pre-check credits (don't deduct yet — deduct only after success)
        const creditCheck = await checkCredits(userId, 'PARSE_RESUME');
        if (!creditCheck.allowed) {
            return NextResponse.json({ error: `Insufficient credits. Need ${creditCheck.cost}, have ${creditCheck.balance}.` }, { status: 403 });
        }

        console.log('parse-resume: Received file:', file.name, 'size:', file.size);

        const fileName = file.name.toLowerCase();
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        let text = '';

        if (fileName.endsWith('.pdf')) {
            try {
                const result = await extractText(new Uint8Array(arrayBuffer));
                text = Array.isArray(result.text) ? result.text.join('\n') : String(result.text);
            } catch (e) {
                console.error('PDF parse error:', e);
                return NextResponse.json({ error: 'Could not parse PDF.' }, { status: 400 });
            }
        } else if (fileName.endsWith('.docx')) {
            try {
                const result = await mammoth.extractRawText({ buffer });
                text = result.value;
            } catch (e) {
                console.error('DOCX parse error:', e);
                return NextResponse.json({ error: 'Could not parse Word doc.' }, { status: 400 });
            }
        } else if (fileName.endsWith('.doc')) {
            return NextResponse.json({ error: '.doc not supported. Please save as .docx.' }, { status: 400 });
        } else if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
            text = buffer.toString('utf-8');
        } else {
            return NextResponse.json({ error: 'Unsupported file type.' }, { status: 400 });
        }

        if (!text || text.trim().length < 10) {
            return NextResponse.json({ error: 'File appears empty or unreadable.' }, { status: 400 });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) return NextResponse.json({ error: 'Server config error' }, { status: 500 });

        const parsePrompt = `You are a resume parser. Return ONLY valid JSON, no other text.

Extract ALL information from this resume into the following STRICT JSON structure.
For arrays, extract EVERY entry found in the resume — do not summarize or merge.

{
  "fullName": "string",
  "email": "string",
  "phone": "string",
  "location": "string",
  "linkedin": "string or empty",
  "github": "string or empty",
  "portfolio": "string or empty",
  "summary": "professional summary if present",
  "targetRole": "most recent or current job title",
  "skills": ["skill1", "skill2", "..."],
  "experience": [
    {
      "jobTitle": "string",
      "company": "string",
      "location": "string",
      "startDate": "string",
      "endDate": "string or Present",
      "bullets": ["achievement 1", "achievement 2"]
    }
  ],
  "projects": [
    {
      "name": "string",
      "techStack": "string",
      "description": "string",
      "link": "string or empty"
    }
  ],
  "education": [
    {
      "degree": "string",
      "institution": "string",
      "year": "string",
      "gpa": "string or empty"
    }
  ],
  "certifications": ["cert1", "cert2"],
  "languages": ["English", "Hindi"]
}

Rules:
- Extract EVERY work experience entry separately
- Extract EVERY education entry separately
- Extract EVERY project separately
- Skills should be individual items, not grouped
- If a field is not found, use empty string "" or empty array []
- Do NOT include any text outside the JSON

Resume text:
---
${text.substring(0, 5000)}
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
                temperature: 0.0,
                max_tokens: 3000,
                messages: [{ role: 'user', content: parsePrompt }],
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('Parse API error:', errText);
            return NextResponse.json({ error: 'Failed to parse with AI' }, { status: 500 });
        }

        const data = await response.json();
        let content = data.choices?.[0]?.message?.content?.trim() || '';

        // Aggressively match only the JSON payload 
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            content = jsonMatch[0];
        }

        try {
            const parsed = JSON.parse(content);
            // SUCCESS — now deduct credits
            await deductCredits(userId, 'PARSE_RESUME', 'AI Resume Parsing');
            return NextResponse.json({ parsed });
        } catch (jsonErr) {
            console.error('Failed to parse AI JSON:', content.substring(0, 500));
            // DON'T deduct — AI returned garbage
            return NextResponse.json({ error: 'AI returned invalid formatting. Please try again or enter manually.' }, { status: 500 });
        }
    } catch (err) {
        console.error('Parse resume error:', err);
        return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
    }
}
