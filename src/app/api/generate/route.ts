import { callAI, callAIStream } from '@/lib/ai';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { deductCredits, checkCredits } from '@/lib/credits';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
    try {
        // Auth check
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Please sign in to generate a resume.' }, { status: 401 });
        }
        const userId = (session.user as any).id;

        // Rate limiting: 5 generations per hour per user
        const limiter = await rateLimit(`generate:${userId}`, 5, 3600);
        if (!limiter.success) {
            logger.warn('Rate limit exceeded for resume generation', { userId });
            return NextResponse.json({ error: 'Rate limit exceeded. Please try again in an hour.' }, { status: 429 });
        }

        // Pre-check credits (don't deduct yet — we deduct only after success)
        try {
            const creditCheck = await checkCredits(userId, 'GENERATE_RESUME');
            if (!creditCheck.allowed) {
                return NextResponse.json({ error: `Insufficient credits. Need ${creditCheck.cost}, have ${creditCheck.balance}.` }, { status: 402 });
            }
        } catch (creditErr: any) {
            logger.error('Credit check failed for generation', creditErr, { userId });
            return NextResponse.json({ error: 'Unable to verify credit balance. Please try again.' }, { status: 500 });
        }

        const body = await req.json();
        const { personal, summary, targetRole, jobDescription, skills, experience, projects, education, certifications, languages, template } = body;

        if (!personal?.fullName || !targetRole) {
            return NextResponse.json({ error: 'Missing required fields (name, target role)' }, { status: 400 });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        // Build structured sections
        const contactLine = [personal.email, personal.phone, personal.location].filter(Boolean).join(' | ');
        const linksLine = [personal.linkedin, personal.github, personal.portfolio].filter(Boolean).join(' | ');

        const skillsText = Array.isArray(skills) ? skills.join(', ') : (skills || 'N/A');

        const experienceText = Array.isArray(experience) && experience.length > 0
            ? experience.map((e: any) => {
                const header = `**${e.jobTitle || 'Role'}** at **${e.company || 'Company'}** (${e.startDate || ''}–${e.endDate || 'Present'})${e.location ? ', ' + e.location : ''}`;
                const bullets = Array.isArray(e.bullets) ? e.bullets.filter(Boolean).map((b: string) => `- ${b}`).join('\n') : '';
                return `${header}\n${bullets}`;
            }).join('\n\n')
            : 'N/A';

        const projectsText = Array.isArray(projects) && projects.length > 0
            ? projects.map((p: any) => {
                return `**${p.name}** (${p.techStack || 'Various'}): ${p.description || 'No description'}${p.link ? ' — ' + p.link : ''}`;
            }).join('\n')
            : '';

        const educationText = Array.isArray(education) && education.length > 0
            ? education.map((e: any) => {
                return `**${e.degree || 'Degree'}**, ${e.institution || 'Institution'}, ${e.year || ''}${e.gpa ? ' (GPA: ' + e.gpa + ')' : ''}`;
            }).join('\n')
            : 'N/A';

        const certsText = Array.isArray(certifications) && certifications.length > 0
            ? certifications.join(', ')
            : '';

        const langsText = Array.isArray(languages) && languages.length > 0
            ? languages.join(', ')
            : '';

        // JD keyword extraction instruction
        const jdInstruction = jobDescription
            ? `\n\nTARGET JOB DESCRIPTION (for keyword alignment only):
---
${jobDescription.substring(0, 2500)}
---
Use the JD to guide keyword ORDERING and PHRASING. But NEVER add skills or tools the candidate didn't provide.`
            : '';

        const prompt = `You are a professional resume editor. Your ONLY job is to improve the PHRASING and STRUCTURE of the candidate's existing resume data. You are NOT creating new content.

${jdInstruction}

=== ⛔ ABSOLUTE TRUTHFULNESS RULES (HIGHEST PRIORITY — VIOLATING THESE IS UNACCEPTABLE) ===

1. NEVER invent, fabricate, or hallucinate ANY:
   - Skills or technologies the candidate did not list
   - Tools, frameworks, or platforms not mentioned in their data
   - Metrics, numbers, percentages, or dollar amounts they did not provide
   - Job responsibilities or achievements they did not describe
   - Company names, titles, or dates they did not provide
   - Certifications or qualifications they did not mention

2. You may ONLY:
   - Reword existing bullets for better impact (stronger verbs, clearer structure)
   - Rearrange information for better flow
   - Fix grammar and spelling
   - Ensure bullets start with action verbs
   - Write a summary that ONLY references skills/experience the candidate actually has
   - Reorder the skills list to prioritize JD-relevant ones FIRST

3. If the candidate provided a metric (e.g., "500K+ records"), keep that EXACT metric
4. If the candidate did NOT provide a metric, do NOT invent one — just improve the phrasing
5. The candidate's tech stack for each project/experience is SACRED — use their exact tools

=== RESUME IMPROVEMENT RULES ===

📝 PROFESSIONAL SUMMARY:
- Write 2-3 sentences based ONLY on what the candidate provided
- Sentence 1: "[Their actual title] with experience in [their actual domain based on experience data]"
- Sentence 2: Their actual technical expertise (list only skills THEY provided)
- Sentence 3: One real achievement from their experience data (use their actual metric if they gave one)
- ONLY mention technologies and tools that appear in their skills list or experience bullets
- Keep it concise and factual

💼 EXPERIENCE BULLETS:
- Start each bullet with a strong past-tense action verb (Developed, Designed, Implemented, Built, Processed, etc.)
- PRESERVE the candidate's exact claims — if they said "500K+ records", keep "500K+ records"
- PRESERVE the candidate's exact tech stack — if they said "BigQuery", don't change to "Snowflake"
- Only improve SENTENCE STRUCTURE, not the CONTENT
- Each experience entry: keep the SAME NUMBER of bullets the candidate provided (do not add or remove bullets)
- If a bullet is vague (e.g., "Worked on data pipeline"), make it specific using ONLY information from that same experience entry

🛠️ SKILLS:
- Return the candidate's EXACT skills list
- You may reorder them to put JD-relevant skills first
- You may normalize formatting (e.g., "python" → "Python", "GCP" → "Google Cloud Platform (GCP)")
- Do NOT add skills the candidate didn't list
- Do NOT remove any skills the candidate listed

📁 PROJECTS:
- Keep the candidate's EXACT tech stack (shown in parentheses)
- Improve the description sentence structure only
- Start with an action verb
- PRESERVE any metrics the candidate included
- Do NOT add technologies or outcomes they didn't mention

=== CANDIDATE DATA ===

Target Role: ${targetRole}
Summary: ${summary || 'None provided — write one based ONLY on the experience and skills listed below.'}
Skills: ${skillsText}

Experience:
${experienceText}

Projects:
${projectsText}

=== OUTPUT FORMAT ===

Return ONLY valid JSON. No markdown, no code blocks, no explanations.
{
  "summary": "2-3 sentence summary using ONLY facts from the candidate's data",
  "skills": ["Their exact skills, reordered for relevance"],
  "experience": [
    { "id": "experience-id", "bullets": ["Improved version of their EXACT bullet", "..."] }
  ],
  "projects": [
    { "id": "project-id", "description": "Improved version of their EXACT description" }
  ]
}

Experience IDs: ${experience.map((e: any) => e.id).join(', ')}
Project IDs: ${projects.map((p: any) => p.id).join(', ')}

REMEMBER: You are an EDITOR, not a WRITER. Improve their words, don't replace them with fiction.
Return ONLY valid JSON. Nothing else.`;

        let aiResponse: any;
        try {
            aiResponse = await callAI({
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3,
                max_tokens: 3000,
            });
        } catch (aiErr: any) {
            logger.error('AI generation call failed', aiErr, { userId });
            return NextResponse.json({ error: aiErr.message || 'All AI models are currently unavailable. Please try again later.' }, { status: 503 });
        }

        let content = aiResponse.content;
        content = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

        let tailoredData: any;
        try {
            tailoredData = JSON.parse(content);
        } catch (e) {
            logger.error('Failed to parse tailored resume JSON', e, { userId, content: content.substring(0, 500) });
            return NextResponse.json({ error: 'AI generated invalid data. Please try again.' }, { status: 500 });
        }

        // Apply tailored data to the original form body
        const finalResumeData = { ...body };
        if (tailoredData.summary) finalResumeData.summary = tailoredData.summary;
        if (Array.isArray(tailoredData.skills)) finalResumeData.skills = tailoredData.skills;

        if (Array.isArray(tailoredData.experience)) {
            finalResumeData.experience = finalResumeData.experience.map((exp: any) => {
                const match = tailoredData.experience.find((te: any) => te.id === exp.id);
                return match ? { ...exp, bullets: match.bullets } : exp;
            });
        }

        if (Array.isArray(tailoredData.projects)) {
            finalResumeData.projects = finalResumeData.projects.map((proj: any) => {
                const match = tailoredData.projects.find((tp: any) => tp.id === proj.id);
                return match ? { ...proj, description: match.description } : proj;
            });
        }

        let dbRes;
        try {
            await deductCredits(userId, 'GENERATE_RESUME', 'Generated ATS resume');

            dbRes = await prisma.resume.create({
                data: {
                    userId,
                    title: `${targetRole} Resume`,
                    data: finalResumeData,
                }
            });
        } catch (dbErr) {
            logger.error('Failed to save tailored resume or deduct credits', dbErr, { userId });
        }

        return NextResponse.json({
            data: finalResumeData,
            resumeId: dbRes?.id || null
        });
    } catch (error) {
        logger.error('Generate API unexpected error', error);
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
}
