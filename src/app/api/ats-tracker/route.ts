import { callAI } from '@/lib/ai';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkCredits, deductCredits } from '@/lib/credits';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

// GET: return all ATS scores for the user, grouped by resume
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = (session.user as any).id;

        // Rate limiting: 10 ATS checks per hour per user
        const limiter = await rateLimit(`ats:${userId}`, 10, 3600);
        if (!limiter.success) {
            logger.warn('Rate limit exceeded for ATS tracking history', { userId });
            return NextResponse.json({ error: 'Rate limit exceeded. Please try again in an hour.' }, { status: 429 });
        }

        const scores = await prisma.atsScore.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
            select: {
                id: true,
                score: true,
                jdSnippet: true,
                matched: true,
                missing: true,
                suggestions: true,
                fullResult: true,
                createdAt: true,
                resume: { select: { id: true, title: true } },
            },
        });

        // Also get user's resumes for the "Run Analysis" picker
        const resumes = await prisma.resume.findMany({
            where: { userId },
            select: { id: true, title: true },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ scores, resumes });
    } catch (err) {
        logger.error('ATS tracker GET error', err);
        return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
    }
}

import { runATSAnalysis } from '@/lib/ats-engine';

// Convert structured resume JSON into readable text for accurate ATS analysis
function resumeDataToText(data: any): string {
    const lines: string[] = [];

    // Contact Info
    if (data.personal) {
        const p = data.personal;
        if (p.fullName) lines.push(p.fullName);
        const contactParts = [p.location, p.phone, p.email, p.linkedin, p.github, p.portfolio].filter(Boolean);
        if (contactParts.length > 0) lines.push(contactParts.join(' | '));
    }

    // Professional Summary
    if (data.summary) {
        lines.push('', 'Professional Summary', data.summary);
    }

    // Skills
    if (Array.isArray(data.skills) && data.skills.length > 0) {
        lines.push('', 'Skills', data.skills.join(', '));
    }

    // Experience
    if (Array.isArray(data.experience) && data.experience.length > 0) {
        lines.push('', 'Professional Experience');
        for (const exp of data.experience) {
            lines.push(`${exp.jobTitle || 'Role'} at ${exp.company || 'Company'}`);
            if (exp.startDate || exp.endDate) lines.push(`${exp.startDate || ''} - ${exp.endDate || 'Present'}`);
            if (exp.location) lines.push(exp.location);
            if (Array.isArray(exp.bullets)) {
                for (const b of exp.bullets) {
                    if (b && b.trim()) lines.push(`- ${b.trim()}`);
                }
            }
        }
    }

    // Projects
    if (Array.isArray(data.projects) && data.projects.length > 0) {
        lines.push('', 'Projects');
        for (const proj of data.projects) {
            lines.push(`${proj.name || 'Project'}${proj.techStack ? ' (' + proj.techStack + ')' : ''}`);
            if (proj.description) lines.push(proj.description);
            if (proj.link) lines.push(proj.link);
        }
    }

    // Education
    if (Array.isArray(data.education) && data.education.length > 0) {
        lines.push('', 'Education');
        for (const edu of data.education) {
            lines.push(`${edu.degree || 'Degree'}, ${edu.institution || 'Institution'}, ${edu.year || ''}`);
            if (edu.gpa) lines.push(`GPA: ${edu.gpa}`);
        }
    }

    // Certifications
    if (Array.isArray(data.certifications) && data.certifications.length > 0) {
        lines.push('', 'Certifications', data.certifications.join(', '));
    }

    // Languages
    if (Array.isArray(data.languages) && data.languages.length > 0) {
        lines.push('', 'Languages', data.languages.join(', '));
    }

    // Target role (helps with keyword matching context)
    if (data.targetRole) {
        lines.push('', `Target Role: ${data.targetRole}`);
    }

    return lines.join('\n');
}

// POST: run ATS analysis on a resume + JD, save score
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = (session.user as any).id;

        // Rate limiting: 10 ATS checks per hour per user
        const limiter = await rateLimit(`ats:${userId}`, 10, 3600);
        if (!limiter.success) {
            logger.warn('Rate limit exceeded for ATS analysis', { userId });
            return NextResponse.json({ error: 'Rate limit exceeded. Please try again in an hour.' }, { status: 429 });
        }

        const { resumeId, resumeText, jobDescription } = await req.json();

        if (!jobDescription) {
            return NextResponse.json({ error: 'Job description is required' }, { status: 400 });
        }

        let resumeContent = '';
        let resumeTitle = 'Uploaded Resume';
        let linkedResumeId = resumeId || null;

        if (resumeId) {
            const resume = await prisma.resume.findFirst({
                where: { id: resumeId, userId },
                select: { markdown: true, data: true, title: true },
            });

            if (!resume) {
                return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
            }

            resumeTitle = resume.title;
            if (resume.data && typeof resume.data === 'object' && (resume.data as any).personal) {
                // Convert structured JSON to readable text for accurate ATS analysis
                resumeContent = resumeDataToText(resume.data as any);
            } else if (resume.markdown) {
                resumeContent = resume.markdown;
            } else {
                return NextResponse.json({ error: 'Resume is empty' }, { status: 404 });
            }
        } else if (resumeText && resumeText.trim().length > 20) {
            // Check if uploaded text is actually a JSON string from our parser
            try {
                const parsed = JSON.parse(resumeText);
                if (parsed && typeof parsed === 'object' && (parsed.personal || parsed.fullName)) {
                    resumeContent = resumeDataToText(parsed);
                } else {
                    resumeContent = resumeText;
                }
            } catch {
                resumeContent = resumeText;
            }
            linkedResumeId = null;
        } else {
            return NextResponse.json({ error: 'Please select a resume or upload a document' }, { status: 400 });
        }

        // Pre-check credits
        const creditCheck = await checkCredits(userId, 'ATS_SCORE');
        if (!creditCheck.allowed) {
            return NextResponse.json({ error: `Insufficient credits. Need ${creditCheck.cost}, have ${creditCheck.balance}.` }, { status: 402 });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        // ─── STEP 1: AI Keyword Extraction (Context-Aware) ────
        const kwPrompt = `Extract the most important technical skills, soft skills, tools, and methodologies from this Job Description. 
Return ONLY a JSON array of objects: [{"keyword": "string", "category": "technical" | "soft" | "tool" | "methodology"}].
Limit to 30 most relevant keywords.

Job Description:
${jobDescription.substring(0, 3000)}`;

        let aiKeywords: any[] = [];
        try {
            const kwResult = await callAI({
                messages: [
                    { role: 'system', content: 'You are an expert ATS recruiter. Extract keywords in JSON format.' },
                    { role: 'user', content: kwPrompt }
                ],
                temperature: 0.1,
                max_tokens: 1000,
            });
            let kwContent = kwResult.content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
            aiKeywords = JSON.parse(kwContent);
            if (!Array.isArray(aiKeywords)) aiKeywords = [];
        } catch (err) {
            logger.error('AI keyword extraction failed, falling back to deterministic', err);
        }

        // ─── STEP 2: Run Deterministic ATS Engine ────────────
        const engineResult = runATSAnalysis(resumeContent, jobDescription, aiKeywords.length > 0 ? aiKeywords.map(k => ({ ...k, found: false, frequency: 0 })) : undefined);

        // ─── STEP 2: AI for Qualitative Commentary Only ──────
        const matchedKws = engineResult.keywords.filter(k => k.found).map(k => k.keyword);
        const missingKws = engineResult.keywords.filter(k => !k.found).map(k => k.keyword);
        const sectionsDetected = engineResult.sections.filter(s => s.detected).map(s => s.name);
        const sectionsMissing = engineResult.sections.filter(s => !s.detected).map(s => s.name);

        const prompt = `You are a professional resume reviewer. I have already computed deterministic ATS scores for a resume. Your job is to provide QUALITATIVE commentary ONLY.

DO NOT produce scores — the scores are already computed deterministically. Focus on written feedback.

Here are the computed results:
- Overall ATS Score: ${engineResult.overallScore}%
- Keyword Match: ${engineResult.keywordScore}% (${matchedKws.length} matched, ${missingKws.length} missing)
- Matched: ${matchedKws.join(', ')}
- Missing: ${missingKws.join(', ')}
- Sections Found: ${sectionsDetected.join(', ')}
- Sections Missing: ${sectionsMissing.join(', ')}
- Bullets: ${engineResult.bulletAnalysis.totalBullets} total, ${engineResult.bulletAnalysis.actionVerbBullets} with action verbs, ${engineResult.bulletAnalysis.quantifiedBullets} with metrics
- Word Count: ${engineResult.formatMetrics.wordCount} (~${engineResult.formatMetrics.estimatedPages} page${engineResult.formatMetrics.estimatedPages > 1 ? 's' : ''})

Resume (truncated):
---
${resumeContent.substring(0, 3000)}
---

Job Description (truncated):
---
${jobDescription.substring(0, 2000)}
---`;

        let aiResult;
        try {
            aiResult = await callAI({
                messages: [
                    { role: 'system', content: 'You are an ATS AI Assistant. You MUST return ONLY a valid JSON object matching exactly this schema, with NO markdown formatting:\n{"overallVerdict":"string","suggestions":["string"],"strengthAreas":["string"],"formatIssues":["string"],"sectionFeedback":{"contactInfo":"string","summary":"string","experience":"string","skills":"string","education":"string","projects":"string","formatting":"string"}}' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.2,
                max_tokens: 1200,
            });
        } catch {
            // AI failed — still return algorithmic results
            aiResult = { content: '{}' };
        }

        let aiCommentary: any = {};
        try {
            let content = aiResult.content;
            content = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
            const parsedJson = JSON.parse(content);

            const aiCommentarySchema = z.object({
                overallVerdict: z.string().optional(),
                suggestions: z.array(z.string()).optional(),
                strengthAreas: z.array(z.string()).optional(),
                formatIssues: z.array(z.string()).optional(),
                sectionFeedback: z.record(z.string(), z.string()).optional()
            });

            aiCommentary = aiCommentarySchema.parse(parsedJson);
        } catch (err) {
            logger.error('ATS qualitative parse failed', err, { userId });
            aiCommentary = {};
        }

        // SUCCESS — deduct credits
        await deductCredits(userId, 'ATS_SCORE', `ATS analysis: ${resumeTitle}`);

        // Build the response
        const fullResult = {
            // Deterministic scores from engine
            score: engineResult.overallScore,
            keywordScore: engineResult.keywordScore,
            sectionScore: engineResult.sectionScore,
            bulletScore: engineResult.bulletScore,
            readabilityScore: engineResult.readabilityScore,
            formatScore: engineResult.formatScore,

            // Detailed breakdowns
            matched: matchedKws,
            missing: missingKws,
            keywords: engineResult.keywords,
            sections: engineResult.sections,
            bulletAnalysis: engineResult.bulletAnalysis,
            readabilityMetrics: engineResult.readabilityMetrics,
            formatMetrics: engineResult.formatMetrics,

            // AI qualitative commentary
            overallVerdict: aiCommentary.overallVerdict || '',
            suggestions: aiCommentary.suggestions || [],
            strengthAreas: aiCommentary.strengthAreas || [],
            formatIssues: aiCommentary.formatIssues || [],
            sectionFeedback: aiCommentary.sectionFeedback || {},
        };

        // Save to DB if linked resume
        if (linkedResumeId) {
            const saved = await prisma.atsScore.create({
                data: {
                    resumeId: linkedResumeId,
                    userId,
                    score: engineResult.overallScore,
                    jdSnippet: jobDescription.substring(0, 500),
                    matched: matchedKws,
                    missing: missingKws,
                    suggestions: aiCommentary.suggestions || [],
                    fullResult: fullResult as any,
                },
                include: { resume: { select: { id: true, title: true } } },
            });
            return NextResponse.json({ score: saved, result: fullResult });
        } else {
            return NextResponse.json({
                score: {
                    id: 'upload-' + Date.now(),
                    score: engineResult.overallScore,
                    jdSnippet: jobDescription.substring(0, 500),
                    matched: matchedKws,
                    missing: missingKws,
                    suggestions: aiCommentary.suggestions || [],
                    createdAt: new Date().toISOString(),
                    resume: { id: '', title: resumeTitle },
                },
                result: fullResult
            });
        }
    } catch (err) {
        logger.error('ATS tracker POST error', err);
        return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
    }
}
