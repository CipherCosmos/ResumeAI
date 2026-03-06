import { callAI } from '@/lib/ai';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const suggestionSchema = z.object({
    suggestion: z.string()
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { field, value, target_role, job_description, skills } = body;

        if (!field || !value) {
            return NextResponse.json({ suggestion: '' });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Server config error' }, { status: 500 });
        }

        const contextBlock = `
        ${job_description ? `Target Job Description:\n${job_description}\n` : ''}
        ${skills && skills.length > 0 ? `Candidate's Core Skills:\n${skills}\n` : ''}
        `;

        const fieldPrompts: Record<string, string> = {
            skills: `The candidate is targeting "${target_role || 'a professional role'}". ${contextBlock} They have listed these skills: "${value}". Suggest 5-8 additional highly relevant skills they should add, formatted as a comma-separated list. Include both technical and soft skills. Output ONLY the suggested skills.`,

            experience: `The candidate is targeting "${target_role || 'a professional role'}". ${contextBlock} They wrote this experience: "${value}". Rewrite into 3-4 powerful achievement-driven bullet points using the Google XYZ formula (Accomplished [X] measured by [Y] by doing [Z]). Use strong ATS keywords extracted from the Job Description context if provided. Output ONLY the improved bullet points.`,

            education: `The candidate wrote this education: "${value}". They target "${target_role || 'a professional role'}". ${contextBlock} Suggest relevant certifications, courses, or skills they should add. Be concise. Output ONLY suggestions.`,

            summary: `Based on this candidate profile:\n${value}\n\n${contextBlock}Write a compelling 2-3 sentence professional summary for a "${target_role || 'professional'}" role. It should be achievement-focused, highlight key strengths intersecting with the Job Description, and include ATS keywords. Output ONLY the summary paragraph, no quotes or labels.`,

            bullets: `Rewrite this work experience bullet point to be more impactful using the Google XYZ formula (Accomplished [X] measured by [Y] by doing [Z]): "${value}". The target role is "${target_role || 'a professional role'}". ${contextBlock} Use strong action verbs and ATS keywords aligning with the Job Description. Output ONLY the improved bullet point.`,

            projectDesc: `Rewrite this project description to be more impactful: "${value}". The target role is "${target_role || 'a professional role'}". ${contextBlock} Focus on the technical stack used, the problem solved, and the measurable outcome. Output ONLY the improved 2-3 sentence description.`,

            roleBullets: `The user wants to add achievements for the job title: "${value}". The target role they are applying for is "${target_role || 'a professional role'}". ${contextBlock} Generate 3 highly impressive, realistic bullet points using the Google XYZ formula (Accomplished [X] measured by [Y] by doing [Z]) that perfectly align with the Target Job Description. Output ONLY the bullet points, no introductory text.`,

            targetRoleIdeation: `The candidate has the following experience/skills: "${value}". ${contextBlock} Suggest 3 highly relevant target job titles they should apply for. Format as a comma-separated list. Output ONLY the suggested titles.`,

            techStackFromDesc: `Read the following project description: "${value}". Extract all underlying programming languages, frameworks, libraries, and technical tools explicitly mentioned or strongly implied. Output ONLY a comma-separated list of the technologies (e.g., React, Node.js, PostgreSQL). Do not include soft skills or non-technical nouns.`
        };

        const prompt = fieldPrompts[field];
        if (!prompt) return NextResponse.json({ suggestion: '' });

        const aiResult = await callAI({
            messages: [
                { role: 'system', content: 'You are a concise AI assistant. You MUST respond with a valid JSON object matching this schema: { "suggestion": "your output here" }. Do not wrap the JSON in markdown blocks.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.5,
            max_tokens: 400,
        });

        try {
            const parsed = suggestionSchema.parse(JSON.parse(aiResult.content.trim()));
            return NextResponse.json({ suggestion: parsed.suggestion });
        } catch (parseError) {
            console.error("AI Output Parse Error:", parseError, aiResult.content);
            // Fallback if the AI just returns text anyway
            return NextResponse.json({ suggestion: aiResult.content.replace(/^```json\n|\n```$/g, '') });
        }
    } catch {
        return NextResponse.json({ suggestion: '' });
    }
}
