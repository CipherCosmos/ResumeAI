import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { deductCredits, checkCredits } from '@/lib/credits';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        // Auth check
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Please sign in to generate a resume.' }, { status: 401 });
        }
        const userId = (session.user as any).id;

        // Pre-check credits (don't deduct yet — we deduct only after success)
        try {
            const creditCheck = await checkCredits(userId, 'GENERATE_RESUME');
            if (!creditCheck.allowed) {
                return NextResponse.json({ error: `Insufficient credits. Need ${creditCheck.cost}, have ${creditCheck.balance}.` }, { status: 402 });
            }
        } catch (creditErr: any) {
            console.error('Credit check failed:', creditErr);
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

        // Template-specific instructions
        const templateInstructions: Record<string, string> = {
            professional: `Use a clean, traditional corporate format. Sections: PROFESSIONAL SUMMARY, CORE COMPETENCIES, PROFESSIONAL EXPERIENCE, TECHNICAL PROJECTS (if any), EDUCATION, CERTIFICATIONS (if any). Use formal language.`,
            modern: `Use a modern format with clear section divisions. Be concise and impactful. Use short paragraphs and bullet points. Include a PROFILE section at the top. Group skills into categories.`,
            minimal: `Use an extremely clean, minimal format optimized for ATS parsing. No fancy formatting. Use simple markdown. Sections: SUMMARY, SKILLS, EXPERIENCE, PROJECTS (if any), EDUCATION. Focus on content over style.`,
        };

        // JD keyword extraction instruction
        const jdInstruction = jobDescription
            ? `\n\nIMPORTANT — The candidate is applying for this specific position. Here is the job description:\n---\n${jobDescription.substring(0, 2000)}\n---\nExtract relevant keywords, required skills, and qualifications from this JD. Weave them naturally throughout the resume — especially in the summary, skills, and experience bullets. This is critical for ATS keyword matching.`
            : '';

        const prompt = `You are a world-class executive resume writer and ATS optimization expert.

Generate a FULL, detailed professional resume in Markdown format.

${templateInstructions[template] || templateInstructions.professional}

Candidate Information:
Name: ${personal.fullName}
Contact: ${contactLine}
Links: ${linksLine || 'N/A'}
Target Role: ${targetRole}

${summary ? `Candidate's Summary/Objective:\n${summary}` : 'Generate a compelling professional summary based on the data below.'}

Skills: ${skillsText}

Experience:
${experienceText}

${projectsText ? `Projects:\n${projectsText}` : ''}

Education:
${educationText}

${certsText ? `Certifications: ${certsText}` : ''}
${langsText ? `Languages: ${langsText}` : ''}
${jdInstruction}

STRICT RULES:
1. Start with the candidate's name as # heading, contact info below it
2. Use ### for section headers
3. Use Google XYZ formula for experience bullets: Accomplished [X] measured by [Y] by doing [Z]
4. Use strong ATS keywords relevant to: ${targetRole}
5. Do NOT repeat bullet points
6. Do NOT invent data that was not provided — only enhance and optimize what's given
7. Keep resume concise but powerful (aim for 1-2 pages)
8. Output ONLY Markdown, no explanations
`;

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: "google/gemma-3-4b-it:free",
                temperature: 0.3,
                max_tokens: 2500,
                messages: [{ role: 'user', content: prompt }],
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('OpenRouter API Error:', errText);
            return NextResponse.json({ error: 'Failed to generate resume' }, { status: response.status });
        }

        const data = await response.json();
        const resume = data.choices?.[0]?.message?.content;

        if (!resume) {
            return NextResponse.json({ error: 'AI returned an empty response. Credits were NOT charged. Please try again.' }, { status: 500 });
        }

        // SUCCESS — NOW deduct credits (wrapped in try-catch so a DB hiccup doesn't kill the response)
        try {
            await deductCredits(userId, 'GENERATE_RESUME', 'Generated ATS resume');
        } catch (creditErr) {
            console.error('Credit deduction failed after successful generation:', creditErr);
            // Still return the resume — the user should not lose their output
        }

        // ====== SAVE TO DATABASE ======
        try {
            await prisma.resume.create({
                data: {
                    userId,
                    title: `${targetRole} Resume`,
                    data: body,           // Store the full JSON payload
                    markdown: resume,     // Store the generated markdown result
                }
            });
            console.log(`Saved new resume for user ${userId}`);
        } catch (dbErr) {
            console.error('Failed to save generated resume to database:', dbErr);
            // We still return the resume to the user even if DB save fails, 
            // but we log the error for debugging.
        }

        return NextResponse.json({ resume });
    } catch (error) {
        console.error('Generate API error:', error);
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
}
