import prisma from '@/lib/prisma';
import { parseJobDescription } from './parser';
import { logger } from '@/lib/logger';

const JINA_API_KEY = process.env.JINA_API;
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API;

// ─── Query Rotation Config ───────────────────────────
const TARGET_RESOURCES = [
    { site: 'linkedin.com/jobs', label: 'LinkedIn' },
    { site: 'indeed.com', label: 'Indeed' },
    { site: 'foundit.in', label: 'Foundit' },
    { site: 'wellfound.com', label: 'Wellfound' },
    { site: 'glassdoor.com/Job', label: 'Glassdoor' },
    { site: 'naukri.com', label: 'Naukri' },
];

const JOB_ROLES = [
    'Software Engineer', 'Frontend Developer', 'Backend Developer', 
    'Fullstack Developer', 'DevOps Engineer', 'AI Engineer', 
    'Data Scientist', 'Product Manager'
];
// ─────────────────────────────────────────────────────


async function fetchRemotiveJobs() {
    try {
        const res = await fetch('https://remotive.com/api/remote-jobs?limit=10');
        const data = await res.json();
        return (data.jobs || []).slice(0, 5); // Limit for testing/stability
    } catch (err) {
        logger.error('Remotive fetch failed', err);
        return [];
    }
}

async function fetchArbeitnowJobs() {
    try {
        const res = await fetch('https://www.arbeitnow.com/api/job-board-api');
        const data = await res.json();
        return (data.data || []).slice(0, 5); // Limit for testing/stability
    } catch (err) {
        logger.error('Arbeitnow fetch failed', err);
        return [];
    }
}

async function scrapeWithFirecrawl(query: string, limit = 15) {
    if (!FIRECRAWL_API_KEY) return [];
    try {
        const res = await fetch('https://api.firecrawl.dev/v1/search', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query,
                limit
            })
        });
        const data = await res.json();
        return (data.data || data.results || []).slice(0, limit);
    } catch (err) {
        logger.error('Firecrawl scraping failed', err);
        return [];
    }
}

async function getMarkdownWithJina(url: string) {
    if (!JINA_API_KEY) return '';
    try {
        const res = await fetch(`https://r.jina.ai/${url}`, {
            headers: {
                'Authorization': `Bearer ${JINA_API_KEY}`,
                'X-Return-Format': 'markdown'
            }
        });
        return await res.text();
    } catch (err) {
        logger.error('Jina Reader failed', err);
        return '';
    }
}

// Helper to run tasks with concurrency limit
async function runWithConcurrencyLimit(tasks: (() => Promise<any>)[], limit: number) {
    const results: any[] = [];
    const executing: Promise<any>[] = [];
    for (const task of tasks) {
        const p = task();
        results.push(p);
        if (limit <= tasks.length) {
            const e: Promise<any> = p.then(() => executing.splice(executing.indexOf(e), 1));
            executing.push(e);
            if (executing.length >= limit) {
                await Promise.race(executing);
            }
        }
    }
    return Promise.all(results);
}

export async function crawlJobs() {
    logger.info('Starting multi-source job crawl...');
    let totalIngested = 0;

    // 1. Fetch from Direct APIs
    const [remotiveJobs, arbeitJobs] = await Promise.all([
        fetchRemotiveJobs(),
        fetchArbeitnowJobs()
    ]);

    const ingestTasks: (() => Promise<void>)[] = [];

    // Remotive Tasks
    remotiveJobs.forEach((job: any) => {
        ingestTasks.push(async () => {
            try {
                const parsed = await parseJobDescription(job.description || '');
                await (prisma as any).jobPosting.upsert({
                    where: { externalId: job.id.toString() },
                    update: {
                        title: job.title,
                        company: job.company_name,
                        location: 'Remote',
                        salary: job.salary || parsed.salary,
                        salaryMin: parsed.salaryMin,
                        salaryMax: parsed.salaryMax,
                        skills: parsed.skills,
                        experienceLevel: parsed.experienceLevel,
                        employmentType: job.job_type || parsed.employmentType,
                        isActive: true,
                        updatedAt: new Date(),
                    },
                    create: {
                        externalId: job.id.toString(),
                        title: job.title,
                        company: job.company_name,
                        location: 'Remote',
                        description: job.description,
                        salary: job.salary || parsed.salary,
                        salaryMin: parsed.salaryMin,
                        salaryMax: parsed.salaryMax,
                        skills: parsed.skills,
                        experienceLevel: parsed.experienceLevel,
                        employmentType: job.job_type || parsed.employmentType,
                        source: 'remotive',
                        sourceUrl: job.url,
                        isActive: true,
                    },
                });
                totalIngested++;
            } catch (e: any) {
                logger.warn(`Failed to ingest Remotive job ${job.id}`, e);
            }
        });
    });

    // Arbeitnow Tasks
    arbeitJobs.forEach((job: any) => {
        ingestTasks.push(async () => {
            try {
                const parsed = await parseJobDescription(job.description || '');
                await (prisma as any).jobPosting.upsert({
                    where: { externalId: job.slug },
                    update: {
                        title: job.title,
                        company: job.company_name,
                        location: job.location,
                        salary: parsed.salary,
                        salaryMin: parsed.salaryMin,
                        salaryMax: parsed.salaryMax,
                        skills: parsed.skills,
                        experienceLevel: parsed.experienceLevel,
                        employmentType: parsed.employmentType,
                        isActive: true,
                        updatedAt: new Date(),
                    },
                    create: {
                        externalId: job.slug,
                        title: job.title,
                        company: job.company_name,
                        location: job.location,
                        description: job.description,
                        salary: parsed.salary,
                        salaryMin: parsed.salaryMin,
                        salaryMax: parsed.salaryMax,
                        skills: parsed.skills,
                        experienceLevel: parsed.experienceLevel,
                        employmentType: parsed.employmentType,
                        source: 'arbeitnow',
                        sourceUrl: job.url,
                        isActive: true,
                    },
                });
                totalIngested++;
            } catch (e: any) {
                logger.warn(`Failed to ingest Arbeitnow job ${job.slug}`, e);
            }
        });
    });

    // Execute API tasks with limit
    await runWithConcurrencyLimit(ingestTasks, 5);

    // 2. Scrape Job Portals via Firecrawl with site-specific rotation
    logger.info('Searching portals via Firecrawl with platform rotation...');
    
    // Pick random combinations
    const selectedRoles = [...JOB_ROLES].sort(() => 0.5 - Math.random()).slice(0, 2);
    const selectedSites = [...TARGET_RESOURCES].sort(() => 0.5 - Math.random()).slice(0, 3);

    const portalTasks: (() => Promise<void>)[] = [];

    for (const role of selectedRoles) {
        for (const target of selectedSites) {
            const query = `site:${target.site} "${role}" remote jobs`;
            logger.info(`Executing specialized search: ${query}`);
            
            const portalResults = await scrapeWithFirecrawl(query, 10);
            for (const res of portalResults) {
                portalTasks.push(async () => {
                    try {
                        const targetUrl = res.url || res.link;
                        if (!targetUrl) return;

                        const markdown = await getMarkdownWithJina(targetUrl);
                        if (!markdown) return;

                        const parsed = await parseJobDescription(markdown);
                        await (prisma as any).jobPosting.upsert({
                            where: { externalId: targetUrl },
                            update: {
                                title: parsed.title,
                                company: parsed.company,
                                salary: parsed.salary,
                                salaryMin: parsed.salaryMin,
                                salaryMax: parsed.salaryMax,
                                skills: parsed.skills,
                                experienceLevel: parsed.experienceLevel,
                                employmentType: parsed.employmentType,
                                isActive: true,
                                updatedAt: new Date(),
                            },
                            create: {
                                externalId: targetUrl,
                                title: parsed.title,
                                company: parsed.company,
                                location: 'Check Link',
                                description: markdown.substring(0, 5000),
                                salary: parsed.salary,
                                salaryMin: parsed.salaryMin,
                                salaryMax: parsed.salaryMax,
                                skills: parsed.skills,
                                experienceLevel: parsed.experienceLevel,
                                employmentType: parsed.employmentType,
                                source: 'firecrawl',
                                sourceUrl: targetUrl,
                                isActive: true,
                            },
                        });
                        totalIngested++;
                    } catch (e: any) {
                        logger.warn(`Failed to ingest Firecrawl job from ${res.url}`, e);
                    }
                });
            }
        }
    }

    await runWithConcurrencyLimit(portalTasks, 3);

    logger.info(`Crawl complete. Ingested ${totalIngested} jobs.`);
    return totalIngested;
}
