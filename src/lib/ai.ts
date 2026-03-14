/**
 * Centralized AI with 5-provider fallback chain.
 * 
 * Priority order:
 *   1. xAI (Grok)     — paid key, most reliable
 *   2. Groq            — 14,400 req/day free, fastest inference
 *   3. Cerebras        — 30 req/min free, very fast
 *   4. Google AI       — Gemini models, 1,500 req/day free
 *   5. OpenRouter      — many free models, 50 req/day per account
 * 
 * Configure keys in .env.local:
 *   XAI_API_KEY, GROQ_API_KEY, CEREBRAS_API_KEY, GOOGLE_AI_KEY, OPENROUTER_API_KEY
 */

import { logger } from './logger';

export const AI_MODEL = process.env.AI_MODEL || 'meta-llama/llama-3.3-70b-instruct:free';

// ─── Provider Configs ────────────────────────────────

interface ProviderConfig {
    name: string;
    url: string;
    keyEnv: string;
    models: string[];
}

const PROVIDERS: ProviderConfig[] = [
    {
        name: 'xAI',
        url: 'https://api.x.ai/v1/chat/completions',
        keyEnv: 'XAI_API_KEY',
        models: ['grok-3-mini-fast', 'grok-3-mini'],
    },
    {
        name: 'Groq',
        url: 'https://api.groq.com/openai/v1/chat/completions',
        keyEnv: 'GROQ_API_KEY',
        models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'gemma2-9b-it', 'mixtral-8x7b-32768'],
    },
    {
        name: 'Cerebras',
        url: 'https://api.cerebras.ai/v1/chat/completions',
        keyEnv: 'CEREBRAS_API_KEY',
        models: ['llama-3.3-70b', 'llama-3.1-8b'],
    },
    {
        name: 'Google',
        url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
        keyEnv: 'GOOGLE_AI_KEY',
        models: ['gemini-2.0-flash', 'gemini-1.5-flash'],
    },
    {
        name: 'OpenRouter',
        url: 'https://openrouter.ai/api/v1/chat/completions',
        keyEnv: 'OPENROUTER_API_KEY',
        models: [
            AI_MODEL,
            'google/gemma-3-27b-it:free',
            'deepseek/deepseek-r1-0528:free',
            'mistralai/mistral-small-3.1-24b-instruct:free',
            'qwen/qwen3-4b:free',
            'google/gemma-3-12b-it:free',
            'microsoft/phi-4-reasoning-plus:free',
            'nousresearch/deephermes-3-llama-3-8b-preview:free',
            'moonshotai/kimi-k2:free',
            'google/gemma-3-4b-it:free',
        ],
    },
];

// ─── Cooldown State ────────────────────────────────
// Track unavailable models to skip them temporarily
const cooldowns = new Map<string, number>();
const COOLDOWN_MS = 60 * 1000; // 1 minute cooldown for rate-limited providers

// ─── Core AI Call ────────────────────────────────────
export async function callAI(options: {
    messages: { role: string; content: string }[];
    temperature?: number;
    max_tokens?: number;
}): Promise<{ content: string; model: string; provider: string }> {

    const errors: string[] = [];

    for (const provider of PROVIDERS) {
        const apiKey = process.env[provider.keyEnv];
        if (!apiKey) continue; // skip unconfigured providers

        // For OpenRouter, support comma-separated keys
        const keys = provider.name === 'OpenRouter'
            ? apiKey.split(',').map(k => k.trim()).filter(Boolean)
            : [apiKey];

        for (const key of keys) {
            for (const model of provider.models) {
                const modelId = `${provider.name}:${model}`;
                if (cooldowns.has(modelId) && cooldowns.get(modelId)! > Date.now()) {
                    continue; // Skip models currently on cooldown
                }

                try {
                    const result = await tryCall({
                        url: provider.url,
                        apiKey: key,
                        model,
                        providerName: provider.name,
                        ...options,
                    });

                    if (result) return { ...result, provider: provider.name };
                    
                    // If result is null, it's a retryable error (like 429 Rate Limit)
                    // Put it on cooldown
                    cooldowns.set(modelId, Date.now() + COOLDOWN_MS);
                } catch (err: unknown) {
                    errors.push(`${provider.name}/${model}: ${(err as Error).message?.substring(0, 60)}`);
                    cooldowns.set(modelId, Date.now() + COOLDOWN_MS);
                }
            }
        }
    }

    logger.error('All AI providers exhausted', { errors });
    throw new Error('All AI models are currently unavailable. Please try again in a few minutes.');
}

// ─── Single Call Attempt ─────────────────────────────
async function tryCall(opts: {
    url: string;
    apiKey: string;
    model: string;
    providerName: string;
    messages: { role: string; content: string }[];
    temperature?: number;
    max_tokens?: number;
}): Promise<{ content: string; model: string } | null> {

    // Google AI uses API key as query param, not Bearer token
    const isGoogle = opts.providerName === 'Google';
    const url = isGoogle ? `${opts.url}?key=${opts.apiKey}` : opts.url;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                ...(isGoogle ? {} : { 'Authorization': `Bearer ${opts.apiKey}` }),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: opts.model,
                temperature: opts.temperature ?? 0.4,
                max_tokens: opts.max_tokens ?? 1500,
                messages: opts.messages,
            }),
            signal: controller.signal,
        });

        // Retryable errors — skip to next
        if ([400, 403, 404, 429, 500, 503].includes(response.status)) {
            logger.warn('AI provider returned retryable status', { provider: opts.providerName, model: opts.model, status: response.status });
            return null;
        }

        if (!response.ok) {
            const errText = await response.text();
            if (errText.includes('rate') || errText.includes('limit') || errText.includes('429') || errText.includes('No endpoints') || errText.includes('Provider returned error')) {
                logger.warn('AI provider error detected in text', { provider: opts.providerName, model: opts.model });
                return null;
            }
            throw new Error(`API error (${response.status})`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content?.trim() || '';

        if (!content) {
            logger.warn('AI provider returned empty content', { provider: opts.providerName, model: opts.model });
            return null;
        }

        logger.info('AI response success', { provider: opts.providerName, model: opts.model });
        return { content, model: opts.model };
    } finally {
        clearTimeout(timeout);
    }
}

// ─── Streamed AI Call ────────────────────────────────
export async function callAIStream(options: {
    messages: { role: string; content: string }[];
    temperature?: number;
    max_tokens?: number;
}): Promise<ReadableStream> {
    const errors: string[] = [];

    for (const provider of PROVIDERS) {
        const apiKey = process.env[provider.keyEnv];
        if (!apiKey) continue;

        const keys = provider.name === 'OpenRouter'
            ? apiKey.split(',').map(k => k.trim()).filter(Boolean)
            : [apiKey];

        for (const key of keys) {
            for (const model of provider.models) {
                const modelId = `${provider.name}:${model}`;
                if (cooldowns.has(modelId) && cooldowns.get(modelId)! > Date.now()) {
                    continue; // Skip models currently on cooldown
                }

                try {
                    const stream = await tryCallStream({
                        url: provider.url,
                        apiKey: key,
                        model,
                        providerName: provider.name,
                        ...options,
                    });

                    if (stream) return stream;
                    
                    // Put on cooldown for retryable errors
                    cooldowns.set(modelId, Date.now() + COOLDOWN_MS);
                } catch (err: unknown) {
                    errors.push(`${provider.name}/${model}: ${(err as Error).message?.substring(0, 60)}`);
                    cooldowns.set(modelId, Date.now() + COOLDOWN_MS);
                }
            }
        }
    }

    logger.error('All AI providers exhausted for streaming', { errors });
    throw new Error('All AI models are currently unavailable for streaming. Please try again.');
}

async function tryCallStream(opts: {
    url: string;
    apiKey: string;
    model: string;
    providerName: string;
    messages: { role: string; content: string }[];
    temperature?: number;
    max_tokens?: number;
}): Promise<ReadableStream | null> {
    const isGoogle = opts.providerName === 'Google';
    const url = isGoogle ? `${opts.url}?key=${opts.apiKey}` : opts.url;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000); // slightly longer for stream start

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                ...(isGoogle ? {} : { 'Authorization': `Bearer ${opts.apiKey}` }),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: opts.model,
                temperature: opts.temperature ?? 0.4,
                max_tokens: opts.max_tokens ?? 1500,
                messages: opts.messages,
                stream: true,
            }),
            signal: controller.signal,
        });

        if ([400, 403, 404, 429, 500, 503].includes(response.status)) {
            return null; // Skip to next
        }

        if (!response.ok || !response.body) {
            return null;
        }

        logger.info('AI Streaming started', { provider: opts.providerName, model: opts.model });
        return parseOpenAIStream(response.body);
    } finally {
        clearTimeout(timeout);
    }
}

function parseOpenAIStream(body: ReadableStream<Uint8Array>): ReadableStream {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    return new ReadableStream({
        async start(controller) {
            const reader = body.getReader();
            let processBuffer = '';

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    processBuffer += decoder.decode(value, { stream: true });
                    const lines = processBuffer.split('\n');
                    processBuffer = lines.pop() || '';

                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed.startsWith('data: ')) continue;
                        if (trimmed === 'data: [DONE]') continue;

                        try {
                            const data = JSON.parse(trimmed.slice(6));
                            const text = data.choices?.[0]?.delta?.content;
                            if (text) {
                                controller.enqueue(encoder.encode(text));
                            }
                        } catch {
                            // ignore parse errors
                        }
                    }
                }
            } catch (e) {
                controller.error(e);
            } finally {
                controller.close();
            }
        }
    });
}

// ─── Embedding Call ─────────────────────────────────
export async function generateEmbedding(text: string): Promise<number[]> {
    const apiKey = process.env.JINA_API;
    if (!apiKey) {
        throw new Error('JINA_API is required for free embeddings');
    }

    try {
        const response = await fetch('https://api.jina.ai/v1/embeddings', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'jina-embeddings-v2-base-en',
                input: [text.substring(0, 8000)], // Jina v2-base has 8192 token window
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Jina Embedding Error: ${err}`);
        }

        const data = await response.json();
        return data.data[0].embedding; // 768 dimensions
    } catch (err) {
        logger.error('Failed to generate Jina embedding', err);
        throw err;
    }
}
