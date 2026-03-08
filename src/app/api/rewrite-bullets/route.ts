import { callAI } from '@/lib/ai';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { deductCredits, checkCredits } from '@/lib/credits';
import { z } from 'zod';
import { redis } from '@/lib/redis';
import crypto from 'crypto';

const bulletSchema = z.array(z.string());

export async function POST(req: Request) {
    try {
        const { entry, targetRole, jobDescription } = await req.json();

        if (!entry || !entry.bullets || entry.bullets.length === 0) {
            return NextResponse.json({ error: 'Experience entry with bullets is required' }, { status: 400 });
        }

        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
        }

        const userId = (session.user as any).id;

        // Pre-check credits (don't deduct yet)
        const creditCheck = await checkCredits(userId, 'REWRITE_BULLETS');
        if (!creditCheck.allowed) {
            return NextResponse.json({ error: `Insufficient credits. Need ${creditCheck.cost}, have ${creditCheck.balance}.` }, { status: 403 });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) return NextResponse.json({ error: 'Config error' }, { status: 500 });

        const jdContext = jobDescription
            ? `\nCRITICAL CONTEXT: The user is applying for a job with this description:\n"${jobDescription}"\n\nYou MUST seamlessly integrate prevalent keywords and phrases from this Job Description into the rewritten bullets where logically possible.`
            : '';

        const prompt = `You are an expert career advisor and resume writer for ALL industries. Rewrite the following achievement bullets for a ${entry.jobTitle || 'professional'} at ${entry.company || 'a company'}, targeting a ${targetRole || 'new'} role.
${jdContext}

Follow the Google XYZ formula: "Accomplished [X], as measured by [Y], by doing [Z]".
Make them highly impactful, active, and results-oriented. Adapt your vocabulary perfectly to the user's specific industry (e.g., healthcare, retail, finance, trades, tech).

Original Bullets:
${entry.bullets.join('\n')}
`;

        const promptHash = crypto.createHash('md5').update(prompt).digest('hex');
        const cacheKey = `ai:rewrite:${promptHash}`;

        // LAYER 3 CACHE: Check Redis API cache for semantic hit
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
            console.log(`[CACHE HIT] Redis intercepted rewrite-bullets request: ${cacheKey}`);
            // We still deduct credits for the feature usage, but we save on OpenAI bounds.
            await deductCredits(userId, 'REWRITE_BULLETS', 'AI Bullet Rewriting (Cached Edge)');
            return NextResponse.json({ bullets: typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData });
        }

        const aiResult = await callAI({
            messages: [
                { role: 'system', content: 'You are a concise AI assistant. You MUST respond with a valid JSON array of strings containing the rewritten bullets. Example: ["bullet 1...", "bullet 2..."]. Do not wrap the JSON in markdown blocks or include any other text.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.4,
            max_tokens: 500,
        });

        try {
            const parsedArray = bulletSchema.parse(JSON.parse(aiResult.content.trim()));

            // Cache the successful OpenAI result in Redis for 7 days
            await redis.set(cacheKey, JSON.stringify(parsedArray), { ex: 604800 });

            // SUCCESS — now deduct credits
            await deductCredits(userId, 'REWRITE_BULLETS', 'AI Bullet Rewriting');
            return NextResponse.json({ bullets: parsedArray });
        } catch (parseError) {
            console.error("AI Bullet Parse Error:", parseError, aiResult.content);
            return NextResponse.json({ error: 'Invalid response format from AI' }, { status: 500 });
        }
    } catch (err) {
        console.error('Bullet rewrite error:', err);
        return NextResponse.json({ error: 'Unexpected error rewriting bullets.' }, { status: 500 });
    }
}
