import { callAI } from '../ai';
import prisma from '../prisma';
import { logger } from '../logger';

export interface SearchStrategy {
    queries: string[];
    priorityRoles: string[];
    targetPlatforms: string[];
}

export interface DiscoveryResult {
    domain: string;
    url: string;
    label: string;
    reasoning: string;
}

export interface UrlEvaluation {
    url: string;
    category: 'job_desc' | 'hub' | 'article' | 'other';
    confidence: number;
}

/**
 * AI Orchestrator for Job Ingestion
 * 
 * Uses LLM to strategically plan searches, discover new career sites, 
 * and filter results to maximize quality and efficiency.
 */
export class AIOrchestrator {

    /**
     * Strategist: Analyzes database coverage and generates a high-yield search plan.
     */
    static async planSearchStrategy(): Promise<SearchStrategy> {
        try {
            // Get some context from the DB to inform the AI
            const stats = await prisma.$queryRaw`
                SELECT location, count(*) as count 
                FROM "JobPosting" 
                WHERE "isActive" = true 
                GROUP BY location 
                ORDER BY count DESC 
                LIMIT 5
            ` as { location: string, count: number }[];

                const statsString = JSON.stringify(stats, (key, value) =>
                    typeof value === 'bigint' ? value.toString() : value
                );
                
                const prompt = `
                You are a senior recruitment strategist. Your goal is to maximize the diversity and volume of fresh job listings in our portal.
                
                Current Top Locations in DB: ${statsString}
                
                Generate 15 high-priority search queries for Firecrawl.
                
                CRITICAL REQUIREMENT: At least 70% of these queries MUST target:
                - "Summer Internship 2026" & "Winter Internship 2025"
                - "Software Engineering Intern" & "Product Management Intern"
                - "Graduate Engineering Trainee" & "Management Trainee"
                - "New Grad 2026" & "Batch of 2026 Hiring"
                - "Rotational Programs" & "Leadership Development Programs (LDP)"
                - "Entry Level" positions for freshers in Finance, Operations, and HR
                - "Diversity Hiring" & "Off-campus Drive 2026"

                Focus on:
                1. Tier-1 and Tier-2 companies known for structured internship programs.
                2. Gaps in current coverage (Locations: ${statsString}).
                3. Specialized sectors: High-frequency trading, Space-tech, Climate-tech, and Biotech.
                4. Professional domains: Support, Sales, Marketing, and Legal (beyond just Dev).
                5. Platforms like "Unstop", "Naukri Campus", "Indeed Internships", and company-specific "University Relations" pages.

                Return ONLY a JSON object with this structure:
                {
                    "queries": ["query 1", "query 2", ...],
                    "priorityRoles": ["role 1", ...],
                    "targetPlatforms": ["linkedin.com/jobs", "internshala.com", "lever.co", "greenhouse.io", "workable.com", "jobs.google.com", "amazon.jobs"]
                }
            `;

            const { content } = await callAI({
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7
            });

            const result = JSON.parse(this.extractJson(content));
            return {
                queries: result.queries || [],
                priorityRoles: result.priorityRoles || [],
                targetPlatforms: result.targetPlatforms || []
            };
        } catch (err) {
            logger.error('Orchestrator: Strategy planning failed', err);
            return { queries: [], priorityRoles: [], targetPlatforms: [] };
        }
    }

    /**
     * Discovery: Identifies new high-quality career portals from search results.
     */
    static async discoverCareerHubs(searchResults: any[]): Promise<DiscoveryResult[]> {
        if (!searchResults.length) return [];

        try {
            const dataToAnalyze = searchResults.map(r => ({
                title: r.title,
                url: r.url || r.link,
                snippet: r.snippet || r.content?.substring(0, 200)
            }));

            const prompt = `
                Analyze these search results and identify new, high-quality "Career Portals" or "ATS Hubs" (like Lever, Greenhouse, or specific company career pages).
                
                Exclude: General search engines, generic news sites, or already well-known platforms like LinkedIn/Indeed.
                
                Results: ${JSON.stringify(dataToAnalyze)}

                Return ONLY a JSON array of objects:
                [{
                    "domain": "company.lever.co",
                    "url": "https://company.lever.co",
                    "label": "Company Name",
                    "reasoning": "Briefly why this is a good source"
                }]
            `;

            const { content } = await callAI({
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3
            });

            const results = JSON.parse(this.extractJson(content));
            return (Array.isArray(results) ? results : []).map(r => ({
                domain: r.domain,
                url: r.url,
                label: r.label,
                reasoning: r.reasoning
            }));
        } catch (err) {
            logger.error('Orchestrator: Hub discovery failed', err);
            return [];
        }
    }

    /**
     * Filter: Categorizes URLs before they are deep-scraped by Jina.
     */
    static async evaluateUrls(urls: { url: string, title?: string }[]): Promise<UrlEvaluation[]> {
        if (!urls.length) return [];

        try {
            const prompt = `
                Given these URLs and titles, categorize them into:
                - job_desc: Direct individual job description page.
                - hub: A list of many jobs (search results, career portal home).
                - article: News, blog post, or "Top 10 jobs" list (NOT a direct hiring page).
                - other: Irrelevant pages.

                URLs: ${JSON.stringify(urls)}

                Return ONLY a JSON array:
                [{"url": "...", "category": "job_desc", "confidence": 0.9}]
            `;

            const { content } = await callAI({
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.1
            });

            const results = JSON.parse(this.extractJson(content));
            return Array.isArray(results) ? results : [];
        } catch (err) {
            logger.error('Orchestrator: URL evaluation failed', err);
            return urls.map(u => ({ url: u.url, category: 'other', confidence: 0 }));
        }
    }

    private static extractJson(text: string): string {
        try {
            // First try to find the outermost { or [
            const startBrace = text.indexOf('{');
            const startBracket = text.indexOf('[');
            
            let start = -1;
            let end = -1;
            let type: 'object' | 'array' | null = null;

            if (startBrace !== -1 && (startBracket === -1 || startBrace < startBracket)) {
                start = startBrace;
                type = 'object';
            } else if (startBracket !== -1) {
                start = startBracket;
                type = 'array';
            }

            if (start === -1) return text;

            // Find matching closing character
            const openChar = type === 'object' ? '{' : '[';
            const closeChar = type === 'object' ? '}' : ']';
            
            let count = 0;
            for (let i = start; i < text.length; i++) {
                if (text[i] === openChar) count++;
                else if (text[i] === closeChar) count--;
                
                if (count === 0) {
                    end = i;
                    break;
                }
            }

            if (end !== -1) {
                return text.substring(start, end + 1);
            }
        } catch (e: any) {
            logger.warn('JSON extraction helper failed', { error: e.message || e });
        }

        // Fallback to original regex
        const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        return match ? match[0] : text;
    }
}
