import './init-env'; // load .env variables FIRST
import prisma from '../lib/prisma';
import { updateMarketDemandStats } from '../lib/jobs/skill-gap';
import { logger } from '../lib/logger';
import { generateJobFingerprint } from '../lib/jobs/dedup';
import { parserQueue } from '../lib/queue';

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
    { site: 'jobs.lever.co', label: 'Lever ATS' },
    { site: 'boards.greenhouse.io', label: 'Greenhouse ATS' },
    { site: 'workable.com', label: 'Workable ATS' },
    { site: 'otta.com', label: 'Otta' },
    { site: 'smartrecruiters.com', label: 'SmartRecruiters' },
    { site: 'myworkdayjobs.com', label: 'Workday' },
    { site: 'simplyhired.com', label: 'SimplyHired' },
    { site: 'careerbuilder.com', label: 'CareerBuilder' },
    { site: 'flexjobs.com', label: 'FlexJobs' },
    { site: 'monster.com', label: 'Monster' },
    { site: 'ziprecruiter.com', label: 'ZipRecruiter' },
    { site: 'remotive.com', label: 'Remotive Hub' },
    { site: 'arbeitnow.com', label: 'Arbeitnow Hub' }
];

const JOB_ROLES = [
    'Software Engineer', 'Frontend Developer', 'Backend Developer', 
    'Fullstack Developer', 'DevOps Engineer', 'AI Engineer', 
    'Data Scientist', 'Product Manager', 'Machine Learning Engineer',
    'Mobile Developer', 'iOS Developer', 'Android Developer',
    'SRE', 'Cloud Architect', 'Security Engineer', 'Data Engineer',
    'Product Designer', 'UI/UX Designer', 'Growth Lead',
    'Engineering Manager', 'Solutions Architect', 'QA Engineer',
    'Systems Programmer', 'Embedded Engineer', 'Blockchain Developer',
    'Database Administrator', 'Technical Writer', 'Scrum Master',
    'Sales Engineer', 'Account Executive', 'Customer Success Manager',
    'Social Media Manager', 'Content Strategist', 'SEO Specialist',
    'Legal Counsel', 'HR Manager', 'Financial Analyst', 'Marketing Director',
    'Internship', 'Graduate Engineer', 'Research Intern', 'Product Management Intern'
];

const SENIORITIES = [
    'Junior', 'Entry Level', 'Mid-Level', 'Senior', 'Staff', 'Principal', 'Lead', 'Executive', 'Intern', 'Student'
];

const EMPLOYMENT_TYPES = [
    'Full-time', 'Contract', 'Internship', 'Freelance', 'Part-time'
];

let rotationIndex = 0;
let levelIndex = 0;
let typeIndex = 0;
let roleIndex = 0;

// To prevent infinite recursion during hub expansion
const visitedUrls = new Set<string>();


async function fetchRemotiveJobs(limit = 20) {
    try {
        const res = await fetch(`https://remotive.com/api/remote-jobs?limit=${limit}`);
        const data = await res.json();
        return (data.jobs || []).slice(0, limit);
    } catch (err) {
        logger.error('Worker: Remotive fetch failed', err);
        return [];
    }
}

async function fetchArbeitnowJobs() {
    try {
        const res = await fetch('https://www.arbeitnow.com/api/job-board-api');
        const data = await res.json();
        return (data.data || []).slice(0, 20);
    } catch (err) {
        logger.error('Worker: Arbeitnow fetch failed', err);
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
        logger.error('Worker: Firecrawl scraping failed', err);
        return [];
    }
}

async function expandHubJobs(url: string): Promise<string[]> {
    if (!FIRECRAWL_API_KEY || visitedUrls.has(url)) return [];
    visitedUrls.add(url);
    
    try {
        const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url,
                formats: ["json"],
                jsonOptions: {
                    schema: {
                        type: "object",
                        properties: {
                            job_urls: {
                                type: "array",
                                items: { type: "string" },
                                description: "URLs of individual job detail pages"
                            }
                        },
                        required: ["job_urls"]
                    }
                }
            })
        });
        const data = await res.json();
        const extracted = data.data?.json?.job_urls || [];
        logger.info(`Worker: Hub expansion found ${extracted.length} links for ${url}`);
        return extracted;
    } catch (err) {
        logger.error(`Worker: Hub expansion failed for ${url}`, err);
        return [];
    }
}

async function processJobUrl(targetUrl: string, sourceTitle: string, sourceCompany?: string): Promise<boolean> {
    try {
        const markdown = await getMarkdownWithJina(targetUrl);
        if (!markdown || markdown.length < 1000) return false;

        const lowerMarkdown = markdown.toLowerCase();
        const jobMarkers = ['requirement', 'responsibility', 'qualification', 'benefit', 'about the role', 'apply now', 'submit application', 'compensation', 'salary range'];
        const markerCount = jobMarkers.filter(m => lowerMarkdown.includes(m)).length;
        
        if (markerCount < 3) {
            logger.info(`Worker: Skipping page with low job-marker density (${markerCount}): ${targetUrl}`);
            return false;
        }

        const applyLinkCount = (markdown.match(/apply/gi) || []).length;
        if (applyLinkCount > 8 && markdown.length < 4000) {
            logger.info(`Worker: Skipping probable multi-job list: ${targetUrl}`);
            return false;
        }

        const contentHash = generateJobFingerprint({
            title: sourceTitle,
            company: sourceCompany || 'Scraped Company',
            location: 'Remote',
            description: markdown
        });

        const existingJob = await (prisma as any).jobPosting.findUnique({
            where: { sourceUrl: targetUrl }
        });

        if (existingJob && existingJob.contentHash === contentHash) {
            await (prisma as any).jobPosting.update({
                where: { id: existingJob.id },
                data: { lastSeen: new Date(), isActive: true }
            });
            return true;
        }

        const resResult = await (prisma as any).jobPosting.upsert({
            where: { sourceUrl: targetUrl },
            update: {
                title: sourceTitle,
                company: sourceCompany || 'Scraped Company',
                description: markdown,
                contentHash,
                lastSeen: new Date(),
                isActive: true,
                updatedAt: new Date()
            },
            create: {
                externalId: targetUrl,
                title: sourceTitle,
                company: sourceCompany || 'Scraped Company',
                description: markdown,
                source: 'firecrawl',
                sourceUrl: targetUrl,
                location: 'Remote',
                isActive: true,
                contentHash,
                firstSeen: new Date(),
                lastSeen: new Date()
            }
        });

        await parserQueue.add('parse-job', { jobId: resResult.id });
        logger.info(`Worker: Ingested detailed job: ${sourceTitle} at ${sourceCompany || 'Scraped Company'}`);
        return true;
    } catch (err) {
        logger.error(`Worker: Failed to process job URL ${targetUrl}`, err);
        return false;
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
        logger.error('Worker: Jina Reader failed', err);
        return '';
    }
}

// Helper to run tasks concurrently but with a strict pool limit
async function runWithConcurrencyLimit(tasks: (() => Promise<void>)[], limit: number) {
    const results: Promise<void>[] = [];
    const executing: Promise<void>[] = [];
    for (const task of tasks) {
        const p = task();
        results.push(p);
        if (limit <= tasks.length) {
            const e: Promise<void> = p.then(() => { executing.splice(executing.indexOf(e), 1); });
            executing.push(e);
            if (executing.length >= limit) {
                await Promise.race(executing);
            }
        }
    }
    return Promise.allSettled(results);
}

import { checkJobFreshness } from '../workers/freshness/index';

async function runCrawlCycle() {
    logger.info('--- Worker: Starting new job crawl cycle ---');
    
    // 0. Check Freshness of existing jobs
    await checkJobFreshness();

    let totalIngested = 0;

    // 1. Fetch from Direct APIs
    logger.info('Worker: Fetching from Remotive & Arbeitnow APIs...');
    const [remotiveJobs, arbeitJobs] = await Promise.all([
        fetchRemotiveJobs(20),
        fetchArbeitnowJobs()
    ]);

    const ingestTasks: (() => Promise<void>)[] = [];

    // Remotive Tasks
    remotiveJobs.forEach((job: any) => {
        ingestTasks.push(async () => {
            try {
                const contentHash = generateJobFingerprint({
                    title: job.title,
                    company: job.company_name,
                    location: 'Remote',
                    description: job.description || ''
                });

                const existingCanonical = await (prisma as any).jobPosting.findFirst({
                    where: { contentHash, canonicalJobId: null }
                });

                const existingJob = await (prisma as any).jobPosting.findUnique({
                    where: { externalId: job.id.toString() }
                });

                if (existingJob && existingJob.contentHash !== contentHash) {
                    await (prisma as any).jobVersion.create({
                        data: {
                            jobId: existingJob.id,
                            contentHash: existingJob.contentHash || '',
                        }
                    });
                }

                const result: any = await (prisma as any).jobPosting.upsert({
                    where: { externalId: job.id.toString() },
                    update: {
                        title: job.title,
                        company: job.company_name,
                        location: 'Remote',
                        postedAt: job.publication_date ? new Date(job.publication_date) : undefined,
                        isActive: true,
                        lastSeen: new Date(),
                        contentHash,
                        canonicalJobId: existingCanonical ? existingCanonical.id : null,
                        updatedAt: new Date(),
                    },
                    create: {
                        externalId: job.id.toString(),
                        title: job.title,
                        company: job.company_name,
                        location: 'Remote',
                        postedAt: job.publication_date ? new Date(job.publication_date) : undefined,
                        description: job.description || '',
                        source: 'remotive',
                        sourceUrl: job.url,
                        isActive: true,
                        firstSeen: new Date(),
                        lastSeen: new Date(),
                        contentHash,
                        canonicalJobId: existingCanonical ? existingCanonical.id : null,
                    },
                });

                await parserQueue.add('parse-job', { jobId: result.id });
                totalIngested++;
            } catch (e: any) {
                logger.warn(`Worker: Failed to ingest Remotive job ${job.id}`, e);
            }
        });
    });

    // Arbeitnow Tasks
    arbeitJobs.forEach((job: any) => {
        ingestTasks.push(async () => {
            try {
                const contentHash = generateJobFingerprint({
                    title: job.title,
                    company: job.company_name,
                    location: job.location,
                    description: job.description || ''
                });

                const existingCanonical = await (prisma as any).jobPosting.findFirst({
                    where: { contentHash, canonicalJobId: null }
                });

                const existingJob = await (prisma as any).jobPosting.findUnique({
                    where: { externalId: job.slug }
                });

                if (existingJob && existingJob.contentHash !== contentHash) {
                    await (prisma as any).jobVersion.create({
                        data: {
                            jobId: existingJob.id,
                            contentHash: existingJob.contentHash || '',
                        }
                    });
                }

                const result: any = await (prisma as any).jobPosting.upsert({
                    where: { externalId: job.slug },
                    update: {
                        title: job.title,
                        company: job.company_name,
                        location: job.location,
                        postedAt: job.created_at ? new Date(job.created_at * 1000) : undefined, // Arbeitnow often uses unix timestamp
                        isActive: true,
                        lastSeen: new Date(),
                        contentHash,
                        canonicalJobId: existingCanonical ? existingCanonical.id : null,
                        updatedAt: new Date(),
                    },
                    create: {
                        externalId: job.slug,
                        title: job.title,
                        company: job.company_name,
                        location: job.location,
                        postedAt: job.created_at ? new Date(job.created_at * 1000) : undefined,
                        description: job.description || '',
                        source: 'arbeitnow',
                        sourceUrl: job.url,
                        isActive: true,
                        firstSeen: new Date(),
                        lastSeen: new Date(),
                        contentHash,
                        canonicalJobId: existingCanonical ? existingCanonical.id : null,
                    },
                });

                await parserQueue.add('parse-job', { jobId: result.id });
                totalIngested++;
            } catch (e: any) {
                logger.warn(`Worker: Failed to ingest Arbeitnow job ${job.slug}`, e);
            }
        });
    });

    logger.info(`Worker: Enqueued ${ingestTasks.length} API jobs for processing. Running with concurrency 5...`);
    await runWithConcurrencyLimit(ingestTasks, 5);

    // 2. Persistent Rotation & Discovery
    const discoveryMode = Math.random() > 0.4;
    
    // Get targets from DB or fallback to initial seeding
    let dbSites = await (prisma as any).careerSite.findMany({
        where: { isActive: true },
        orderBy: [
            { lastScraped: 'asc' },
            { trustScore: 'desc' }
        ],
        take: 10
    });

    if (dbSites.length === 0) {
        logger.info('Worker: Seeding initial career sites...');
        for (const site of TARGET_RESOURCES) {
            await (prisma as any).careerSite.upsert({
                where: { domain: site.site },
                update: {},
                create: {
                    domain: site.site,
                    url: `https://${site.site}`,
                    label: site.label,
                    source: 'manual',
                    trustScore: 0.9
                }
            });
        }
        dbSites = await (prisma as any).careerSite.findMany({ take: 10 });
    }

    const selectedSites = dbSites.map((s: any) => ({ site: s.domain, label: s.label }));
    const selectedRoles = [...new Set([...JOB_ROLES.sort(() => 0.5 - Math.random()).slice(0, 5)])];
    const selectedSeniorities = [...new Set([...SENIORITIES.sort(() => 0.5 - Math.random()).slice(0, 3)])];
    const selectedTypes = [...new Set([...EMPLOYMENT_TYPES.sort(() => 0.5 - Math.random()).slice(0, 2)])];

    const portalTasks: (() => Promise<void>)[] = [];

    // 1.5 Discovery Phase (Find NEW companies and explore sources)
    if (discoveryMode) {
        logger.info('Worker: Entering Autonomous Discovery Phase...');
        const discoveryQueries = [
            'top companies hiring remote interns 2026',
            'venture backed tech startups with remote jobs careers',
            'top engineering career pages 2026 list',
            'fastest growing AI startups careers portal',
            'remote healthcare tech career pages',
            'internships 2026 tech software engineering'
        ];
        const discoQuery = discoveryQueries[Math.floor(Math.random() * discoveryQueries.length)];
        const discoResults = await scrapeWithFirecrawl(discoQuery, 20);
        
        for (const res of discoResults) {
            const url = res.url || res.link;
            if (!url) continue;

            const isKnownPortal = url.includes('lever.co') || url.includes('greenhouse.io') || url.includes('workable.com') || url.includes('careers') || url.includes('jobs');
            
            if (isKnownPortal) {
                try {
                    const hostname = new URL(url).hostname;
                    const domain = hostname.replace(/^www\./, '');
                    
                    if (domain.length > 5 && !domain.includes('google') && !domain.includes('linkedin')) {
                        const site = await (prisma as any).careerSite.upsert({
                            where: { domain },
                            update: { updatedAt: new Date() },
                            create: {
                                domain,
                                url,
                                label: res.title || domain,
                                source: 'discovery',
                                trustScore: 0.6
                            }
                        });
                        logger.info(`Worker: Discovered and ADDED new career portal: ${domain}`);
                        
                        // Add to current cycle if it's new and we have space
                        if (selectedSites.length < 15) {
                            selectedSites.push({ site: domain, label: res.title });
                        }
                    }
                } catch (e) {
                    // skip malformed URLs
                }
            }
        }
    }

    // 2. Scrape Job Portals via Firecrawl with site-specific rotation
    logger.info('Worker: Searching portals via Firecrawl with platform rotation...');
    
    for (const role of selectedRoles) {
        for (const level of selectedSeniorities) {
            for (const type of selectedTypes) {
                for (const target of selectedSites) {
                    // Inclusion of "Remote" and freshness markers ensures we find relevant, active jobs
                    const query = `site:${target.site} "Remote" "${level}" "${role}" "${type}" jobs "last 24 hours" OR "just posted"`;
                    logger.info(`Worker: Executing specialized fresh search: ${query}`);
                    
                    const portalResults = await scrapeWithFirecrawl(query, 15);
                    for (const res of portalResults) {
                        portalTasks.push(async () => {
                            const targetUrl = res.url || res.link;
                            if (!targetUrl) return;

                            const title = (res.title || '').toLowerCase();
                            // Improved Hub Detection: Match numbers, "Jobs in", "Top", etc.
                            const isHub = title.match(/\b\d+\b/) || 
                                         title.includes('jobs in') || 
                                         title.includes('top ') || 
                                         title.includes('best ') ||
                                         title.includes('hiring now') ||
                                         title.includes('search results');

                            if (isHub && !targetUrl.match(/(lever\.co|greenhouse\.io|workable\.com)/)) {
                                logger.info(`Worker: HUB DETECTED: ${res.title}. Expanding...`);
                                const children = await expandHubJobs(targetUrl);
                                logger.info(`Worker: Expanded hub ${targetUrl} into ${children.length} job links.`);
                                
                                for (const childUrl of children) {
                                    if (await processJobUrl(childUrl, res.title.replace(/\d+\s+/, ''), res.company)) {
                                        totalIngested++;
                                    }
                                }
                                return;
                            }

                            if (await processJobUrl(targetUrl, res.title, res.company)) {
                                totalIngested++;
                            }
                        });
                    }
                    
                    // Update lastScraped for this site
                    const domainMatch = dbSites.find((s: any) => s.domain === target.site);
                    if (domainMatch) {
                        await (prisma as any).careerSite.update({
                            where: { id: domainMatch.id },
                            data: { lastScraped: new Date() }
                        });
                    }
                }
            }
        }
    }

    logger.info(`Worker: Enqueued ${portalTasks.length} scraped jobs for processing. Running with concurrency 3...`);
    await runWithConcurrencyLimit(portalTasks, 3);

    // 3. Update Global Skill Demand
    logger.info('Worker: Updating market demand statistics...');
    try {
        await updateMarketDemandStats();
    } catch (err) {
        logger.error('Worker: Failed to update skill demand stats', err);
    }

    logger.info(`--- Worker: Cycle complete. Successfully ingested/updated ${totalIngested} jobs. ---`);
}

// -------------------------------------------------------------
// MAIN WORKER LOOP
// -------------------------------------------------------------
const CRAWL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes between cycles

async function startWorker() {
    const cycleOnce = process.argv.includes('--cycle-once');
    
    logger.info('🤖 Starting Background Job Crawler Worker');
    logger.info(`Configuration: Concurrency=5(API), 3(Scrape), Interval=${CRAWL_INTERVAL_MS/60000}m, Mode=${cycleOnce ? 'One-time' : 'Continuous'}`);
    
    do {
        try {
            const startTime = Date.now();
            await runCrawlCycle();
            const duration = (Date.now() - startTime) / 1000;
            logger.info(`Worker: Cycle finished in ${duration.toFixed(1)}s`);
            
            if (cycleOnce) {
                logger.info('Worker: --cycle-once detected. Powering down...');
                break;
            }

            logger.info(`Worker: Waiting ${CRAWL_INTERVAL_MS / 60000}m before next cycle...`);
            await new Promise(resolve => setTimeout(resolve, CRAWL_INTERVAL_MS));
        } catch (err) {
            logger.error('Worker: CRITICAL error in main loop:', err);
            // Wait a bit before retrying to avoid tight loops on persistent errors
            await new Promise(resolve => setTimeout(resolve, 30000));
        }
    } while (true);
    
    // Ensure the process exits cleanly after a one-off cycle
    if (cycleOnce) {
        process.exit(0);
    }
}

startWorker().catch((err) => {
    logger.error('Worker failed to start', err);
    process.exit(1);
});
