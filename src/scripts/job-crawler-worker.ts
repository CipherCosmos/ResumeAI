import './init-env'; // load .env variables FIRST
import prisma from '../lib/prisma';
import { updateMarketDemandStats } from '../lib/jobs/skill-gap';
import { logger } from '../lib/logger';
import { generateJobFingerprint } from '../lib/jobs/dedup';
import { parserQueue } from '../lib/queue';
import { AIOrchestrator } from '../lib/jobs/orchestrator';
import { MaintenanceService } from '../lib/jobs/maintenance';

import { CrawlerService } from '../lib/jobs/crawler';

const JINA_API_KEY = process.env.JINA_API;

// ─── Query Rotation Config ───────────────────────────
const TARGET_RESOURCES = [
    { site: 'internshala.com', label: 'Internshala' },
    { site: 'unstop.com', label: 'Unstop (Dare2Compete)' },
    { site: 'linkedin.com/jobs', label: 'LinkedIn' },
    { site: 'indeed.com', label: 'Indeed' },
    { site: 'naukri.com', label: 'Naukri' },
    { site: 'foundit.in', label: 'Foundit' },
    { site: 'wellfound.com', label: 'Wellfound' },
    { site: 'otta.com', label: 'Otta' },
    { site: 'hired.com', label: 'Hired' },
    { site: 'toptal.com', label: 'Toptal' },
    { site: 'glassdoor.com/Job', label: 'Glassdoor' },
    { site: 'jobs.lever.co', label: 'Lever ATS' },
    { site: 'boards.greenhouse.io', label: 'Greenhouse ATS' },
    { site: 'workable.com', label: 'Workable ATS' },
    { site: 'smartrecruiters.com', label: 'SmartRecruiters' },
    { site: 'myworkdayjobs.com', label: 'Workday' },
    { site: 'jobs.google.com', label: 'Google Careers' },
    { site: 'amazon.jobs', label: 'Amazon Jobs' },
    { site: 'careers.microsoft.com', label: 'Microsoft Careers' },
    { site: 'metacareers.com', label: 'Meta Careers' },
    { site: 'careers.apple.com', label: 'Apple Careers' },
    { site: 'jobs.netflix.com', label: 'Netflix Jobs' },
    { site: 'careers.jpmorgan.com', label: 'JPMC Careers' },
    { site: 'careers.morganstanley.com', label: 'Morgan Stanley' },
    { site: 'careers.tcs.com', label: 'TCS Careers' },
    { site: 'infosys.com/careers', label: 'Infosys Careers' },
    { site: 'wipro.com/careers', label: 'Wipro Careers' },
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
    'Financial Analyst', 'Investment Banker', 'Marketing Manager',
    'HR Business Partner', 'Operations Associate', 'Legal Counsel',
    'Content Strategist', 'SEO Specialist',
    'Internship', 'Graduate Engineer', 'Research Intern', 'Product Management Intern',
    'New Graduate', 'Batch of 2026', 'Fresher', 'Associate Software Engineer',
    'Graduate Engineer Trainee', 'Junior Developer', 'Management Trainee',
    'Rotational Analyst', 'Leadership Development Program'
];

const SENIORITIES = [
    'Intern', 'Student', 'Entry Level', 'Junior', 'Associate',
    'Senior', 'Staff', 'Principal', 'Fresh Graduate', 'New Grad',
    'Batch of 2026', 'Batch of 2025', 'Class of 2025', 'Class of 2026'
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
    return await CrawlerService.search(query, limit);
}

async function expandHubJobs(url: string | any): Promise<string[]> {
    const targetUrl = typeof url === 'string' ? url : url.url;
    if (visitedUrls.has(targetUrl)) return [];
    visitedUrls.add(targetUrl);
    
    try {
        const isInternshala = targetUrl.includes('internshala.com');
        const isMNC = targetUrl.includes('google.com') || targetUrl.includes('amazon.jobs') || targetUrl.includes('microsoft.com');

        const schema = {
            type: "object",
            properties: {
                job_urls: {
                    type: "array",
                    items: { type: "string" },
                    description: "URLs of individual job detail pages"
                }
            },
            required: ["job_urls"]
        };

        const body: any = {
            url: targetUrl,
            formats: ["json"],
            jsonOptions: { schema }
        };

        // If it's a high-priority board, we might want to wait for content to load
        if (isInternshala || isMNC) {
            body.waitFor = 2000; // Give dynamic content time to breathe
        }

        const result = await CrawlerService.scrape(targetUrl, {
            formats: ["json"],
            jsonOptions: { schema },
            waitFor: (isInternshala || isMNC) ? 2000 : 0
        });

        if (!result || !result.json) return [];
        const extracted = result.json.job_urls || [];
        
        // Filter out obvious noise URLs
        const cleaned = extracted.filter((link: string) => {
            const l = link.toLowerCase();
            return l.includes('/jobs/') || l.includes('/careers/') || l.includes('/positions/') || l.match(/\/\d+/);
        });

        logger.info(`Worker: Hub expansion found ${cleaned.length} filtered links for ${url}`);
        return cleaned;
    } catch (err) {
        logger.error(`Worker: Hub expansion failed for ${url}`, err);
        return [];
    }
}

async function processJobUrl(targetUrl: string, sourceTitle: string, sourceCompany?: string): Promise<boolean> {
    try {
        const markdown = await getMarkdownWithJina(targetUrl);
        if (!markdown || markdown.length < 500) return false;

        // --- REGEX ENHANCEMENT ---
        let finalTitle = sourceTitle;
        let finalCompany = sourceCompany;

        if (!finalTitle || finalTitle.includes('Jobs') || finalTitle.includes('Careers') || finalTitle === 'Unknown Role') {
            const titleMatch = markdown.match(/^#\s+(.+)$/m) || markdown.match(/^(.+)\n={3,}/m);
            if (titleMatch) {
                finalTitle = titleMatch[1].trim();
                logger.info(`Worker: Regex extracted title: ${finalTitle}`);
            }
        }

        if (!finalCompany || finalCompany === 'Scraped Company' || finalCompany === 'Unknown Company') {
            // Priority 1: Meta tags (often cleaner)
            const metaMatch = markdown.match(/brand:\s*([A-Z][\w\s&.-]+)/i);
            if (metaMatch) finalCompany = metaMatch[1].trim();

            if (!finalCompany || finalCompany === 'Unknown Company') {
                // Priority 2: "About [Company]" but with strict multi-word limit to avoid sentences
                const companyMatch = markdown.match(/About\s+([A-Z][A-Za-z0-9\s&]{2,30})(?:\s+is|\r|\n|\.)/);
                if (companyMatch) {
                    finalCompany = companyMatch[1].trim();
                    logger.info(`Worker: Regex extracted company: ${finalCompany}`);
                }
            }
        }

        // --- Basic Meta-data Regex Fallback ---
        let salary = 'Unknown';
        const salaryMatch = markdown.match(/(\$\d{2,3},?\d{3}|\d{2,3}k)\s*(?:-|to)\s*(\$\d{2,3},?\d{3}|\d{2,3}k)/i);
        if (salaryMatch) {
            salary = salaryMatch[0].trim();
            logger.info(`Worker: Regex extracted salary: ${salary}`);
        }

        let experienceLevel = 'Mid';
        if (markdown.match(/intern|student|freshman|sophomore|graduating/i)) experienceLevel = 'Intern';
        else if (markdown.match(/entry level|0-2 years|junior/i)) experienceLevel = 'Entry';
        else if (markdown.match(/senior|staff|principal|lead|8\+ years/i)) experienceLevel = 'Senior';

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
            title: finalTitle,
            company: finalCompany || 'Scraped Company',
            location: 'Remote',
            description: markdown
        });

        const existingJob = await (prisma as any).jobPosting.findFirst({
            where: { sourceUrl: targetUrl }
        });

        if (existingJob && existingJob.contentHash === contentHash) {
            await (prisma as any).jobPosting.update({
                where: { id: existingJob.id },
                data: { lastSeen: new Date(), isActive: true }
            });
            return true;
        }

        if (existingJob) {
            const resResult = await (prisma as any).jobPosting.update({
                where: { id: existingJob.id },
                data: {
                    title: finalTitle,
                    company: finalCompany || 'Scraped Company',
                    description: markdown,
                    contentHash,
                    salary: salary !== 'Unknown' ? salary : existingJob.salary,
                    experienceLevel: experienceLevel !== 'Mid' ? experienceLevel : existingJob.experienceLevel,
                    lastSeen: new Date(),
                    postedAt: existingJob.postedAt || new Date(), // Ensure it's never null
                    isActive: true,
                    updatedAt: new Date()
                }
            });
            await parserQueue.add('parse-job', { jobId: resResult.id });
            return true;
        }

        const resResult = await (prisma as any).jobPosting.create({
            data: {
                externalId: targetUrl,
                title: finalTitle,
                company: finalCompany || 'Scraped Company',
                description: markdown,
                source: 'firecrawl',
                sourceUrl: targetUrl,
                location: 'Remote',
                salary: salary,
                experienceLevel: experienceLevel,
                isActive: true,
                contentHash,
                firstSeen: new Date(),
                lastSeen: new Date(),
                postedAt: new Date() // Default to now so it shows up in UI
            }
        });

        await parserQueue.add('parse-job', { jobId: resResult.id });
        logger.info(`Worker: Ingested detailed job: ${finalTitle} at ${finalCompany || 'Scraped Company'}`);
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
    const portalTasks: (() => Promise<void>)[] = [];

    // --- AI ORCHESTRATION LAYER ---
    let strategy = null;
    try {
        logger.info('Worker: Planning cycle strategy with AI Orchestrator...');
        strategy = await AIOrchestrator.planSearchStrategy();
        if (strategy && strategy.queries.length > 0) {
            logger.info(`Worker: AI Strategist generated ${strategy.queries.length} precision queries.`);
        }
    } catch (err) {
        logger.warn('Worker: AI Strategist failed, falling back to database rotation');
    }

    const queriesToRun = strategy?.queries?.length ? strategy.queries : [];
    
    // If AI fails or returns nothing, fall back to DB-driven rotation
    if (queriesToRun.length === 0) {
        const selectedRoles = [...new Set([...JOB_ROLES.sort(() => 0.5 - Math.random()).slice(0, 5)])];
        const selectedSeniorities = [...new Set([...SENIORITIES.sort(() => 0.5 - Math.random()).slice(0, 3)])];
        const selectedTypes = [...new Set([...EMPLOYMENT_TYPES.sort(() => 0.5 - Math.random()).slice(0, 2)])];
        
        for (const role of selectedRoles) {
            for (const level of selectedSeniorities) {
                for (const type of selectedTypes) {
                    for (const target of selectedSites) {
                        queriesToRun.push(`site:${target.site} "Remote" "${level}" "${role}" "${type}" jobs "last 24 hours" OR "just posted"`);
                    }
                }
            }
        }
    }

    // Limit queries per cycle to avoid API exhaustion
    const activeQueries = queriesToRun.slice(0, 20);
    logger.info(`Worker: Running ${activeQueries.length} search queries...`);

    for (const query of activeQueries) {
        const portalResults = await scrapeWithFirecrawl(query, 10);
        
        // 1.5 Discovery Phase (AI-Driven)
        try {
            const discovered = await AIOrchestrator.discoverCareerHubs(portalResults);
            for (const disco of discovered) {
                const domain = disco.domain.replace(/^www\./, '');
                await (prisma as any).careerSite.upsert({
                    where: { domain },
                    update: { updatedAt: new Date() },
                    create: {
                        domain,
                        url: disco.url,
                        label: disco.label,
                        source: 'discovery_ai',
                        trustScore: 0.7
                    }
                });
                logger.info(`Worker: AI discovered new portal: ${domain} (${disco.reasoning})`);
            }
        } catch (err) {
            // Manual fallback discovery logic
            if (discoveryMode) {
                for (const res of portalResults) {
                    const url = res.url;
                    if (url && (url.includes('lever.co') || url.includes('greenhouse.io') || url.includes('workable.com') || url.includes('careers'))) {
                        const domain = new URL(url).hostname.replace(/^www\./, '');
                        await (prisma as any).careerSite.upsert({
                            where: { domain },
                            update: { updatedAt: new Date() },
                            create: {
                                domain,
                                url,
                                label: res.title || domain,
                                source: 'discovery_manual',
                                trustScore: 0.6
                            }
                        });
                    }
                }
            }
        }

        // 2. Filter & Process Results (AI-Driven)
        let evaluations: any[] = [];
        try {
            evaluations = await AIOrchestrator.evaluateUrls(portalResults.map((r: any) => ({ url: r.url, title: r.title })));
        } catch (err) {
            // Fallback: assume everything might be a job
            evaluations = portalResults.map((r: any) => ({ url: r.url, category: 'job_desc' }));
        }

        for (const res of portalResults) {
            const targetUrl = res.url;
            if (!targetUrl) continue;

            const evaluation = evaluations.find(e => e.url === targetUrl);
            const category = evaluation?.category || 'job_desc';

            if (category === 'other' || category === 'article') {
                logger.info(`Worker: AI filtered out irrelevant page: ${targetUrl}`);
                continue;
            }

            portalTasks.push(async () => {
                const titleLower = (res.title || '').toLowerCase();
                const isHub = category === 'hub' || titleLower.match(/\b\d+\b/) || titleLower.includes('jobs in');

                if (isHub && !targetUrl.match(/(lever\.co|greenhouse\.io|workable\.com)/)) {
                    logger.info(`Worker: HUB DETECTED: ${res.title}. Expanding...`);
                    const children = await expandHubJobs(targetUrl);
                    for (const childUrl of children) {
                        if (await processJobUrl(childUrl, (res.title || '').replace(/\d+\s+/, ''), (res as any).company)) {
                            totalIngested++;
                        }
                    }
                    return;
                }

                if (await processJobUrl(targetUrl, res.title || 'Unknown Role', (res as any).company)) {
                    totalIngested++;
                }
            });
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

async function autonomousCleanup() {
    try {
        logger.info('Worker: Running autonomous cleanup for "Unknown" jobs...');
        const unknownJobs = await (prisma as any).jobPosting.findMany({
            where: {
                OR: [
                    { title: 'Unknown Role' },
                    { company: 'Unknown Company' },
                    { title: { contains: 'Unknown', mode: 'insensitive' } }
                ],
                isActive: true
            },
            take: 20
        });

        if (unknownJobs.length === 0) return;

        logger.info(`Worker: Found ${unknownJobs.length} unknown jobs. Re-queueing for AI parsing...`);
        for (const job of unknownJobs) {
            await parserQueue.add('parse-job', { jobId: job.id });
        }
    } catch (err) {
        logger.error('Worker: Autonomous cleanup failed', err);
    }
}

// -------------------------------------------------------------
// MAIN WORKER LOOP
// -------------------------------------------------------------
const CRAWL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes between cycles

async function startWorker() {
    const cycleOnce = process.argv.includes('--cycle-once');
    
    logger.info('🤖 Starting Background Job Crawler Worker');
    logger.info(`Configuration: Concurrency=5(API), 3(Scrape), Interval=${CRAWL_INTERVAL_MS/60000}m, Mode=${cycleOnce ? 'One-time' : 'Continuous'}`);
    
    let cycleCount = 0;

    do {
        try {
            const startTime = Date.now();
            await runCrawlCycle();
            await autonomousCleanup();
            const duration = (Date.now() - startTime) / 1000;
            logger.info(`Worker: Cycle finished in ${duration.toFixed(1)}s`);
            
            cycleCount++;
            
            // Periodically (every hour/12 cycles) update the Knowledge Base
            if (cycleCount % 12 === 0) {
                logger.info('Worker: Periodic Maintenance Triggered...');
                await MaintenanceService.updateKnowledgeBase();
            }

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
