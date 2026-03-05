import { NextResponse } from 'next/server';
import { extractText } from 'unpdf';
import mammoth from 'mammoth';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            console.error('parse-resume: No file in FormData. Keys:', [...formData.keys()]);
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        console.log('parse-resume: Received file:', file.name, 'size:', file.size, 'type:', file.type);

        const fileName = file.name.toLowerCase();
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        let text = '';

        // --- Extract text based on file type ---
        if (fileName.endsWith('.pdf')) {
            try {
                const result = await extractText(new Uint8Array(arrayBuffer));
                text = Array.isArray(result.text) ? result.text.join('\n') : String(result.text);
                console.log('parse-resume: PDF extracted text length:', text.length);
            } catch (e) {
                console.error('parse-resume: PDF parse error:', e);
                return NextResponse.json({ error: 'Could not parse PDF. The file may be image-based or corrupted.' }, { status: 400 });
            }
        } else if (fileName.endsWith('.docx')) {
            try {
                const result = await mammoth.extractRawText({ buffer });
                text = result.value;
                console.log('parse-resume: DOCX extracted text length:', text.length);
            } catch (e) {
                console.error('parse-resume: DOCX parse error:', e);
                return NextResponse.json({ error: 'Could not parse Word document.' }, { status: 400 });
            }
        } else if (fileName.endsWith('.doc')) {
            return NextResponse.json({ error: '.doc files are not supported. Please save as .docx and re-upload.' }, { status: 400 });
        } else if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
            text = buffer.toString('utf-8');
        } else {
            return NextResponse.json({ error: 'Unsupported file type. Please upload PDF, DOCX, TXT, or MD.' }, { status: 400 });
        }

        if (!text || text.trim().length < 10) {
            console.error('parse-resume: Extracted text too short:', text.length, 'chars');
            return NextResponse.json(
                { error: 'File appears to be empty or the text could not be extracted. If this is a scanned/image-based PDF, please try a text-based version.' },
                { status: 400 }
            );
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Server config error' }, { status: 500 });
        }

        const parsePrompt = `
You are a resume parser. Return ONLY valid JSON, no other text.

Analyze the following resume text and extract the candidate's information into a strict JSON format.
Return ONLY a valid JSON object with these exact keys:
{
  "name": "Full Name",
  "contact": "Phone and/or email",
  "location": "City, State or country",
  "target_role": "Current or most recent job title",
  "skills": "Comma separated list of skills",
  "experience": "Summary of work experience and projects",
  "education": "Education and certifications"
}

If a field cannot be determined, use an empty string "".
Do NOT include any text outside the JSON object. No markdown, no explanation.

Resume text:
---
${text.substring(0, 4000)}
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
                temperature: 0.1,
                max_tokens: 800,
                messages: [
                    { role: 'user', content: parsePrompt },
                ],
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('parse-resume: OpenRouter API error:', errText);
            return NextResponse.json({ error: 'Failed to parse resume with AI' }, { status: 500 });
        }

        const data = await response.json();
        let content = data.choices?.[0]?.message?.content?.trim() || '';

        // Strip markdown code fences if present
        content = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

        try {
            const parsed = JSON.parse(content);
            return NextResponse.json({ parsed });
        } catch {
            console.error('parse-resume: Failed to parse AI JSON response:', content);
            return NextResponse.json(
                { error: 'AI returned an invalid response. Please try again.' },
                { status: 500 }
            );
        }

    } catch (err) {
        console.error('parse-resume: Unexpected error:', err);
        return NextResponse.json({ error: 'Unexpected error parsing resume' }, { status: 500 });
    }
}
