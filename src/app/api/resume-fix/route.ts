import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { callAI } from '@/lib/ai';

/**
 * POST /api/resume-fix
 * 
 * Uses AI to auto-fix specific resume issues:
 * - Rewrite weak bullets with action verbs and better structure
 * - Generate a professional summary from existing data
 * - Suggest additional relevant skills based on experience
 * 
 * STRICT: Never hallucinate. Only enhance phrasing of existing content.
 */
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { fixType, data } = await req.json();

        if (fixType === 'bullets') {
            // Rewrite weak experience bullets
            const { experience, targetRole } = data;
            if (!Array.isArray(experience) || experience.length === 0) {
                return NextResponse.json({ error: 'No experience to fix' }, { status: 400 });
            }

            const prompt = `You are a resume bullet point editor. Your ONLY job is to improve the PHRASING of existing bullets.

⛔ ABSOLUTE RULES:
- NEVER invent metrics, numbers, or percentages
- NEVER add tools, technologies, or skills not mentioned in the bullet
- NEVER change the core meaning of what the person did
- ONLY improve sentence structure and start with a strong, industry-appropriate action verb
- If a bullet already starts with an action verb and reads well, keep it as-is
- Adapt your vocabulary to the specific field (e.g., teaching, nursing, management, tech)

Target Role: ${targetRole || 'General Professional'}

Fix these experience bullets. For each experience entry, return improved bullets.

Input:
${JSON.stringify(experience.map((e: any) => ({
                id: e.id,
                jobTitle: e.jobTitle,
                company: e.company,
                bullets: e.bullets?.filter((b: string) => b?.trim()) || []
            })), null, 2)}

Return ONLY valid JSON. No markdown, no code blocks.
{
  "experience": [
    { "id": "entry-id", "bullets": ["Improved bullet 1", "Improved bullet 2"] }
  ]
}

REMEMBER: You are EDITING, not WRITING. Keep every fact the same. Only improve the verb and sentence structure.`;

            const response = await callAI({ messages: [{ role: 'user', content: prompt }], max_tokens: 2000 });
            const text = typeof response === 'string' ? response : response?.content || '';
            const cleaned = text.replace(/```json\s*/g, '').replace(/```/g, '').trim();

            try {
                const parsed = JSON.parse(cleaned);
                return NextResponse.json({ fixedExperience: parsed.experience });
            } catch {
                return NextResponse.json({ error: 'AI response was not valid JSON' }, { status: 500 });
            }
        }

        if (fixType === 'summary') {
            // Generate a professional summary from existing data
            const { personal, targetRole, skills, experience } = data;

            const skillsText = Array.isArray(skills) ? skills.slice(0, 15).join(', ') : '';
            const expSummary = Array.isArray(experience)
                ? experience.map((e: any) => `${e.jobTitle} at ${e.company}`).join('; ')
                : '';

            const prompt = `Write a 2-3 sentence professional summary for a resume.

⛔ ABSOLUTE RULES:
- ONLY use information provided below
- NEVER invent skills, experiences, or achievements
- Keep it concise and professional, adapting the tone exactly to their industry and experience level.

Name: ${personal?.fullName || 'Candidate'}
Target Role: ${targetRole || 'Professional'}
Skills: ${skillsText}
Experience: ${expSummary}

Return ONLY the summary text. No JSON, no markdown, no quotes.`;

            const response = await callAI({ messages: [{ role: 'user', content: prompt }], max_tokens: 500 });
            const summaryText = typeof response === 'string' ? response : response?.content || '';

            return NextResponse.json({ summary: summaryText.replace(/^["']|["']$/g, '').trim() });
        }

        if (fixType === 'projects') {
            // Improve project descriptions
            const { projects, targetRole } = data;
            if (!Array.isArray(projects) || projects.length === 0) {
                return NextResponse.json({ error: 'No projects to fix' }, { status: 400 });
            }

            const prompt = `You are a resume project description editor. Improve ONLY the phrasing.

⛔ ABSOLUTE RULES:
- NEVER add technologies not mentioned in the techStack field
- NEVER invent metrics or outcomes
- ONLY improve sentence structure, start with an action verb
- Keep the same meaning

Target Role: ${targetRole || 'General'}

Input:
${JSON.stringify(projects.map((p: any) => ({
                id: p.id,
                name: p.name,
                techStack: p.techStack,
                description: p.description
            })), null, 2)}

Return ONLY valid JSON:
{
  "projects": [
    { "id": "project-id", "description": "Improved 1-2 sentence description" }
  ]
}`;

            const response = await callAI({ messages: [{ role: 'user', content: prompt }], max_tokens: 1500 });
            const text = typeof response === 'string' ? response : response?.content || '';
            const cleaned = text.replace(/```json\s*/g, '').replace(/```/g, '').trim();

            try {
                const parsed = JSON.parse(cleaned);
                return NextResponse.json({ fixedProjects: parsed.projects });
            } catch {
                return NextResponse.json({ error: 'AI response was not valid JSON' }, { status: 500 });
            }
        }

        if (fixType === 'magicRepair') {
            // High-level data sanitization and minor repairs
            const prompt = `You are a resume data sanitizer. Your job is to fix minor formatting and validation issues in the provided resume data.
            
            ⛔ ABSOLUTE RULES:
            - Fix malformed URLs (ensure they start with https:// if they look like domains)
            - Normalize date formats if they look messy
            - Ensure fields like 'year' are simple strings (e.g. "2023" or "2021-Present")
            - If a required field like 'institution' is lowercase and messy, capitalize it properly
            - NEVER invent new entries or remove existing ones
            - Return the ENTIRE data object back with your fixes applied
            
            Input Data:
            ${JSON.stringify(data, null, 2)}
            
            Return ONLY the valid JSON object. No commentary.`;

            const response = await callAI({ messages: [{ role: 'user', content: prompt }], max_tokens: 3000 });
            const text = typeof response === 'string' ? response : response?.content || '';
            const cleaned = text.replace(/```json\s*/g, '').replace(/```/g, '').trim();

            try {
                const parsed = JSON.parse(cleaned);
                return NextResponse.json({ fixedData: parsed });
            } catch {
                return NextResponse.json({ error: 'AI response was not valid JSON' }, { status: 500 });
            }
        }

        return NextResponse.json({ error: 'Unknown fix type' }, { status: 400 });
    } catch (err) {
        console.error('Resume fix error:', err);
        return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
    }
}
